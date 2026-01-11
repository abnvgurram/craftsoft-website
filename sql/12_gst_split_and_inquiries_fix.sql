-- Migration script for GST Split and Inquiries Fix
-- Run this in Supabase SQL Editor

-- 1. Split GST Settings
INSERT INTO settings (setting_key, setting_value)
VALUES 
    ('course_gst_rate', '18'),
    ('service_gst_rate', '18')
ON CONFLICT (setting_key) DO NOTHING;

-- Cleanup old setting if you want, or just leave it.
-- DELETE FROM settings WHERE setting_key = 'default_gst_rate';

-- 2. Update Inquiries Table Constraints
-- Drop existing constraints if they exist (Postgres stores them with names, usually we need to find them or just drop and recreate)
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_source_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_source_check 
    CHECK (source IN ('Walk-in', 'Website', 'Call', 'WhatsApp', 'Instagram', 'Website (General)', 'Website - Home', 'Website - Courses', 'Website - Services'));

ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check 
    CHECK (status IN ('New', 'Contacted', 'Demo Scheduled', 'Converted', 'Closed', 'Gud'));
