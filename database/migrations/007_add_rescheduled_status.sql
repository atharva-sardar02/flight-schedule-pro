-- ============================================================================
-- Migration 007: Add RESCHEDULED Status to Bookings
-- ============================================================================
-- Description: Adds RESCHEDULED as a valid booking status
-- Dependencies: 002_create_bookings_table.sql
-- ============================================================================

-- Drop the existing check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new check constraint with RESCHEDULED status
ALTER TABLE bookings 
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('CONFIRMED', 'AT_RISK', 'RESCHEDULING', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'));

