-- ============================================================================
-- Seed Data: Development Users
-- ============================================================================
-- Description: Creates sample users for development and testing
--              Includes 2 instructors, 3 students, and 1 admin
-- ============================================================================

-- Note: These are placeholder Cognito User IDs. In real development,
-- you would use actual Cognito User Pool user IDs from AWS Cognito.

-- Insert Instructors (idempotent - safe to run multiple times)
-- Note: Using phone_number (not phone) to match actual table schema
INSERT INTO users (id, email, cognito_user_id, role, first_name, last_name, phone_number) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'instructor1@flightschool.com', 'cognito-instructor-001', 'INSTRUCTOR', 'John', 'Smith', '+1-555-0101'),
    ('550e8400-e29b-41d4-a716-446655440002', 'instructor2@flightschool.com', 'cognito-instructor-002', 'INSTRUCTOR', 'Sarah', 'Johnson', '+1-555-0102')
ON CONFLICT (id) DO NOTHING;

-- Insert Students (idempotent - safe to run multiple times)
INSERT INTO users (id, email, cognito_user_id, role, first_name, last_name, phone_number) VALUES
    ('550e8400-e29b-41d4-a716-446655440003', 'student1@flightschool.com', 'cognito-student-001', 'STUDENT', 'Michael', 'Brown', '+1-555-0201'),
    ('550e8400-e29b-41d4-a716-446655440004', 'student2@flightschool.com', 'cognito-student-002', 'STUDENT', 'Emily', 'Davis', '+1-555-0202'),
    ('550e8400-e29b-41d4-a716-446655440005', 'student3@flightschool.com', 'cognito-student-003', 'STUDENT', 'David', 'Wilson', '+1-555-0203')
ON CONFLICT (id) DO NOTHING;

-- Insert Admin (idempotent - safe to run multiple times)
INSERT INTO users (id, email, cognito_user_id, role, first_name, last_name, phone_number) VALUES
    ('550e8400-e29b-41d4-a716-446655440006', 'admin@flightschool.com', 'cognito-admin-001', 'ADMIN', 'Admin', 'User', '+1-555-0001')
ON CONFLICT (id) DO NOTHING;

