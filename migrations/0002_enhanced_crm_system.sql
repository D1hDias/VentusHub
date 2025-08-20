-- Migration: Enhanced CRM System
-- Adds new fields to client_notes and creates audit/notification tables

-- Adicionar novos campos à tabela client_notes
ALTER TABLE client_notes 
ADD COLUMN IF NOT EXISTS location VARCHAR,
ADD COLUMN IF NOT EXISTS participants TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS call_result VARCHAR,
ADD COLUMN IF NOT EXISTS next_steps TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS completed_by TEXT;

-- Criar novos índices para client_notes
CREATE INDEX IF NOT EXISTS client_notes_type_idx ON client_notes(type);
CREATE INDEX IF NOT EXISTS client_notes_status_idx ON client_notes(status);
CREATE INDEX IF NOT EXISTS client_notes_priority_idx ON client_notes(priority);
CREATE INDEX IF NOT EXISTS client_notes_completed_idx ON client_notes(is_completed);

-- Criar tabela de auditoria para notas de clientes
CREATE TABLE IF NOT EXISTS client_note_audit_logs (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES client_notes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  action VARCHAR NOT NULL,
  field VARCHAR,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tabela de auditoria
CREATE INDEX IF NOT EXISTS client_note_audit_note_id_idx ON client_note_audit_logs(note_id);
CREATE INDEX IF NOT EXISTS client_note_audit_action_idx ON client_note_audit_logs(action);
CREATE INDEX IF NOT EXISTS client_note_audit_created_at_idx ON client_note_audit_logs(created_at);

-- Criar tabela de notificações agendadas
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  related_type VARCHAR NOT NULL,
  related_id INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  notification_type VARCHAR NOT NULL DEFAULT 'in_app',
  status VARCHAR NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tabela de notificações agendadas
CREATE INDEX IF NOT EXISTS scheduled_notifications_user_id_idx ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS scheduled_notifications_scheduled_for_idx ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS scheduled_notifications_status_idx ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS scheduled_notifications_related_idx ON scheduled_notifications(related_type, related_id);

-- Atualizar registros existentes para ter status 'pending'
UPDATE client_notes SET status = 'pending' WHERE status IS NULL;

-- Atualizar registros completos para ter status 'completed'
UPDATE client_notes SET status = 'completed' WHERE is_completed = true AND status = 'pending';

-- Adicionar constraints para garantir integridade
ALTER TABLE client_notes 
ADD CONSTRAINT check_call_result CHECK (
  call_result IS NULL OR 
  call_result IN ('success', 'no_answer', 'busy', 'callback_requested', 'voicemail', 'disconnected')
);

ALTER TABLE client_notes 
ADD CONSTRAINT check_status CHECK (
  status IN ('pending', 'in_progress', 'completed', 'cancelled')
);

ALTER TABLE client_note_audit_logs 
ADD CONSTRAINT check_action CHECK (
  action IN ('created', 'updated', 'status_changed', 'completed', 'cancelled')
);

ALTER TABLE scheduled_notifications 
ADD CONSTRAINT check_related_type CHECK (
  related_type IN ('client_note', 'reminder', 'meeting')
);

ALTER TABLE scheduled_notifications 
ADD CONSTRAINT check_notification_type CHECK (
  notification_type IN ('email', 'push', 'sms', 'in_app')
);

ALTER TABLE scheduled_notifications 
ADD CONSTRAINT check_notification_status CHECK (
  status IN ('pending', 'sent', 'failed', 'cancelled')
);

-- Comentários para documentação
COMMENT ON TABLE client_note_audit_logs IS 'Rastreamento de mudanças nas notas de clientes para auditoria';
COMMENT ON TABLE scheduled_notifications IS 'Sistema de notificações agendadas para lembretes e reuniões';
COMMENT ON COLUMN client_notes.metadata IS 'Dados estruturados específicos por tipo de nota';
COMMENT ON COLUMN client_notes.status IS 'Status da nota: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN client_notes.location IS 'Local para reuniões ou endereço';
COMMENT ON COLUMN client_notes.participants IS 'Lista de participantes em reuniões';
COMMENT ON COLUMN client_notes.duration IS 'Duração de ligações em minutos';
COMMENT ON COLUMN client_notes.call_result IS 'Resultado da ligação';
COMMENT ON COLUMN client_notes.next_steps IS 'Próximos passos acordados';