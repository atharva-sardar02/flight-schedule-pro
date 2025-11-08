-- ============================================================================
-- Seed Data: Development Availability
-- ============================================================================
-- Description: Creates sample availability patterns for instructors and students
--              Includes weekly recurring patterns and one-time overrides
-- ============================================================================

-- Note: Uses user IDs from dev_users.sql seed file
-- Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

-- ============================================================================
-- INSTRUCTOR 1 AVAILABILITY (John Smith) - Using unified availability_patterns table
-- ============================================================================
-- Available Monday-Friday, 9 AM - 5 PM
INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 1, '09:00:00', '17:00:00', true), -- Monday
    ('550e8400-e29b-41d4-a716-446655440001', 2, '09:00:00', '17:00:00', true), -- Tuesday
    ('550e8400-e29b-41d4-a716-446655440001', 3, '09:00:00', '17:00:00', true), -- Wednesday
    ('550e8400-e29b-41d4-a716-446655440001', 4, '09:00:00', '17:00:00', true), -- Thursday
    ('550e8400-e29b-41d4-a716-446655440001', 5, '09:00:00', '17:00:00', true) -- Friday
ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;

-- ============================================================================
-- INSTRUCTOR 2 AVAILABILITY (Sarah Johnson) - Using unified availability_patterns table
-- ============================================================================
-- Available Tuesday-Thursday, 8 AM - 4 PM, and Saturday 10 AM - 2 PM
INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 2, '08:00:00', '16:00:00', true), -- Tuesday
    ('550e8400-e29b-41d4-a716-446655440002', 3, '08:00:00', '16:00:00', true), -- Wednesday
    ('550e8400-e29b-41d4-a716-446655440002', 4, '08:00:00', '16:00:00', true), -- Thursday
    ('550e8400-e29b-41d4-a716-446655440002', 6, '10:00:00', '14:00:00', true) -- Saturday
ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;

-- ============================================================================
-- STUDENT 1 AVAILABILITY (Michael Brown) - Using unified availability_patterns table
-- ============================================================================
-- Available Monday, Wednesday, Friday afternoons, and Saturday mornings
INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', 1, '13:00:00', '17:00:00', true), -- Monday afternoon
    ('550e8400-e29b-41d4-a716-446655440003', 3, '13:00:00', '17:00:00', true), -- Wednesday afternoon
    ('550e8400-e29b-41d4-a716-446655440003', 5, '13:00:00', '17:00:00', true), -- Friday afternoon
    ('550e8400-e29b-41d4-a716-446655440003', 6, '09:00:00', '12:00:00', true) -- Saturday morning
ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;

-- ============================================================================
-- STUDENT 2 AVAILABILITY (Emily Davis) - Using unified availability_patterns table
-- ============================================================================
-- Available Tuesday-Thursday mornings and Saturday all day
INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440004', 2, '09:00:00', '12:00:00', true), -- Tuesday morning
    ('550e8400-e29b-41d4-a716-446655440004', 3, '09:00:00', '12:00:00', true), -- Wednesday morning
    ('550e8400-e29b-41d4-a716-446655440004', 4, '09:00:00', '12:00:00', true), -- Thursday morning
    ('550e8400-e29b-41d4-a716-446655440004', 6, '08:00:00', '17:00:00', true) -- Saturday all day
ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;

-- ============================================================================
-- STUDENT 3 AVAILABILITY (David Wilson) - Using unified availability_patterns table
-- ============================================================================
-- Available Monday-Friday evenings
INSERT INTO availability_patterns (user_id, day_of_week, start_time, end_time, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440005', 1, '17:00:00', '20:00:00', true), -- Monday evening
    ('550e8400-e29b-41d4-a716-446655440005', 2, '17:00:00', '20:00:00', true), -- Tuesday evening
    ('550e8400-e29b-41d4-a716-446655440005', 3, '17:00:00', '20:00:00', true), -- Wednesday evening
    ('550e8400-e29b-41d4-a716-446655440005', 4, '17:00:00', '20:00:00', true), -- Thursday evening
    ('550e8400-e29b-41d4-a716-446655440005', 5, '17:00:00', '20:00:00', true) -- Friday evening
ON CONFLICT (user_id, day_of_week, start_time, end_time) DO NOTHING;

-- ============================================================================
-- AVAILABILITY OVERRIDES (One-time exceptions)
-- ============================================================================

-- Instructor 1 not available on a specific date (holiday) - Idempotent
INSERT INTO availability_overrides (user_id, override_date, start_time, end_time, is_blocked, reason) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '7 days', '00:00:00', '23:59:59', true, 'Holiday - Not available')
ON CONFLICT (user_id, override_date, start_time, end_time) DO NOTHING;

-- Student 1 not available on a specific afternoon (personal appointment) - Idempotent
INSERT INTO availability_overrides (user_id, override_date, start_time, end_time, is_blocked, reason) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE + INTERVAL '3 days', '14:00:00', '16:00:00', true, 'Personal appointment')
ON CONFLICT (user_id, override_date, start_time, end_time) DO NOTHING;

-- Student 2 available on a normally unavailable day (special availability) - Idempotent
INSERT INTO availability_overrides (user_id, override_date, start_time, end_time, is_blocked, reason) VALUES
    ('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE + INTERVAL '5 days', '10:00:00', '14:00:00', false, 'Special availability - can make exception')
ON CONFLICT (user_id, override_date, start_time, end_time) DO NOTHING;

