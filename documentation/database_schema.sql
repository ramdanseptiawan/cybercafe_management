-- =====================================================
-- CYBERCAFE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Created: 2025-01-15
-- Description: Complete database schema for cybercafe management system
-- =====================================================

-- =====================================================
-- 1. USERS & AUTHENTICATION TABLES
-- =====================================================

-- Users table for authentication
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Roles table for role-based access control
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- User roles mapping table
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    role_id INT NOT NULL,
    assigned_by VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);

-- =====================================================
-- 2. STAFF MANAGEMENT TABLES
-- =====================================================

-- Staff/Employee information
CREATE TABLE staff (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    user_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(12,2),
    status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
    address TEXT,
    emergency_contact JSON,
    documents JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department),
    INDEX idx_status (status),
    INDEX idx_position (position)
);

-- =====================================================
-- 3. ATTENDANCE SYSTEM TABLES
-- =====================================================

-- Attendance locations (offices, branches, etc.)
CREATE TABLE attendance_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INT DEFAULT 100, -- radius in meters
    type ENUM('office', 'branch', 'client_site', 'remote') DEFAULT 'office',
    is_active BOOLEAN DEFAULT true,
    working_hours JSON, -- {"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_coordinates (latitude, longitude)
);

-- Attendance rules and policies
CREATE TABLE attendance_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location_id INT,
    department VARCHAR(100),
    position VARCHAR(100),
    working_hours_start TIME NOT NULL,
    working_hours_end TIME NOT NULL,
    break_duration INT DEFAULT 60, -- minutes
    late_tolerance INT DEFAULT 15, -- minutes
    overtime_threshold DECIMAL(4,2) DEFAULT 8.0, -- hours
    require_photo BOOLEAN DEFAULT true,
    require_location BOOLEAN DEFAULT true,
    max_distance INT DEFAULT 100, -- meters
    working_days JSON, -- [1,2,3,4,5] (1=Monday)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (location_id) REFERENCES attendance_locations(id),
    INDEX idx_department (department),
    INDEX idx_position (position),
    INDEX idx_active (is_active)
);

-- Main attendance records
CREATE TABLE attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    check_in_photo TEXT,
    check_out_photo TEXT,
    check_in_location_id INT,
    check_out_location_id INT,
    check_in_coordinates JSON, -- {"lat": -6.2088, "lng": 106.8456}
    check_out_coordinates JSON,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    break_duration INT DEFAULT 0, -- minutes
    status ENUM('present', 'late', 'absent', 'active', 'incomplete') DEFAULT 'present',
    fraud_score INT DEFAULT 0,
    distance_from_office DECIMAL(8,2), -- meters
    device_info JSON, -- device info for fraud detection
    notes TEXT,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (check_in_location_id) REFERENCES attendance_locations(id),
    FOREIGN KEY (check_out_location_id) REFERENCES attendance_locations(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE KEY unique_employee_date (employee_id, date),
    INDEX idx_employee_date (employee_id, date),
    INDEX idx_status (status),
    INDEX idx_date (date)
);

-- Attendance exceptions (leaves, business trips, etc.)
CREATE TABLE attendance_exceptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    type ENUM('sick_leave', 'annual_leave', 'business_trip', 'remote_work', 'half_day') NOT NULL,
    reason TEXT,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    documents JSON, -- array of document URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES staff(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_employee_date (employee_id, date),
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- =====================================================
-- 4. AUDIT LOGS TABLE
-- =====================================================

-- System audit logs for tracking all activities
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
);

-- =====================================================
-- 5. INITIAL DATA INSERTS
-- =====================================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access', '["*"]'),
('admin', 'Administrator', 'Administrative access', '["users.read", "users.write", "staff.read", "staff.write", "attendance.read", "attendance.write", "reports.read"]'),
('manager', 'Manager', 'Management access', '["staff.read", "attendance.read", "attendance.write", "reports.read"]'),
('hr', 'Human Resources', 'HR access', '["staff.read", "staff.write", "attendance.read", "reports.read"]'),
('employee', 'Employee', 'Basic employee access', '["attendance.read", "attendance.write.own"]');

-- Insert default attendance locations
INSERT INTO attendance_locations (name, address, latitude, longitude, radius, type, working_hours) VALUES
('Main Office', 'Jl. Sudirman No. 123, Jakarta Pusat', -6.2088, 106.8456, 100, 'office', '{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}'),
('Branch Surabaya', 'Jl. Pemuda No. 456, Surabaya', -7.2575, 112.7521, 150, 'branch', '{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}'),
('Remote Work', 'Work from Home', 0, 0, 0, 'remote', '{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5,6,7]}');

-- Insert default attendance rules
INSERT INTO attendance_rules (name, location_id, working_hours_start, working_hours_end, break_duration, late_tolerance, require_photo, require_location, max_distance, working_days) VALUES
('Standard Office Hours', 1, '08:00:00', '17:00:00', 60, 15, true, true, 100, '[1,2,3,4,5]'),
('Flexible Hours', 1, '07:00:00', '19:00:00', 60, 30, true, true, 100, '[1,2,3,4,5]'),
('Remote Work Policy', 3, '08:00:00', '17:00:00', 60, 60, false, false, 0, '[1,2,3,4,5,6,7]');

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_attendance_employee_month ON attendance_records (employee_id, date);
CREATE INDEX idx_attendance_location_date ON attendance_records (check_in_location_id, date);
CREATE INDEX idx_staff_department_status ON staff (department, status);
CREATE INDEX idx_audit_resource_timestamp ON audit_logs (resource_type, resource_id, timestamp);

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for employee attendance summary
CREATE VIEW employee_attendance_summary AS
SELECT 
    s.id as employee_id,
    s.employee_id,
    s.full_name,
    s.department,
    s.position,
    COUNT(ar.id) as total_attendance,
    SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_days,
    SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_days,
    SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
    AVG(ar.total_hours) as avg_working_hours,
    SUM(ar.overtime_hours) as total_overtime
FROM staff s
LEFT JOIN attendance_records ar ON s.id = ar.employee_id
WHERE s.status = 'active'
GROUP BY s.id, s.employee_id, s.full_name, s.department, s.position;

-- View for daily attendance report
CREATE VIEW daily_attendance_report AS
SELECT 
    ar.date,
    al.name as location_name,
    s.department,
    COUNT(ar.id) as total_checkins,
    SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    AVG(ar.total_hours) as avg_hours,
    SUM(ar.overtime_hours) as total_overtime
FROM attendance_records ar
JOIN staff s ON ar.employee_id = s.id
LEFT JOIN attendance_locations al ON ar.check_in_location_id = al.id
GROUP BY ar.date, al.name, s.department;