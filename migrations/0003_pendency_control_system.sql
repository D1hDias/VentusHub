-- ========================================
-- MIGRATION: Pendency Control System
-- Version: 0003
-- Description: Initialize comprehensive pendency tracking system
-- ========================================

-- Check if pendency tables already exist
DO $$
BEGIN
    -- Only proceed if stage_requirements table doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stage_requirements') THEN
        
        -- Tables are already created in schema.ts, so we'll just add indexes and seed data
        
        -- Add additional indexes for performance
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_requirements_last_checked 
        ON property_requirements(last_checked_at);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stage_completion_last_updated 
        ON stage_completion_metrics(last_updated);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pendency_notifications_type_severity 
        ON pendency_notifications(notification_type, severity);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stage_advancement_validation 
        ON stage_advancement_log(validation_status, advancement_type);
        
        -- Insert default stage requirements
        INSERT INTO stage_requirements (stage_id, requirement_key, requirement_name, description, category, is_critical, validation_rules, property_types) VALUES
        -- STAGE 1: CAPTAÇÃO
        (1, 'PROPERTY_BASIC_INFO', 'Informações Básicas do Imóvel', 'Dados essenciais: tipo, endereço, valor, área', 'DATA', true, '{"requiredFields": ["type", "street", "number", "neighborhood", "city", "state", "cep", "value"], "minValue": 1000}', '*'),
        (1, 'PROPERTY_OWNERS', 'Proprietários Cadastrados', 'Pelo menos um proprietário com dados completos', 'DATA', true, '{"minOwners": 1, "requiredOwnerFields": ["fullName", "cpf", "phone"]}', '*'),
        (1, 'PROPERTY_REGISTRATION', 'Números de Registro', 'IPTU e inscrição municipal obrigatórios', 'DATA', true, '{"requiredFields": ["registrationNumber", "municipalRegistration"]}', '*'),
        
        -- STAGE 2: DUE DILIGENCE
        (2, 'PROPERTY_DOCUMENTS', 'Documentos Básicos', 'Matrícula, IPTU, certidões básicas', 'DOCUMENT', true, '{"requiredDocTypes": ["MATRICULA", "IPTU", "CERTIDAO_NEGATIVA"], "minDocuments": 3}', '*'),
        (2, 'LEGAL_VALIDATION', 'Validação Jurídica', 'Análise de documentos e situação legal', 'VALIDATION', true, '{"requiresManualApproval": true}', '*'),
        (2, 'TECHNICAL_EVALUATION', 'Avaliação Técnica', 'Vistoria técnica e avaliação de valor', 'VALIDATION', false, '{"requiresManualApproval": true}', '*'),
        
        -- STAGE 3: MERCADO
        (3, 'MARKET_PRICE', 'Precificação de Mercado', 'Valor de mercado definido e aprovado', 'VALIDATION', true, '{"requiresApproval": true, "minValue": 50000}', '*'),
        (3, 'MARKETING_MATERIAL', 'Material de Marketing', 'Fotos, descrição e material promocional', 'DOCUMENT', false, '{"minPhotos": 5}', '*'),
        (3, 'LISTING_APPROVAL', 'Aprovação para Listagem', 'Autorização final para exposição no mercado', 'APPROVAL', true, '{"requiresManagerApproval": true}', '*'),
        
        -- STAGE 4: PROPOSTAS
        (4, 'PROPOSAL_ANALYSIS', 'Análise de Propostas', 'Avaliação e validação das propostas recebidas', 'VALIDATION', true, '{"requiresApproval": true}', '*'),
        (4, 'BUYER_QUALIFICATION', 'Qualificação do Comprador', 'Verificação da capacidade financeira do comprador', 'VALIDATION', true, '{"requiresCreditCheck": true}', '*'),
        
        -- STAGE 5: CONTRATOS
        (5, 'CONTRACT_DRAFT', 'Minuta de Contrato', 'Elaboração da minuta contratual', 'DOCUMENT', true, '{"requiresLegalReview": true}', '*'),
        (5, 'PARTIES_APPROVAL', 'Aprovação das Partes', 'Acordo e assinatura de vendedor e comprador', 'APPROVAL', true, '{"requiresBothParties": true}', '*'),
        
        -- STAGE 6: FINANCIAMENTO
        (6, 'FINANCING_DOCS', 'Documentos para Financiamento', 'Documentação completa para análise bancária', 'DOCUMENT', true, '{"requiredDocs": ["RG", "CPF", "COMPROVANTE_RENDA", "COMPROVANTE_RESIDENCIA"]}', '*'),
        (6, 'BANK_APPROVAL', 'Aprovação Bancária', 'Financiamento aprovado pela instituição financeira', 'APPROVAL', true, '{"requiresBankApproval": true}', '*'),
        
        -- STAGE 7: INSTRUMENTO
        (7, 'DEED_PREPARATION', 'Preparação da Escritura', 'Elaboração da escritura pública', 'DOCUMENT', true, '{"requiresNotary": true}', '*'),
        (7, 'FINAL_PAYMENT', 'Pagamento Final', 'Liquidação financeira da transação', 'VALIDATION', true, '{"requiresPaymentConfirmation": true}', '*'),
        
        -- STAGE 8: CONCLUÍDO
        (8, 'REGISTRY_TRANSFER', 'Transferência de Registro', 'Registro da transferência no cartório', 'DOCUMENT', true, '{"requiresRegistryOffice": true}', '*'),
        (8, 'TRANSACTION_CLOSURE', 'Fechamento da Transação', 'Finalização completa do processo', 'APPROVAL', true, '{"requiresFinalApproval": true}', '*')
        
        ON CONFLICT (stage_id, requirement_key) DO NOTHING;
        
        RAISE NOTICE 'Pendency control system migration completed successfully';
        
    ELSE
        RAISE NOTICE 'Pendency control system tables already exist, skipping creation';
    END IF;
    
END $$;

-- Create function to initialize property requirements for existing properties
CREATE OR REPLACE FUNCTION initialize_property_pendency_tracking()
RETURNS void AS $$
DECLARE
    prop_record RECORD;
    req_record RECORD;
    req_count INTEGER;
BEGIN
    -- Loop through all properties that don't have pendency tracking
    FOR prop_record IN 
        SELECT DISTINCT p.id, p.type 
        FROM properties p
        LEFT JOIN property_requirements pr ON pr.property_id = p.id
        WHERE pr.property_id IS NULL
    LOOP
        -- Get requirements applicable to this property type
        req_count := 0;
        FOR req_record IN 
            SELECT id, stage_id 
            FROM stage_requirements 
            WHERE property_types = '*' OR property_types LIKE '%' || prop_record.type || '%'
        LOOP
            -- Insert property requirement
            INSERT INTO property_requirements (
                property_id, 
                requirement_id, 
                stage_id, 
                status, 
                completion_percentage, 
                last_checked_at,
                created_at,
                updated_at
            ) VALUES (
                prop_record.id,
                req_record.id,
                req_record.stage_id,
                'PENDING',
                0,
                NOW(),
                NOW(),
                NOW()
            );
            
            req_count := req_count + 1;
        END LOOP;
        
        -- Initialize stage completion metrics for all stages
        FOR i IN 1..8 LOOP
            INSERT INTO stage_completion_metrics (
                property_id,
                stage_id,
                total_requirements,
                completed_requirements,
                critical_requirements,
                completed_critical,
                completion_percentage,
                critical_completion_percentage,
                can_advance,
                blocking_requirements,
                last_updated
            ) VALUES (
                prop_record.id,
                i,
                0, 0, 0, 0, 0.00, 0.00, false, 0,
                NOW()
            ) ON CONFLICT (property_id, stage_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Initialized pendency tracking for property % with % requirements', prop_record.id, req_count;
    END LOOP;
    
    RAISE NOTICE 'Property pendency tracking initialization completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to update stage completion metrics
CREATE OR REPLACE FUNCTION update_property_stage_metrics(prop_id INTEGER, stage_id_param INTEGER DEFAULT NULL)
RETURNS void AS $$
DECLARE
    stage_to_update INTEGER;
    total_reqs INTEGER;
    completed_reqs INTEGER;
    critical_reqs INTEGER;
    completed_critical INTEGER;
    completion_pct DECIMAL(5,2);
    critical_completion_pct DECIMAL(5,2);
    blocking_count INTEGER;
    can_advance_flag BOOLEAN;
BEGIN
    -- If no specific stage provided, update all stages
    FOR stage_to_update IN 
        SELECT CASE WHEN stage_id_param IS NULL THEN generate_series(1,8) ELSE stage_id_param END
    LOOP
        -- Calculate metrics for this stage
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN pr.status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN sr.is_critical THEN 1 END) as critical,
            COUNT(CASE WHEN sr.is_critical AND pr.status = 'COMPLETED' THEN 1 END) as completed_critical
        INTO total_reqs, completed_reqs, critical_reqs, completed_critical
        FROM stage_requirements sr
        LEFT JOIN property_requirements pr ON pr.requirement_id = sr.id AND pr.property_id = prop_id
        WHERE sr.stage_id = stage_to_update;
        
        -- Calculate percentages
        completion_pct := CASE WHEN total_reqs > 0 THEN ROUND((completed_reqs::DECIMAL / total_reqs) * 100, 2) ELSE 100.00 END;
        critical_completion_pct := CASE WHEN critical_reqs > 0 THEN ROUND((completed_critical::DECIMAL / critical_reqs) * 100, 2) ELSE 100.00 END;
        
        -- Count blocking requirements
        SELECT COUNT(*) INTO blocking_count
        FROM stage_requirements sr
        LEFT JOIN property_requirements pr ON pr.requirement_id = sr.id AND pr.property_id = prop_id
        WHERE sr.stage_id = stage_to_update 
        AND sr.is_critical 
        AND (pr.status IS NULL OR pr.status != 'COMPLETED');
        
        -- Can advance if no blocking requirements
        can_advance_flag := (blocking_count = 0);
        
        -- Update or insert metrics
        INSERT INTO stage_completion_metrics (
            property_id, stage_id, total_requirements, completed_requirements,
            critical_requirements, completed_critical, completion_percentage,
            critical_completion_percentage, can_advance, blocking_requirements, last_updated
        ) VALUES (
            prop_id, stage_to_update, total_reqs, completed_reqs,
            critical_reqs, completed_critical, completion_pct,
            critical_completion_pct, can_advance_flag, blocking_count, NOW()
        ) ON CONFLICT (property_id, stage_id) 
        DO UPDATE SET
            total_requirements = EXCLUDED.total_requirements,
            completed_requirements = EXCLUDED.completed_requirements,
            critical_requirements = EXCLUDED.critical_requirements,
            completed_critical = EXCLUDED.completed_critical,
            completion_percentage = EXCLUDED.completion_percentage,
            critical_completion_percentage = EXCLUDED.critical_completion_percentage,
            can_advance = EXCLUDED.can_advance,
            blocking_requirements = EXCLUDED.blocking_requirements,
            last_updated = EXCLUDED.last_updated;
    END LOOP;
    
    -- If we updated a specific stage and it's the final stage, exit
    IF stage_id_param IS NOT NULL THEN
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update metrics when requirements change
CREATE OR REPLACE FUNCTION trigger_update_stage_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update metrics for the affected property
    PERFORM update_property_stage_metrics(
        CASE WHEN TG_OP = 'DELETE' THEN OLD.property_id ELSE NEW.property_id END,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.stage_id ELSE NEW.stage_id END
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS tr_property_requirements_update_metrics ON property_requirements;
CREATE TRIGGER tr_property_requirements_update_metrics
    AFTER INSERT OR UPDATE OR DELETE ON property_requirements
    FOR EACH ROW EXECUTE FUNCTION trigger_update_stage_metrics();

-- Create cleanup function for old notifications
CREATE OR REPLACE FUNCTION cleanup_old_pendency_notifications()
RETURNS void AS $$
BEGIN
    -- Mark auto-resolvable notifications as resolved
    UPDATE pendency_notifications 
    SET is_resolved = true, resolved_at = NOW(), updated_at = NOW()
    WHERE is_resolved = false 
    AND auto_resolve_at IS NOT NULL 
    AND auto_resolve_at < NOW();
    
    -- Delete old resolved notifications (older than 30 days)
    DELETE FROM pendency_notifications 
    WHERE is_resolved = true 
    AND resolved_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Pendency notifications cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Initialize tracking for existing properties
SELECT initialize_property_pendency_tracking();

-- Update metrics for all initialized properties
DO $$
DECLARE
    prop_id INTEGER;
BEGIN
    FOR prop_id IN SELECT DISTINCT property_id FROM property_requirements LOOP
        PERFORM update_property_stage_metrics(prop_id);
    END LOOP;
    
    RAISE NOTICE 'Stage completion metrics updated for all properties';
END $$;

-- Final success message
RAISE NOTICE '========================================';
RAISE NOTICE 'PENDENCY CONTROL SYSTEM MIGRATION COMPLETE';
RAISE NOTICE 'Tables: stage_requirements, property_requirements, stage_completion_metrics, stage_advancement_log, pendency_notifications';
RAISE NOTICE 'Functions: initialize_property_pendency_tracking, update_property_stage_metrics, cleanup_old_pendency_notifications';
RAISE NOTICE 'Triggers: property_requirements change detection';
RAISE NOTICE '========================================';