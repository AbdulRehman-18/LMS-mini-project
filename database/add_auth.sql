-- Add password field to members table
ALTER TABLE members ADD COLUMN password VARCHAR(255) DEFAULT 'password123';

-- Update existing members with default password
UPDATE members SET password = 'password123' WHERE password IS NULL;

-- Create admin user (if not exists)
INSERT INTO members (name, email, phone, address, membership_type, membership_date, membership_status, password) 
VALUES ('Admin User', 'abdulrehman@gmail.com', '(000) 000-0000', 'Admin Address', 'Premium', CURDATE(), 'Active', 'abdulrehman')
ON DUPLICATE KEY UPDATE password = 'abdulrehman';
