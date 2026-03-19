-- Clean and seed database
-- Run this in Supabase SQL Editor

-- 1. Clean old data
TRUNCATE users CASCADE;
TRUNCATE institutions CASCADE;

-- 2. Create demo institution
INSERT INTO institutions (slug, name, email, city, country, timezone, currency, "isActive", "createdAt", "updatedAt")
VALUES ('bd-gps', 'BD-GPS Demo School', 'admin@school.edu', 'Dhaka', 'BD', 'Asia/Dhaka', 'BDT', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET "isActive" = true;

-- 3. Get institution ID
-- (Will be used in next step)

-- 4. Create demo users (run after step 3)
-- The application will auto-create these on first login
