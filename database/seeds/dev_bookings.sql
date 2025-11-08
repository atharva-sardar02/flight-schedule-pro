-- ============================================================================
-- Seed Data: Development Bookings
-- ============================================================================
-- Description: Creates sample flight bookings for development and testing
--              Includes bookings with various statuses and training levels
-- ============================================================================

-- Note: Uses user IDs from dev_users.sql seed file
-- Coordinates are for example airports (KJFK, KLAX, KORD)

-- Confirmed booking (Student Pilot)
INSERT INTO bookings (
    id, student_id, instructor_id, aircraft_id,
    departure_airport, arrival_airport,
    departure_latitude, departure_longitude,
    arrival_latitude, arrival_longitude,
    scheduled_datetime, status, training_level, duration_minutes
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003', -- student1
    '550e8400-e29b-41d4-a716-446655440001', -- instructor1
    'N12345',
    'KJFK', 'KLAX',
    40.6413, -73.7781, -- JFK coordinates
    33.9425, -118.4081, -- LAX coordinates
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '10 hours', -- 2 days from now at 10 AM
    'CONFIRMED',
    'STUDENT_PILOT',
    120
);

-- At-risk booking (Private Pilot)
INSERT INTO bookings (
    id, student_id, instructor_id, aircraft_id,
    departure_airport, arrival_airport,
    departure_latitude, departure_longitude,
    arrival_latitude, arrival_longitude,
    scheduled_datetime, status, training_level, duration_minutes
) VALUES (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440004', -- student2
    '550e8400-e29b-41d4-a716-446655440001', -- instructor1
    'N67890',
    'KORD', 'KJFK',
    41.9786, -87.9048, -- O'Hare coordinates
    40.6413, -73.7781, -- JFK coordinates
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '14 hours', -- Tomorrow at 2 PM
    'AT_RISK',
    'PRIVATE_PILOT',
    90
);

-- Rescheduling booking (Instrument Rated)
INSERT INTO bookings (
    id, student_id, instructor_id, aircraft_id,
    departure_airport, arrival_airport,
    departure_latitude, departure_longitude,
    arrival_latitude, arrival_longitude,
    scheduled_datetime, status, training_level, duration_minutes
) VALUES (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005', -- student3
    '550e8400-e29b-41d4-a716-446655440002', -- instructor2
    'N11111',
    'KLAX', 'KORD',
    33.9425, -118.4081, -- LAX coordinates
    41.9786, -87.9048, -- O'Hare coordinates
    CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '9 hours', -- 3 days from now at 9 AM
    'RESCHEDULING',
    'INSTRUMENT_RATED',
    180
);

-- Completed booking (for historical data)
INSERT INTO bookings (
    id, student_id, instructor_id, aircraft_id,
    departure_airport, arrival_airport,
    departure_latitude, departure_longitude,
    arrival_latitude, arrival_longitude,
    scheduled_datetime, status, training_level, duration_minutes
) VALUES (
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440003', -- student1
    '550e8400-e29b-41d4-a716-446655440001', -- instructor1
    'N12345',
    'KJFK', 'KLAX',
    40.6413, -73.7781,
    33.9425, -118.4081,
    CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '10 hours', -- 7 days ago
    'COMPLETED',
    'STUDENT_PILOT',
    120
);

-- Cancelled booking (for testing)
INSERT INTO bookings (
    id, student_id, instructor_id, aircraft_id,
    departure_airport, arrival_airport,
    departure_latitude, departure_longitude,
    arrival_latitude, arrival_longitude,
    scheduled_datetime, status, training_level, duration_minutes
) VALUES (
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440004', -- student2
    '550e8400-e29b-41d4-a716-446655440002', -- instructor2
    'N67890',
    'KORD', 'KJFK',
    41.9786, -87.9048,
    40.6413, -73.7781,
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '14 hours', -- 2 days ago
    'CANCELLED',
    'PRIVATE_PILOT',
    90
);

