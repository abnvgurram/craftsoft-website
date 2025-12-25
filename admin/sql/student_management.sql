-- ============================================
-- CRAFTSOFT - Student Management System
-- Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================

-- First, drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS student_enrollments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS discount_settings CASCADE;
DROP TABLE IF EXISTS receipt_sequence CASCADE;
DROP TABLE IF EXISTS institute_settings CASCADE;

-- ============================================
-- 1. COURSES TABLE (synced from website)
-- ============================================
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    duration VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 20 courses (alphabetically ordered)
INSERT INTO courses (code, name, category, duration) VALUES
('01', 'Automation with Python', 'cloud', '4-6 Weeks'),
('02', 'AWS Cloud Excellence', 'cloud', '2-3 Months'),
('03', 'Data Analytics', 'development', '3-4 Months'),
('04', 'DevOps Engineering', 'cloud', '3-4 Months'),
('05', 'DevSecOps', 'cloud', '3-4 Months'),
('06', 'DSA Mastery', 'development', '2-3 Months'),
('07', 'Full Stack Development (MERN)', 'development', '4-5 Months'),
('08', 'Git & GitHub', 'development', '2-3 Weeks'),
('09', 'Graphic Design', 'design', '2-3 Months'),
('10', 'Handwriting Improvement', 'softskills', '4-6 Weeks'),
('11', 'Java Full Stack Development', 'development', '4-5 Months'),
('12', 'Microsoft Azure', 'cloud', '6-8 Weeks'),
('13', 'Python Full Stack Development', 'development', '4-5 Months'),
('14', 'Python Programming', 'development', '6-10 Weeks'),
('15', 'React JS', 'development', '6-8 Weeks'),
('16', 'Resume Writing & Interview Prep', 'softskills', '2-4 Weeks'),
('17', 'Salesforce Administration', 'development', '2-3 Months'),
('18', 'Soft Skills Training', 'softskills', '1-2 Months'),
('19', 'Spoken English Mastery', 'softskills', '1-2 Months'),
('20', 'UI/UX Design', 'design', '2-3 Months');

-- ============================================
-- 2. STUDENTS TABLE
-- ============================================
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(15) NOT NULL,
    date_of_birth DATE,
    address TEXT,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(15),
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. STUDENT ENROLLMENTS TABLE
-- ============================================
CREATE TABLE student_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    base_fee DECIMAL(10,2) NOT NULL,
    discount_type VARCHAR(50) DEFAULT 'none',
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_fee DECIMAL(10,2) NOT NULL,
    tutor_name VARCHAR(255),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'dropped', 'on-hold')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- ============================================
-- 4. FEE PAYMENTS TABLE
-- ============================================
CREATE TABLE fee_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'razorpay', 'bank_transfer', 'cheque', 'other')),
    reference_id VARCHAR(255),
    receipt_number VARCHAR(50) UNIQUE,
    receipt_url TEXT,
    notes TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. DISCOUNT SETTINGS TABLE
-- ============================================
CREATE TABLE discount_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default discount types
INSERT INTO discount_settings (name, display_name, type, value, description) VALUES
('early_bird', 'Early Bird', 'percentage', 10, '10% discount for early enrollment'),
('referral', 'Referral', 'percentage', 5, '5% discount for referrals'),
('sibling', 'Sibling Discount', 'percentage', 15, '15% discount for siblings');

-- ============================================
-- 6. RECEIPT SEQUENCE TABLE (for auto-increment)
-- ============================================
CREATE TABLE receipt_sequence (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    last_number INTEGER DEFAULT 0
);

-- Initialize current year
INSERT INTO receipt_sequence (year, last_number) 
VALUES (EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 0);

-- ============================================
-- 7. INSTITUTE SETTINGS TABLE
-- ============================================
CREATE TABLE institute_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert institute details
INSERT INTO institute_settings (key, value) VALUES
('name', 'Abhi''s Craft Soft'),
('tagline', 'Software Training Institute'),
('address', 'Plot No. 163, Vijayasree Colony, Vanasthalipuram, Hyderabad 500070'),
('phone', '+91 7842239090'),
('email', 'team.craftsoft@gmail.com'),
('website', 'www.craftsoft.co.in');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE institute_settings ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated admin users
CREATE POLICY "Admin full access to courses" ON courses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to students" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to enrollments" ON student_enrollments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to payments" ON fee_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to discounts" ON discount_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to sequence" ON receipt_sequence FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access to settings" ON institute_settings FOR ALL USING (auth.role() = 'authenticated');

-- Public read for receipt verification
CREATE POLICY "Public can verify receipts" ON fee_payments FOR SELECT USING (true);
CREATE POLICY "Public can read institute settings" ON institute_settings FOR SELECT USING (true);
CREATE POLICY "Public can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public can read students for verification" ON students FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next receipt number
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS INTEGER AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    UPDATE receipt_sequence 
    SET last_number = last_number + 1
    WHERE year = current_year
    RETURNING last_number INTO next_number;
    
    IF next_number IS NULL THEN
        INSERT INTO receipt_sequence (year, last_number)
        VALUES (current_year, 1)
        RETURNING last_number INTO next_number;
    END IF;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- View for student summary with fee status
CREATE OR REPLACE VIEW student_summary AS
SELECT 
    s.id,
    s.name,
    s.phone,
    s.email,
    s.status,
    s.created_at,
    COUNT(DISTINCT se.id) as total_courses,
    COALESCE(SUM(se.final_fee), 0) as total_fee,
    COALESCE((
        SELECT SUM(fp.amount) 
        FROM fee_payments fp 
        WHERE fp.student_id = s.id
    ), 0) as total_paid,
    COALESCE(SUM(se.final_fee), 0) - COALESCE((
        SELECT SUM(fp.amount) 
        FROM fee_payments fp 
        WHERE fp.student_id = s.id
    ), 0) as balance_due
FROM students s
LEFT JOIN student_enrollments se ON s.id = se.student_id
GROUP BY s.id, s.name, s.phone, s.email, s.status, s.created_at;

-- ============================================
-- DONE! Run this entire script in Supabase SQL Editor
-- ============================================
