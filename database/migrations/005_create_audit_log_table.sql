-- ============================================================================
-- Migration 005: Create Audit Log Table
-- ============================================================================
-- Description: Creates the audit_log table for complete event tracking
--              Immutable log of all system actions for accountability
-- Dependencies: 001_create_users_table.sql
-- ============================================================================

-- Create audit_log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'user', 'availability', etc.
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data JSONB, -- Flexible JSON for event-specific data
    metadata JSONB, -- IP address, correlation ID, user agent, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_log
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);

