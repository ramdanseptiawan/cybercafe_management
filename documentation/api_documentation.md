# Cybercafe Management System - API Documentation

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Role Management APIs](#role-management-apis)
3. [Staff Management APIs](#staff-management-apis)
4. [Attendance APIs](#attendance-apis)
5. [Location Management APIs](#location-management-apis)
6. [Audit Logs APIs](#audit-logs-apis)
7. [Response Format Standards](#response-format-standards)
8. [Error Codes](#error-codes)
9. [Security & Authentication](#security--authentication)

---

## Base URL
Trae




Dokumentasi Detail API Absensi & Lokasi
1. Struktur Tabel Database untuk Absensi
1.1 Tabel Attendance Records (Detail)
sql

CREATE TABLE attendance_records (    id INT PRIMARY KEY AUTO_INCREMENT,    employee_id VARCHAR(50) NOT NULL,    date DATE NOT NULL,    check_in_time TIME,    check_out_time TIME,    check_in_photo TEXT,    check_out_photo TEXT,    check_in_location_id INT,    check_out_location_id INT,    check_in_coordinates JSON, -- {"lat": -6.    2088, "lng": 106.8456}    check_out_coordinates JSON,    total_hours DECIMAL(4,2),    overtime_hours DECIMAL(4,2) DEFAULT 0,    break_duration INT DEFAULT 0, -- dalam     menit    status ENUM('present', 'late', 'absent',     'active', 'incomplete') DEFAULT 'present',    fraud_score INT DEFAULT 0,    distance_from_office DECIMAL(8,2), --     dalam meter    device_info JSON, -- info device untuk     fraud detection    notes TEXT,    approved_by VARCHAR(50),    approved_at TIMESTAMP NULL,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,    FOREIGN KEY (employee_id) REFERENCES staff    (id) ON DELETE CASCADE,    FOREIGN KEY (check_in_location_id)     REFERENCES attendance_locations(id),    FOREIGN KEY (check_out_location_id)     REFERENCES attendance_locations(id),    FOREIGN KEY (approved_by) REFERENCES users    (id),    UNIQUE KEY unique_employee_date     (employee_id, date));
1.2 Tabel Attendance Locations (Lokasi Absensi)
sql

CREATE TABLE attendance_locations (    id INT PRIMARY KEY AUTO_INCREMENT,    name VARCHAR(100) NOT NULL,    address TEXT,    latitude DECIMAL(10, 8) NOT NULL,    longitude DECIMAL(11, 8) NOT NULL,    radius INT DEFAULT 100, -- radius dalam     meter    type ENUM('office', 'branch',     'client_site', 'remote') DEFAULT 'office',    is_active BOOLEAN DEFAULT true,    working_hours JSON, -- {"start": "08:00",     "end": "17:00", "days": [1,2,3,4,5]}    timezone VARCHAR(50) DEFAULT 'Asia/    Jakarta',    created_by VARCHAR(50),    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,    FOREIGN KEY (created_by) REFERENCES users    (id));
1.3 Tabel Attendance Rules (Aturan Absensi)
sql

CREATE TABLE attendance_rules (    id INT PRIMARY KEY AUTO_INCREMENT,    name VARCHAR(100) NOT NULL,    location_id INT,    department VARCHAR(100),    position VARCHAR(100),    working_hours_start TIME NOT NULL,    working_hours_end TIME NOT NULL,    break_duration INT DEFAULT 60, -- menit    late_tolerance INT DEFAULT 15, -- menit    overtime_threshold DECIMAL(4,2) DEFAULT 8.    0, -- jam    require_photo BOOLEAN DEFAULT true,    require_location BOOLEAN DEFAULT true,    max_distance INT DEFAULT 100, -- meter    working_days JSON, -- [1,2,3,4,5]     (1=Monday)    is_active BOOLEAN DEFAULT true,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    FOREIGN KEY (location_id) REFERENCES     attendance_locations(id));
1.4 Tabel Attendance Exceptions (Pengecualian)
sql

CREATE TABLE attendance_exceptions (    id INT PRIMARY KEY AUTO_INCREMENT,    employee_id VARCHAR(50) NOT NULL,    date DATE NOT NULL,    type ENUM('sick_leave', 'annual_leave',     'business_trip', 'remote_work',     'half_day') NOT NULL,    reason TEXT,    approved_by VARCHAR(50),    approved_at TIMESTAMP,    status ENUM('pending', 'approved',     'rejected') DEFAULT 'pending',    documents JSON, -- array of document URLs    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    FOREIGN KEY (employee_id) REFERENCES staff    (id),    FOREIGN KEY (approved_by) REFERENCES users    (id));
2. API Endpoints untuk Absensi & Lokasi
2.1 Location Management APIs
GET /api/attendance/locations
json

{  "query_params": {    "type": "office|branch|client_site|remote",    "is_active": true,    "search": "string"  },  "response": {    "success": true,    "data": [      {        "id": 1,        "name": "Main Office",        "address": "Jl. Sudirman No. 123,         Jakarta",        "latitude": -6.2088,        "longitude": 106.8456,        "radius": 100,        "type": "office",        "working_hours": {          "start": "08:00",          "end": "17:00",          "days": [1, 2, 3, 4, 5]        },        "timezone": "Asia/Jakarta",        "is_active": true      }    ]  }}
POST /api/attendance/locations
json

{  "request": {    "name": "Branch Office Surabaya",    "address": "Jl. Pemuda No. 456, Surabaya",    "latitude": -7.2575,    "longitude": 112.7521,    "radius": 150,    "type": "branch",    "working_hours": {      "start": "08:00",      "end": "17:00",      "days": [1, 2, 3, 4, 5]    }  },  "response": {    "success": true,    "data": {      "id": 2,      "name": "Branch Office Surabaya",      "latitude": -7.2575,      "longitude": 112.7521    }  }}
GET /api/attendance/locations/nearby
json

{  "query_params": {    "latitude": -6.2088,    "longitude": 106.8456,    "radius": 1000  },  "response": {    "success": true,    "data": [      {        "id": 1,        "name": "Main Office",        "distance": 45.5,        "is_within_radius": true,        "latitude": -6.2088,        "longitude": 106.8456,        "radius": 100      }    ]  }}
2.2 Attendance APIs (Detail)
POST /api/attendance/validate-location
json

{  "request": {    "employee_id": "EMP001",    "latitude": -6.2088,    "longitude": 106.8456,    "accuracy": 10  },  "response": {    "success": true,    "data": {      "is_valid": true,      "location": {        "id": 1,        "name": "Main Office",        "distance": 45.5      },      "rules": {        "max_distance": 100,        "require_photo": true,        "working_hours": {          "start": "08:00",          "end": "17:00"        }      }    }  }}
POST /api/attendance/check-in
json

{  "request": {    "employee_id": "EMP001",    "photo": "base64_string_or_file_upload",    "location": {      "latitude": -6.2088,      "longitude": 106.8456,      "accuracy": 10,      "location_id": 1    },    "device_info": {      "device_id": "string",      "user_agent": "string",      "ip_address": "192.168.1.1"    },    "notes": "Optional notes"  },  "response": {    "success": true,    "data": {      "id": 1,      "employee_id": "EMP001",      "check_in_time": "08:30:00",      "location": {        "id": 1,        "name": "Main Office",        "distance": 45.5      },      "status": "present",      "is_late": false,      "fraud_score": 2,      "photo_url": "https://storage.example.      com/photos/checkin_123.jpg"    }  }}
POST /api/attendance/check-out
json

{  "request": {    "attendance_id": 1,    "photo": "base64_string_or_file_upload",    "location": {      "latitude": -6.2088,      "longitude": 106.8456,      "accuracy": 10,      "location_id": 1    },    "break_duration": 60,    "notes": "Completed all tasks"  },  "response": {    "success": true,    "data": {      "id": 1,      "check_out_time": "17:30:00",      "total_hours": 8.5,      "overtime_hours": 0.5,      "break_duration": 60,      "location": {        "id": 1,        "name": "Main Office",        "distance": 52.3      },      "photo_url": "https://storage.example.      com/photos/checkout_123.jpg"    }  }}
GET /api/attendance/current-status/{employee_id}
json

{  "response": {    "success": true,    "data": {      "employee_id": "EMP001",      "today_attendance": {        "id": 1,        "date": "2025-01-15",        "check_in_time": "08:30:00",        "check_out_time": null,        "status": "active",        "location": {          "id": 1,          "name": "Main Office"        }      },      "can_check_in": false,      "can_check_out": true,      "working_hours": {        "start": "08:00",        "end": "17:00"      },      "current_time": "14:30:00"    }  }}
GET /api/attendance/records
json

{  "query_params": {    "employee_id": "EMP001",    "date_from": "2025-01-01",    "date_to": "2025-01-31",    "status": "present|late|absent|active",    "location_id": 1,    "page": 1,    "limit": 20  },  "response": {    "success": true,    "data": {      "records": [        {          "id": 1,          "employee_id": "EMP001",          "employee_name": "John Doe",          "date": "2025-01-15",          "check_in_time": "08:30:00",          "check_out_time": "17:30:00",          "total_hours": 8.5,          "overtime_hours": 0.5,          "break_duration": 60,          "status": "present",          "fraud_score": 2,          "check_in_location": {            "id": 1,            "name": "Main Office",            "distance": 45.5          },          "check_out_location": {            "id": 1,            "name": "Main Office",            "distance": 52.3          },          "photos": {            "check_in": "https://storage.            example.com/photos/checkin_123.            jpg",            "check_out": "https://storage.            example.com/photos/checkout_123.            jpg"          },          "notes": "Regular work day"        }      ],      "pagination": {        "current_page": 1,        "total_pages": 5,        "total_records": 100,        "per_page": 20      },      "summary": {        "total_present": 20,        "total_late": 3,        "total_absent": 2,        "total_hours": 170.5,        "total_overtime": 12.5      }    }  }}
2.3 Attendance Rules APIs
GET /api/attendance/rules
json

{  "query_params": {    "location_id": 1,    "department": "IT",    "position": "Developer"  },  "response": {    "success": true,    "data": [      {        "id": 1,        "name": "Standard Office Hours",        "location_id": 1,        "working_hours_start": "08:00:00",        "working_hours_end": "17:00:00",        "break_duration": 60,        "late_tolerance": 15,        "overtime_threshold": 8.0,        "require_photo": true,        "require_location": true,        "max_distance": 100,        "working_days": [1, 2, 3, 4, 5]      }    ]  }}
2.4 Attendance Reports APIs
GET /api/attendance/reports/summary
json

{  "query_params": {    "date_from": "2025-01-01",    "date_to": "2025-01-31",    "department": "IT",    "location_id": 1  },  "response": {    "success": true,    "data": {      "period": {        "from": "2025-01-01",        "to": "2025-01-31",        "total_days": 31,        "working_days": 22      },      "summary": {        "total_employees": 50,        "total_present": 1000,        "total_late": 50,        "total_absent": 100,        "attendance_rate": 90.9,        "punctuality_rate": 95.2,        "total_working_hours": 8800,        "total_overtime_hours": 220      },      "by_location": [        {          "location_id": 1,          "location_name": "Main Office",          "total_checkins": 800,          "attendance_rate": 92.5        }      ],      "by_department": [        {          "department": "IT",          "total_employees": 20,          "attendance_rate": 95.0        }      ]    }  }}
3. Fraud Detection & Security
3.1 Fraud Detection Metrics
Location Spoofing: Deteksi GPS palsu
Photo Manipulation: Deteksi foto yang dimanipulasi
Time Anomalies: Deteksi pola waktu yang tidak normal
Device Fingerprinting: Tracking device yang digunakan
Velocity Check: Deteksi perpindahan lokasi yang tidak masuk akal
3.2 Security Headers
json

{  "headers": {    "Authorization": "Bearer jwt_token",    "X-Device-ID": "unique_device_identifier",    "X-App-Version": "1.0.0",    "X-Platform": "android|ios|web"  }}
4. Error Codes untuk Absensi
json

{  "error_codes": {    "LOCATION_OUT_OF_RANGE": "Lokasi di luar     jangkauan kantor",    "INVALID_WORKING_HOURS": "Di luar jam     kerja",    "ALREADY_CHECKED_IN": "Sudah melakukan     check-in hari ini",    "NOT_CHECKED_IN": "Belum melakukan     check-in",    "PHOTO_REQUIRED": "Foto wajib diambil",    "LOCATION_REQUIRED": "Lokasi wajib     diaktifkan",    "GPS_ACCURACY_LOW": "Akurasi GPS terlalu     rendah",    "FRAUD_DETECTED": "Terdeteksi aktivitas     mencurigakan",    "WEEKEND_NOT_ALLOWED": "Absensi tidak     diizinkan di akhir pekan",    "HOLIDAY_NOT_ALLOWED": "Absensi tidak     diizinkan di hari libur"  }}
5. Real-time Features
5.1 WebSocket Events
json

{  "events": {    "attendance.checked_in": {      "employee_id": "EMP001",      "timestamp": "2025-01-15T08:30:00Z",      "location": "Main Office"    },    "attendance.checked_out": {      "employee_id": "EMP001",      "timestamp": "2025-01-15T17:30:00Z",      "total_hours": 8.5    },    "attendance.fraud_detected": {      "employee_id": "EMP001",      "fraud_type": "location_spoofing",      "score": 8    }  }}
Dokumentasi ini mencakup semua aspek detail untuk sistem absensi termasuk manajemen lokasi, validasi, fraud detection, dan reporting yang komprehensif.

Ramdan Septiawan
Copy
Delete
oke coba semua itu dibikin dalam dua file table dan api, dalam folder documentation
Trae
Saya akan membuat dua file dokumentasi terpisah dalam folder documentation untuk struktur database dan API specifications.

File 1: Database Schema Documentation
database_schema.sql
Apply
-- =====================================================-- CYBERCAFE MANAGEMENT SYSTEM - DATABASE SCHEMA-- =====================================================-- Created: 2025-01-15-- Description: Complete database schema for cybercafe management system-- =====================================================-- =====================================================-- 1. USERS & AUTHENTICATION TABLES-- =====================================================-- Users table for authenticationCREATE TABLE users (    id VARCHAR(50) PRIMARY KEY,    username VARCHAR(100) UNIQUE NOT NULL,    email VARCHAR(255) UNIQUE NOT NULL,    password_hash VARCHAR(255) NOT NULL,    full_name VARCHAR(255) NOT NULL,    phone VARCHAR(20),    avatar_url TEXT,    is_active BOOLEAN DEFAULT true,    last_login TIMESTAMP,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,        INDEX idx_username (username),    INDEX idx_email (email),    INDEX idx_active (is_active));-- Roles table for role-based access controlCREATE TABLE roles (    id INT PRIMARY KEY AUTO_INCREMENT,    name VARCHAR(50) UNIQUE NOT NULL,    display_name VARCHAR(100) NOT NULL,    description TEXT,    permissions JSON,    is_active BOOLEAN DEFAULT true,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,        INDEX idx_name (name),    INDEX idx_active (is_active));-- User roles mapping tableCREATE TABLE user_roles (    id INT PRIMARY KEY AUTO_INCREMENT,    user_id VARCHAR(50) NOT NULL,    role_id INT NOT NULL,    assigned_by VARCHAR(50),    assigned_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,        FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE CASCADE,    FOREIGN KEY (role_id) REFERENCES roles(id)     ON DELETE CASCADE,    FOREIGN KEY (assigned_by) REFERENCES users    (id),    UNIQUE KEY unique_user_role (user_id,     role_id),    INDEX idx_user_id (user_id),    INDEX idx_role_id (role_id));-- =====================================================-- 2. STAFF MANAGEMENT TABLES-- =====================================================-- Staff/Employee informationCREATE TABLE staff (    id VARCHAR(50) PRIMARY KEY,    employee_id VARCHAR(20) UNIQUE NOT NULL,    user_id VARCHAR(50) UNIQUE,    full_name VARCHAR(255) NOT NULL,    email VARCHAR(255),    phone VARCHAR(20),    position VARCHAR(100),    department VARCHAR(100),    hire_date DATE,    salary DECIMAL(12,2),    status ENUM('active', 'inactive',     'terminated') DEFAULT 'active',    address TEXT,    emergency_contact JSON,    documents JSON,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,        FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE SET NULL,    INDEX idx_employee_id (employee_id),    INDEX idx_department (department),    INDEX idx_status (status),    INDEX idx_position (position));-- =====================================================-- 3. ATTENDANCE SYSTEM TABLES-- =====================================================-- Attendance locations (offices, branches, etc.)CREATE TABLE attendance_locations (    id INT PRIMARY KEY AUTO_INCREMENT,    name VARCHAR(100) NOT NULL,    address TEXT,    latitude DECIMAL(10, 8) NOT NULL,    longitude DECIMAL(11, 8) NOT NULL,    radius INT DEFAULT 100, -- radius in meters    type ENUM('office', 'branch',     'client_site', 'remote') DEFAULT 'office',    is_active BOOLEAN DEFAULT true,    working_hours JSON, -- {"start": "08:00",     "end": "17:00", "days": [1,2,3,4,5]}    timezone VARCHAR(50) DEFAULT 'Asia/    Jakarta',    created_by VARCHAR(50),    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,        FOREIGN KEY (created_by) REFERENCES users    (id),    INDEX idx_type (type),    INDEX idx_active (is_active),    INDEX idx_coordinates (latitude, longitude));-- Attendance rules and policiesCREATE TABLE attendance_rules (    id INT PRIMARY KEY AUTO_INCREMENT,    name VARCHAR(100) NOT NULL,    location_id INT,    department VARCHAR(100),    position VARCHAR(100),    working_hours_start TIME NOT NULL,    working_hours_end TIME NOT NULL,    break_duration INT DEFAULT 60, -- minutes    late_tolerance INT DEFAULT 15, -- minutes    overtime_threshold DECIMAL(4,2) DEFAULT 8.    0, -- hours    require_photo BOOLEAN DEFAULT true,    require_location BOOLEAN DEFAULT true,    max_distance INT DEFAULT 100, -- meters    working_days JSON, -- [1,2,3,4,5]     (1=Monday)    is_active BOOLEAN DEFAULT true,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,        FOREIGN KEY (location_id) REFERENCES     attendance_locations(id),    INDEX idx_department (department),    INDEX idx_position (position),    INDEX idx_active (is_active));-- Main attendance recordsCREATE TABLE attendance_records (    id INT PRIMARY KEY AUTO_INCREMENT,    employee_id VARCHAR(50) NOT NULL,    date DATE NOT NULL,    check_in_time TIME,    check_out_time TIME,    check_in_photo TEXT,    check_out_photo TEXT,    check_in_location_id INT,    check_out_location_id INT,    check_in_coordinates JSON, -- {"lat": -6.    2088, "lng": 106.8456}    check_out_coordinates JSON,    total_hours DECIMAL(4,2),    overtime_hours DECIMAL(4,2) DEFAULT 0,    break_duration INT DEFAULT 0, -- minutes    status ENUM('present', 'late', 'absent',     'active', 'incomplete') DEFAULT 'present',    fraud_score INT DEFAULT 0,    distance_from_office DECIMAL(8,2), --     meters    device_info JSON, -- device info for fraud     detection    notes TEXT,    approved_by VARCHAR(50),    approved_at TIMESTAMP NULL,    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,    updated_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP ON UPDATE     CURRENT_TIMESTAMP,        FOREIGN KEY (employee_id) REFERENCES staff    (id) ON DELETE CASCADE,    FOREIGN KEY (check_in_location_id)     REFERENCES attendance_locations(id),    FOREIGN KEY (check_out_location_id)     REFERENCES attendance_locations(id),    FOREIGN KEY (approved_by) REFERENCES users    (id),    UNIQUE KEY unique_employee_date     (employee_id, date),    INDEX idx_employee_date (employee_id,     date),    INDEX idx_status (status),    INDEX idx_date (date));-- Attendance exceptions (leaves, business trips, etc.)CREATE TABLE attendance_exceptions (    id INT PRIMARY KEY AUTO_INCREMENT,    employee_id VARCHAR(50) NOT NULL,    date DATE NOT NULL,    type ENUM('sick_leave', 'annual_leave',     'business_trip', 'remote_work',     'half_day') NOT NULL,    reason TEXT,    approved_by VARCHAR(50),    approved_at TIMESTAMP,    status ENUM('pending', 'approved',     'rejected') DEFAULT 'pending',    documents JSON, -- array of document URLs    created_at TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,        FOREIGN KEY (employee_id) REFERENCES staff    (id),    FOREIGN KEY (approved_by) REFERENCES users    (id),    INDEX idx_employee_date (employee_id,     date),    INDEX idx_type (type),    INDEX idx_status (status));-- =====================================================-- 4. AUDIT LOGS TABLE-- =====================================================-- System audit logs for tracking all activitiesCREATE TABLE audit_logs (    id INT PRIMARY KEY AUTO_INCREMENT,    user_id VARCHAR(50),    action VARCHAR(100) NOT NULL,    resource_type VARCHAR(50) NOT NULL,    resource_id VARCHAR(50),    old_values JSON,    new_values JSON,    ip_address VARCHAR(45),    user_agent TEXT,    session_id VARCHAR(255),    timestamp TIMESTAMP DEFAULT     CURRENT_TIMESTAMP,        FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE SET NULL,    INDEX idx_user_timestamp (user_id,     timestamp),    INDEX idx_resource (resource_type,     resource_id),    INDEX idx_timestamp (timestamp),    INDEX idx_action (action));-- =====================================================-- 5. INITIAL DATA INSERTS-- =====================================================-- Insert default rolesINSERT INTO roles (name, display_name, description, permissions) VALUES('super_admin', 'Super Administrator', 'Full system access', '["*"]'),('admin', 'Administrator', 'Administrative access', '["users.read", "users.write", "staff.read", "staff.write", "attendance.read", "attendance.write", "reports.read"]'),('manager', 'Manager', 'Management access', '["staff.read", "attendance.read", "attendance.write", "reports.read"]'),('hr', 'Human Resources', 'HR access', '["staff.read", "staff.write", "attendance.read", "reports.read"]'),('employee', 'Employee', 'Basic employee access', '["attendance.read", "attendance.write.own"]');-- Insert default attendance locationsINSERT INTO attendance_locations (name, address, latitude, longitude, radius, type, working_hours) VALUES('Main Office', 'Jl. Sudirman No. 123, Jakarta Pusat', -6.2088, 106.8456, 100, 'office', '{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}'),('Branch Surabaya', 'Jl. Pemuda No. 456, Surabaya', -7.2575, 112.7521, 150, 'branch', '{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}'),('Remote Work', 'Work from Home', 0, 0, 0, 'remote', '{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5,6,7]}');-- Insert default attendance rulesINSERT INTO attendance_rules (name, location_id, working_hours_start, working_hours_end, break_duration, late_tolerance, require_photo, require_location, max_distance, working_days) VALUES('Standard Office Hours', 1, '08:00:00', '17:00:00', 60, 15, true, true, 100, '[1,2,3,4,5]'),('Flexible Hours', 1, '07:00:00', '19:00:00', 60, 30, true, true, 100, '[1,2,3,4,5]'),('Remote Work Policy', 3, '08:00:00', '17:00:00', 60, 60, false, false, 0, '[1,2,3,4,5,6,7]');-- =====================================================-- 6. INDEXES FOR PERFORMANCE-- =====================================================-- Additional composite indexes for common queriesCREATE INDEX idx_attendance_employee_month ON attendance_records (employee_id, date);CREATE INDEX idx_attendance_location_date ON attendance_records (check_in_location_id, date);CREATE INDEX idx_staff_department_status ON staff (department, status);CREATE INDEX idx_audit_resource_timestamp ON audit_logs (resource_type, resource_id, timestamp);-- =====================================================-- 7. VIEWS FOR COMMON QUERIES-- =====================================================-- View for employee attendance summaryCREATE VIEW employee_attendance_summary ASSELECT     s.id as employee_id,    s.employee_id,    s.full_name,    s.department,    s.position,    COUNT(ar.id) as total_attendance,    SUM(CASE WHEN ar.status = 'present' THEN 1     ELSE 0 END) as present_days,    SUM(CASE WHEN ar.status = 'late' THEN 1     ELSE 0 END) as late_days,    SUM(CASE WHEN ar.status = 'absent' THEN 1     ELSE 0 END) as absent_days,    AVG(ar.total_hours) as avg_working_hours,    SUM(ar.overtime_hours) as total_overtimeFROM staff sLEFT JOIN attendance_records ar ON s.id = ar.employee_idWHERE s.status = 'active'GROUP BY s.id, s.employee_id, s.full_name, s.department, s.position;-- View for daily attendance reportCREATE VIEW daily_attendance_report ASSELECT     ar.date,    al.name as location_name,    s.department,    COUNT(ar.id) as total_checkins,    SUM(CASE WHEN ar.status = 'present' THEN 1     ELSE 0 END) as present_count,    SUM(CASE WHEN ar.status = 'late' THEN 1     ELSE 0 END) as late_count,    SUM(CASE WHEN ar.status = 'absent' THEN 1     ELSE 0 END) as absent_count,    AVG(ar.total_hours) as avg_hours,    SUM(ar.overtime_hours) as total_overtimeFROM attendance_records arJOIN staff s ON ar.employee_id = s.idLEFT JOIN attendance_locations al ON ar.check_in_location_id = al.idGROUP BY ar.date, al.name, s.department;
File 2: API Documentation
api_documentation.md
Apply
# Cybercafe Management System - API Documentation## Table of Contents1. [Authentication APIs](#authentication-apis)2. [Role Management APIs](#role-management-apis)3. [Staff Management APIs](#staff-management-apis)4. [Attendance APIs](#attendance-apis)5. [Location Management APIs](#location-management-apis)6. [Audit Logs APIs](#audit-logs-apis)7. [Response Format Standards](#response-format-standards)8. [Error Codes](#error-codes)9. [Security & Authentication](#security--authentication)---## Base URL
Production: https://api.cybercafe.com/v1 Staging: https://staging-api.cybercafe.com/v1 Development: http://localhost:3000/api/v1


## Authentication APIs

### POST /auth/login
Authenticate user and get access token.

**Request:**
```json
{
  "username": "john.doe",
  "password": "securePassword123"
}

{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "full_name": "John Doe",
      "avatar_url": "https://storage.example.com/avatars/john.jpg",
      "roles": ["employee", "manager"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "rt_abcdef123456",
    "expires_in": 86400
  }
}

### POST /auth/logout
Logout user and invalidate token.

Headers:
Authorization: Bearer {token}
{
  "success": true,
  "message": "Logged out successfully"
}

### GET /auth/me
Get current user information.

Headers:

```
Authorization: Bearer {token}
```
Response:

```
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "roles": ["employee", "manager"],
    "permissions": ["attendance.read", 
    "attendance.write", "staff.read"]
  }
}
```

### OST /auth/refresh
Refresh access token.

Request:

```
{
  "refresh_token": "rt_abcdef123456"
}
```
Response:

```
{
  "success": true,
  "data": {
    "token": 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
}

## Role Management APIs
### GET /roles
Get all roles.

Query Parameters:

- is_active (boolean): Filter by active status
- search (string): Search by name or display name
Response:

{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "display_name": "Administrator",
      "description": "Administrative access",
      "permissions": ["users.read", "users.write", "staff.read"],
      "is_active": true,
      "created_at": "2025-01-15T08:00:00Z"
    }
  ]
}

### POST /roles
Create new role.

Request:

```
{
  "name": "supervisor",
  "display_name": "Supervisor",
  "description": "Supervisor access level",
  "permissions": ["staff.read", "attendance.
  read", "attendance.write"]

```


### PUT /roles/{id}
Update role.

### DELETE /roles/{id}
Delete role.

## Staff Management APIs
### GET /staff
Get all staff members.

Query Parameters:

- page (integer): Page number (default: 1)
- limit (integer): Items per page (default: 20, max: 100)
- search (string): Search by name, email, or employee ID
- department (string): Filter by department
- position (string): Filter by position
- status (string): Filter by status (active, inactive, terminated)
Response:

{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "emp_123456",
        "employee_id": "EMP001",
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "phone": "+62812345678",
        "position": "Software Developer",
        "department": "IT",
        "hire_date": "2024-01-15",
        "status": "active",
        "user_id": "usr_123456"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_records": 100,
      "per_page": 20
    }
  }
}

### POST /staff
Create new staff member.

Request:

```
{
  "employee_id": "EMP002",
  "full_name": "Jane Smith",
  "email": "jane.smith@company.com",
  "phone": "+62812345679",
  "position": "UI/UX Designer",
  "department": "Design",
  "hire_date": "2025-01-15",
  "salary": 8000000,
  "address": "Jl. Kebon Jeruk No. 123, 
  Jakarta",
  "emergency_contact": {
    "name": "John Smith",
    "relationship": "Husband",
    "phone": "+62812345680"
  }
}
}

### GET /staff/{id}
Get staff member details.

### PUT /staff/{id}
Update staff member.

### DELETE /staff/{id}
Delete staff member.

## Attendance APIs
### GET /attendance/locations
Get all attendance locations.

Query Parameters:

- type (string): Filter by type (office, branch, client_site, remote)
- is_active (boolean): Filter by active status
- search (string): Search by name or address
Response:

```
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main Office",
      "address": "Jl. Sudirman No. 123, 
      Jakarta",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "radius": 100,
      "type": "office",
      "working_hours": {
        "start": "08:00",
        "end": "17:00",
        "days": [1, 2, 3, 4, 5]
      },
      "timezone": "Asia/Jakarta",
      "is_active": true
    }
  ]
}
```
### GET /attendance/locations/nearby
Get nearby attendance locations.

Query Parameters:

- latitude (float): Current latitude
- longitude (float): Current longitude
- radius (integer): Search radius in meters (default: 1000)
Response:

```
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main Office",
      "distance": 45.5,
      "is_within_radius": true,
      "latitude": -6.2088,
      "longitude": 106.8456,
      "radius": 100,
      "working_hours": {
        "start": "08:00",
        "end": "17:00"
      }
    }
  ]
}
```
### POST /attendance/validate-location
Validate location for attendance.

Request:

```
{
  "employee_id": "emp_123456",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10
}
```
Response:

```
{
  "success": true,
  "data": {
    "is_valid": true,
    "location": {
      "id": 1,
      "name": "Main Office",
      "distance": 45.5
    },
    "rules": {
      "max_distance": 100,
      "require_photo": true,
      "working_hours": {
        "start": "08:00",
        "end": "17:00"
      },
      "late_tolerance": 15
    }
  }
}
```
### POST /attendance/check-in
Record check-in attendance.

Request:

```
{
  "employee_id": "emp_123456",
  "photo": "data:image/jpeg;base64,/9j/
  4AAQSkZJRgABAQAAAQ...",
  "location": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10,
    "location_id": 1
  },
  "device_info": {
    "device_id": "device_123456",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.100"
  },
  "notes": "Starting work day"
}
```
Response:

```
{
  "success": true,
  "data": {
    "id": 1001,
    "employee_id": "emp_123456",
    "date": "2025-01-15",
    "check_in_time": "08:30:00",
    "location": {
      "id": 1,
      "name": "Main Office",
      "distance": 45.5
    },
    "status": "present",
    "is_late": false,
    "fraud_score": 2,
    "photo_url": "https://storage.example.com/
    attendance/checkin_1001.jpg"
  }
}
```
### POST /attendance/check-out
Record check-out attendance.

Request:

```
{
  "attendance_id": 1001,
  "photo": "data:image/jpeg;base64,/9j/
  4AAQSkZJRgABAQAAAQ...",
  "location": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10,
    "location_id": 1
  },
  "break_duration": 60,
  "notes": "Completed all tasks for today"
}
```
Response:

```
{
  "success": true,
  "data": {
    "id": 1001,
    "check_out_time": "17:30:00",
    "total_hours": 8.5,
    "overtime_hours": 0.5,
    "break_duration": 60,
    "location": {
      "id": 1,
      "name": "Main Office",
      "distance": 52.3
    },
    "photo_url": "https://storage.example.com/
    attendance/checkout_1001.jpg"
  }
}
```
### GET /attendance/current-status/{employee_id}
Get current attendance status.

Response:

```
{
  "success": true,
  "data": {
    "employee_id": "emp_123456",
    "today_attendance": {
      "id": 1001,
      "date": "2025-01-15",
      "check_in_time": "08:30:00",
      "check_out_time": null,
      "status": "active",
      "location": {
        "id": 1,
        "name": "Main Office"
      }
    },
    "can_check_in": false,
    "can_check_out": true,
    "working_hours": {
      "start": "08:00",
      "end": "17:00"
    },
    "current_time": "14:30:00",
    "current_date": "2025-01-15"
  }
}
```
### GET /attendance/records
Get attendance records.

Query Parameters:

- employee_id (string): Filter by employee
- date_from (date): Start date (YYYY-MM-DD)
- date_to (date): End date (YYYY-MM-DD)
- status (string): Filter by status
- location_id (integer): Filter by location
- department (string): Filter by department
- page (integer): Page number
- limit (integer): Items per page
Response:

```
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1001,
        "employee_id": "emp_123456",
        "employee_name": "John Doe",
        "employee_number": "EMP001",
        "department": "IT",
        "date": "2025-01-15",
        "check_in_time": "08:30:00",
        "check_out_time": "17:30:00",
        "total_hours": 8.5,
        "overtime_hours": 0.5,
        "break_duration": 60,
        "status": "present",
        "fraud_score": 2,
        "check_in_location": {
          "id": 1,
          "name": "Main Office",
          "distance": 45.5
        },
        "check_out_location": {
          "id": 1,
          "name": "Main Office",
          "distance": 52.3
        },
        "photos": {
          "check_in": "https://storage.example.
          com/attendance/checkin_1001.jpg",
          "check_out": "https://storage.
          example.com/attendance/checkout_1001.
          jpg"
        },
        "notes": "Regular work day"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_records": 200,
      "per_page": 20
    },
    "summary": {
      "total_present": 180,
      "total_late": 15,
      "total_absent": 5,
      "total_hours": 1530.0,
      "total_overtime": 45.5,
      "attendance_rate": 90.0,
      "punctuality_rate": 92.3
    }
  }
}
```
## Audit Logs APIs
### GET /audit-logs
Get system audit logs.

Query Parameters:

- user_id (string): Filter by user
- action (string): Filter by action
- resource_type (string): Filter by resource type
- resource_id (string): Filter by resource ID
- date_from (datetime): Start date
- date_to (datetime): End date
- page (integer): Page number
- limit (integer): Items per page
Response:

```
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "user_id": "usr_123456",
        "user_name": "John Doe",
        "action": "CREATE",
        "resource_type": "staff",
        "resource_id": "emp_789012",
        "old_values": null,
        "new_values": {
          "full_name": "Jane Smith",
          "department": "HR",
          "position": "HR Manager"
        },
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "timestamp": "2025-01-15T08:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 50,
      "total_records": 1000,
      "per_page": 20
    }
  }
}
```
## Response Format Standards
### Success Response
```
{
  "success": true,
  "data": {},
  "message": "Operation completed 
  successfully",
  "timestamp": "2025-01-15T08:30:00Z"
}
```
### Error Response
```
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email format is invalid"
    }
  },
  "timestamp": "2025-01-15T08:30:00Z"
}
```
### Pagination Response
```
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_records": 200,
      "per_page": 20,
      "has_next": true,
      "has_prev": false
    }
  }
}
```
## Error Codes
### Authentication Errors
- AUTH_INVALID_CREDENTIALS : Invalid username or password
- AUTH_TOKEN_EXPIRED : Access token has expired
- AUTH_TOKEN_INVALID : Invalid or malformed token
- AUTH_INSUFFICIENT_PERMISSIONS : User lacks required permissions
- AUTH_ACCOUNT_DISABLED : User account is disabled
### Validation Errors
- VALIDATION_ERROR : General validation error
- VALIDATION_REQUIRED_FIELD : Required field is missing
- VALIDATION_INVALID_FORMAT : Field format is invalid
- VALIDATION_DUPLICATE_VALUE : Value already exists
### Attendance Errors
- ATTENDANCE_LOCATION_OUT_OF_RANGE : Location outside allowed range
- ATTENDANCE_INVALID_WORKING_HOURS : Outside working hours
- ATTENDANCE_ALREADY_CHECKED_IN : Already checked in today
- ATTENDANCE_NOT_CHECKED_IN : Not checked in yet
- ATTENDANCE_PHOTO_REQUIRED : Photo is required
- ATTENDANCE_LOCATION_REQUIRED : Location is required
- ATTENDANCE_GPS_ACCURACY_LOW : GPS accuracy too low
- ATTENDANCE_FRAUD_DETECTED : Suspicious activity detected
- ATTENDANCE_WEEKEND_NOT_ALLOWED : Weekend attendance not allowed
- ATTENDANCE_HOLIDAY_NOT_ALLOWED : Holiday attendance not allowed
### System Errors
- INTERNAL_SERVER_ERROR : Internal server error
- SERVICE_UNAVAILABLE : Service temporarily unavailable
- RATE_LIMIT_EXCEEDED : Too many requests
- RESOURCE_NOT_FOUND : Requested resource not found
## Security & Authentication
### Authentication Method
- Type : JWT (JSON Web Token)
- Header : Authorization: Bearer {token}
- Token Expiry : 24 hours
- Refresh Token Expiry : 30 days
### Rate Limiting
- Login Attempts : 5 attempts per 15 minutes per IP
- API Calls : 1000 requests per hour per user
- File Uploads : 10 uploads per minute per user
### Security Headers
```
Authorization: Bearer {jwt_token}
X-Device-ID: {unique_device_identifier}
X-App-Version: {app_version}
X-Platform: android|ios|web
X-Request-ID: {unique_request_id}
```
### CORS Configuration
- Allowed Origins : Configured per environment
- Allowed Methods : GET, POST, PUT, DELETE, OPTIONS
- Allowed Headers : Authorization, Content-Type, X-Device-ID
### Data Encryption
- In Transit : TLS 1.3
- At Rest : AES-256
- Passwords : bcrypt with salt rounds 12
- Sensitive Data : Field-level encryption
## WebSocket Events (Real-time)
### Connection
```
ws://localhost:3000/ws?token={jwt_token}
```
### Events attendance.checked_in
```
{
  "event": "attendance.checked_in",
  "data": {
    "employee_id": "emp_123456",
    "employee_name": "John Doe",
    "timestamp": "2025-01-15T08:30:00Z",
    "location": "Main Office",
    "status": "present"
  }
}
``` attendance.checked_out
```
{
  "event": "attendance.checked_out",
  "data": {
    "employee_id": "emp_123456",
    "employee_name": "John Doe",
    "timestamp": "2025-01-15T17:30:00Z",
    "total_hours": 8.5,
    "overtime_hours": 0.5
  }
}
``` attendance.fraud_detected
```
{
  "event": "attendance.fraud_detected",
  "data": {
    "employee_id": "emp_123456",
    "fraud_type": "location_spoofing",
    "score": 8,
    "timestamp": "2025-01-15T08:30:00Z"
  }
}
```
## Testing
### Base URLs
- Development : http://localhost:3000/api/v1
- Staging : https://staging-api.cybercafe.com/v1
- Production : https://api.cybercafe.com/v1
### Sample cURL Commands Login
```
curl -X POST http://localhost:3000/api/v1/auth/
login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "password123"
  }'
``` Check-in
```
curl -X POST http://localhost:3000/api/v1/
attendance/check-in \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "emp_123456",
    "photo": "data:image/jpeg;base64,...",
    "location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "location_id": 1
    }
  }'
```
Last Updated: January 15, 2025 Version: 1.0.0

```

Dua file dokumentasi ini memberikan panduan 
lengkap untuk:

1. **database_schema.sql**: Struktur database 
lengkap dengan tabel, relasi, index, dan view
2. **api_documentation.md**: Spesifikasi API 
lengkap dengan endpoint, request/response 
format, error handling, dan security

Dokumentasi ini dapat digunakan sebagai 
referensi untuk development tim dan 
implementasi sistem cybercafe management
```


