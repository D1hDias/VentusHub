-- Migration: VentusHub Pendency Control System
-- Description: Add pendency tracking tables for property pipeline stages
-- Date: 2025-01-17

-- ======================================
-- STAGE REQUIREMENTS TABLE
-- ======================================
-- Defines what requirements must be met for each stage
CREATE TABLE stage_requirements (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER NOT NULL CHECK (stage_id >= 1 AND stage_id <= 8),
    requirement_key VARCHAR(100) NOT NULL, -- e.g., 'owner_docs', 'property_docs', 'iptu_current'
    requirement_name VARCHAR(255) NOT NULL, -- Human-readable name
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'DOCUMENT', 'DATA', 'VALIDATION', 'APPROVAL'
    is_critical BOOLEAN NOT NULL DEFAULT true, -- Critical requirements block stage advancement
    validation_rules JSONB, -- JSON rules for automatic validation
    property_types VARCHAR(255), -- Comma-separated list: 'apartamento,casa' or '*' for all
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(stage_id, requirement_key)
);

-- Index for performance
CREATE INDEX idx_stage_requirements_stage ON stage_requirements(stage_id);
CREATE INDEX idx_stage_requirements_critical ON stage_requirements(is_critical);

-- ======================================
-- PROPERTY REQUIREMENTS STATUS TABLE  
-- ======================================
-- Tracks completion status of requirements per property
CREATE TABLE property_requirements (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    requirement_id INTEGER NOT NULL REFERENCES stage_requirements(id) ON DELETE CASCADE,
    stage_id INTEGER NOT NULL CHECK (stage_id >= 1 AND stage_id <= 8),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'NOT_APPLICABLE', 'FAILED'
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    validation_data JSONB, -- Store validation results and metadata
    notes TEXT,
    completed_by TEXT, -- User ID who marked as complete
    completed_at TIMESTAMP WITH TIME ZONE,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(property_id, requirement_id)
);

-- Indexes for performance
CREATE INDEX idx_property_requirements_property ON property_requirements(property_id);
CREATE INDEX idx_property_requirements_stage ON property_requirements(stage_id);
CREATE INDEX idx_property_requirements_status ON property_requirements(status);
CREATE INDEX idx_property_requirements_critical ON property_requirements(property_id, stage_id);

-- ======================================
-- STAGE ADVANCEMENT LOG TABLE
-- ======================================
-- Audit trail for stage changes with pendency validation
CREATE TABLE stage_advancement_log (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    from_stage INTEGER CHECK (from_stage >= 1 AND from_stage <= 8),
    to_stage INTEGER NOT NULL CHECK (to_stage >= 1 AND to_stage <= 8),
    user_id TEXT NOT NULL, -- Who initiated the advancement
    advancement_type VARCHAR(20) NOT NULL, -- 'AUTOMATIC', 'MANUAL', 'OVERRIDE'
    validation_status VARCHAR(20) NOT NULL, -- 'PASSED', 'FAILED', 'OVERRIDDEN'
    pending_critical_count INTEGER DEFAULT 0,
    pending_non_critical_count INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    validation_results JSONB, -- Detailed validation results
    override_reason TEXT, -- Required for OVERRIDE type
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_stage_advancement_property ON stage_advancement_log(property_id);
CREATE INDEX idx_stage_advancement_date ON stage_advancement_log(created_at);
CREATE INDEX idx_stage_advancement_user ON stage_advancement_log(user_id);

-- ======================================
-- PENDENCY NOTIFICATIONS TABLE
-- ======================================
-- Track automatic notifications for pending requirements
CREATE TABLE pendency_notifications (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    requirement_id INTEGER NOT NULL REFERENCES stage_requirements(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'MISSING_DOCUMENT', 'VALIDATION_FAILED', 'STAGE_BLOCKED'
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500), -- Deep link to resolve the pendency
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    auto_resolve_at TIMESTAMP WITH TIME ZONE, -- For automatic resolution
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification queries
CREATE INDEX idx_pendency_notifications_property ON pendency_notifications(property_id);
CREATE INDEX idx_pendency_notifications_user ON pendency_notifications(user_id);
CREATE INDEX idx_pendency_notifications_unread ON pendency_notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_pendency_notifications_severity ON pendency_notifications(severity);

-- ======================================
-- STAGE COMPLETION METRICS TABLE
-- ======================================
-- Cached metrics for performance (updated via triggers)
CREATE TABLE stage_completion_metrics (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    stage_id INTEGER NOT NULL CHECK (stage_id >= 1 AND stage_id <= 8),
    total_requirements INTEGER NOT NULL DEFAULT 0,
    completed_requirements INTEGER NOT NULL DEFAULT 0,
    critical_requirements INTEGER NOT NULL DEFAULT 0,
    completed_critical INTEGER NOT NULL DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    critical_completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    can_advance BOOLEAN DEFAULT false,
    blocking_requirements INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(property_id, stage_id)
);

-- Indexes for metrics queries
CREATE INDEX idx_stage_completion_property ON stage_completion_metrics(property_id);
CREATE INDEX idx_stage_completion_stage ON stage_completion_metrics(stage_id);
CREATE INDEX idx_stage_completion_can_advance ON stage_completion_metrics(can_advance);

-- ======================================
-- FUNCTIONS FOR METRICS CALCULATION
-- ======================================

-- Function to calculate completion metrics for a property stage
CREATE OR REPLACE FUNCTION calculate_stage_completion(p_property_id INTEGER, p_stage_id INTEGER)
RETURNS TABLE(
    total_reqs INTEGER,
    completed_reqs INTEGER,
    critical_reqs INTEGER,
    completed_critical INTEGER,
    completion_pct DECIMAL(5,2),
    critical_completion_pct DECIMAL(5,2),
    can_advance_stage BOOLEAN,
    blocking_count INTEGER
) AS $$
DECLARE
    v_total_requirements INTEGER := 0;
    v_completed_requirements INTEGER := 0;
    v_critical_requirements INTEGER := 0;
    v_completed_critical INTEGER := 0;
    v_completion_percentage DECIMAL(5,2) := 0.00;
    v_critical_completion_percentage DECIMAL(5,2) := 0.00;
    v_can_advance BOOLEAN := false;
    v_blocking_requirements INTEGER := 0;
    v_property_type VARCHAR(50);
BEGIN
    -- Get property type for filtering
    SELECT type INTO v_property_type FROM properties WHERE id = p_property_id;
    
    -- Count total applicable requirements for this stage
    SELECT COUNT(*) INTO v_total_requirements
    FROM stage_requirements sr
    WHERE sr.stage_id = p_stage_id
    AND (sr.property_types = '*' OR sr.property_types LIKE '%' || v_property_type || '%');
    
    -- Count critical requirements
    SELECT COUNT(*) INTO v_critical_requirements
    FROM stage_requirements sr
    WHERE sr.stage_id = p_stage_id
    AND sr.is_critical = true
    AND (sr.property_types = '*' OR sr.property_types LIKE '%' || v_property_type || '%');
    
    -- Count completed requirements
    SELECT COUNT(*) INTO v_completed_requirements
    FROM property_requirements pr
    JOIN stage_requirements sr ON pr.requirement_id = sr.id
    WHERE pr.property_id = p_property_id
    AND pr.stage_id = p_stage_id
    AND pr.status = 'COMPLETED'
    AND (sr.property_types = '*' OR sr.property_types LIKE '%' || v_property_type || '%');
    
    -- Count completed critical requirements
    SELECT COUNT(*) INTO v_completed_critical
    FROM property_requirements pr
    JOIN stage_requirements sr ON pr.requirement_id = sr.id
    WHERE pr.property_id = p_property_id
    AND pr.stage_id = p_stage_id
    AND pr.status = 'COMPLETED'
    AND sr.is_critical = true
    AND (sr.property_types = '*' OR sr.property_types LIKE '%' || v_property_type || '%');
    
    -- Calculate percentages
    IF v_total_requirements > 0 THEN
        v_completion_percentage := (v_completed_requirements::DECIMAL / v_total_requirements) * 100;
    END IF;
    
    IF v_critical_requirements > 0 THEN
        v_critical_completion_percentage := (v_completed_critical::DECIMAL / v_critical_requirements) * 100;
    END IF;
    
    -- Calculate blocking requirements (critical requirements not completed)
    v_blocking_requirements := v_critical_requirements - v_completed_critical;
    
    -- Can advance if all critical requirements are completed
    v_can_advance := (v_blocking_requirements = 0);
    
    RETURN QUERY SELECT 
        v_total_requirements,
        v_completed_requirements,
        v_critical_requirements,
        v_completed_critical,
        v_completion_percentage,
        v_critical_completion_percentage,
        v_can_advance,
        v_blocking_requirements;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh metrics for a property stage
CREATE OR REPLACE FUNCTION refresh_stage_metrics(p_property_id INTEGER, p_stage_id INTEGER)
RETURNS VOID AS $$
DECLARE
    metrics RECORD;
BEGIN
    -- Calculate metrics
    SELECT * INTO metrics FROM calculate_stage_completion(p_property_id, p_stage_id);
    
    -- Upsert metrics
    INSERT INTO stage_completion_metrics (
        property_id, stage_id, total_requirements, completed_requirements,
        critical_requirements, completed_critical, completion_percentage,
        critical_completion_percentage, can_advance, blocking_requirements,
        last_updated
    ) VALUES (
        p_property_id, p_stage_id, metrics.total_reqs, metrics.completed_reqs,
        metrics.critical_reqs, metrics.completed_critical, metrics.completion_pct,
        metrics.critical_completion_pct, metrics.can_advance_stage, metrics.blocking_count,
        NOW()
    )
    ON CONFLICT (property_id, stage_id) 
    DO UPDATE SET
        total_requirements = EXCLUDED.total_requirements,
        completed_requirements = EXCLUDED.completed_requirements,
        critical_requirements = EXCLUDED.critical_requirements,
        completed_critical = EXCLUDED.completed_critical,
        completion_percentage = EXCLUDED.completion_percentage,
        critical_completion_percentage = EXCLUDED.critical_completion_percentage,
        can_advance = EXCLUDED.can_advance,
        blocking_requirements = EXCLUDED.blocking_requirements,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ======================================

-- Function to automatically update metrics when requirements change
CREATE OR REPLACE FUNCTION trigger_refresh_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh metrics for the affected property/stage
    PERFORM refresh_stage_metrics(
        COALESCE(NEW.property_id, OLD.property_id),
        COALESCE(NEW.stage_id, OLD.stage_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on property_requirements changes
CREATE TRIGGER tr_property_requirements_metrics
    AFTER INSERT OR UPDATE OR DELETE ON property_requirements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_metrics();

-- Function to initialize requirements when property is created
CREATE OR REPLACE FUNCTION initialize_property_requirements()
RETURNS TRIGGER AS $$
DECLARE
    req RECORD;
BEGIN
    -- Create requirement entries for current stage
    FOR req IN 
        SELECT id, stage_id FROM stage_requirements 
        WHERE stage_id = NEW.currentStage
        AND (property_types = '*' OR property_types LIKE '%' || NEW.type || '%')
    LOOP
        INSERT INTO property_requirements (
            property_id, requirement_id, stage_id, status
        ) VALUES (
            NEW.id, req.id, req.stage_id, 'PENDING'
        ) ON CONFLICT (property_id, requirement_id) DO NOTHING;
    END LOOP;
    
    -- Initialize metrics for current stage
    PERFORM refresh_stage_metrics(NEW.id, NEW.currentStage);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on property creation
CREATE TRIGGER tr_property_init_requirements
    AFTER INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION initialize_property_requirements();

-- Function to handle stage advancement
CREATE OR REPLACE FUNCTION handle_stage_advancement()
RETURNS TRIGGER AS $$
DECLARE
    req RECORD;
    metrics RECORD;
BEGIN
    -- Only process if currentStage changed
    IF OLD.currentStage != NEW.currentStage THEN
        
        -- Get current stage metrics to validate advancement
        SELECT * INTO metrics FROM calculate_stage_completion(NEW.id, OLD.currentStage);
        
        -- Log the advancement
        INSERT INTO stage_advancement_log (
            property_id, from_stage, to_stage, user_id, advancement_type,
            validation_status, pending_critical_count, pending_non_critical_count,
            completion_percentage, validation_results
        ) VALUES (
            NEW.id, OLD.currentStage, NEW.currentStage, 'system', 'AUTOMATIC',
            CASE WHEN metrics.can_advance_stage THEN 'PASSED' ELSE 'OVERRIDDEN' END,
            metrics.blocking_count,
            metrics.total_reqs - metrics.completed_reqs - metrics.blocking_count,
            metrics.completion_pct,
            jsonb_build_object(
                'total_requirements', metrics.total_reqs,
                'completed_requirements', metrics.completed_reqs,
                'critical_requirements', metrics.critical_reqs,
                'completed_critical', metrics.completed_critical
            )
        );
        
        -- Initialize requirements for new stage
        FOR req IN 
            SELECT id, stage_id FROM stage_requirements 
            WHERE stage_id = NEW.currentStage
            AND (property_types = '*' OR property_types LIKE '%' || NEW.type || '%')
        LOOP
            INSERT INTO property_requirements (
                property_id, requirement_id, stage_id, status
            ) VALUES (
                NEW.id, req.id, req.stage_id, 'PENDING'
            ) ON CONFLICT (property_id, requirement_id) DO NOTHING;
        END LOOP;
        
        -- Refresh metrics for new stage
        PERFORM refresh_stage_metrics(NEW.id, NEW.currentStage);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on property stage changes
CREATE TRIGGER tr_property_stage_advancement
    AFTER UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION handle_stage_advancement();

-- ======================================
-- COMMENTS FOR DOCUMENTATION
-- ======================================

COMMENT ON TABLE stage_requirements IS 'Defines requirements that must be met for each pipeline stage';
COMMENT ON TABLE property_requirements IS 'Tracks completion status of requirements per property';
COMMENT ON TABLE stage_advancement_log IS 'Audit trail for property stage advancements';
COMMENT ON TABLE pendency_notifications IS 'Notifications for pending requirements';
COMMENT ON TABLE stage_completion_metrics IS 'Cached completion metrics for performance';

COMMENT ON COLUMN stage_requirements.requirement_key IS 'Unique identifier for the requirement type';
COMMENT ON COLUMN stage_requirements.is_critical IS 'Critical requirements must be completed to advance stages';
COMMENT ON COLUMN stage_requirements.validation_rules IS 'JSON rules for automatic validation';
COMMENT ON COLUMN stage_requirements.property_types IS 'Applicable property types (* for all)';

COMMENT ON COLUMN property_requirements.completion_percentage IS 'Percentage completion for complex requirements';
COMMENT ON COLUMN property_requirements.validation_data IS 'Validation results and metadata';

COMMENT ON COLUMN stage_advancement_log.advancement_type IS 'AUTOMATIC, MANUAL, or OVERRIDE';
COMMENT ON COLUMN stage_advancement_log.validation_status IS 'PASSED, FAILED, or OVERRIDDEN';

COMMENT ON FUNCTION calculate_stage_completion IS 'Calculates completion metrics for a property stage';
COMMENT ON FUNCTION refresh_stage_metrics IS 'Updates cached metrics for a property stage';