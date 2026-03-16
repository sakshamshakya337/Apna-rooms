-- ==========================================
-- APNA ROOMS - DEFINITIVE DATABASE SCHEMA
-- ==========================================
-- This file contains all tables, enums, storage, and RLS policies.
-- Safe to run multiple times.

-- 0. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'sub_admin', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failure');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_type AS ENUM ('single', 'complete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- PGs Table
CREATE TABLE IF NOT EXISTS pgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    main_image TEXT,
    images TEXT[] DEFAULT '{}', 
    amenities TEXT[] DEFAULT '{}', 
    rules TEXT[] DEFAULT '{}',
    security_deposit DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat DECIMAL(10, 2) NOT NULL,
    amenities TEXT[] DEFAULT '{}', 
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT check_seats CHECK (available_seats <= total_seats AND available_seats >= 0)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    status booking_status DEFAULT 'pending',
    type booking_type DEFAULT 'single',
    payment_plan TEXT DEFAULT 'full', -- 'full' or 'half'
    contract_months INTEGER DEFAULT 1, -- Added contract duration (1, 6, 12 months)
    check_in_date DATE,
    check_out_date DATE,
    user_photo_url TEXT,
    university_id_url TEXT,
    aadhar_front_url TEXT,
    aadhar_back_url TEXT,
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_id TEXT UNIQUE, 
    order_id TEXT, 
    signature TEXT, 
    status payment_status DEFAULT 'pending',
    type TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    urgency urgency_level DEFAULT 'medium',
    status complaint_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Electricity Bills Table
CREATE TABLE IF NOT EXISTS electricity_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    units DECIMAL(10, 2) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    billing_month TEXT NOT NULL, 
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Contact Queries Table
CREATE TABLE IF NOT EXISTS contact_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. SCHEMA REPAIR & MIGRATION BLOCK (CRITICAL)
-- Run this to ensure existing tables have all new columns
DO $$ 
BEGIN 
    -- Fix Users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
        ALTER TABLE users ADD COLUMN phone_number TEXT;
        ALTER TABLE users ADD COLUMN address TEXT;
        ALTER TABLE users ADD COLUMN city TEXT;
        ALTER TABLE users ADD COLUMN state TEXT;
    END IF;

    -- Fix PGs table Updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pgs' AND column_name='rules') THEN
        ALTER TABLE pgs ADD COLUMN rules TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pgs' AND column_name='amenities') THEN
        ALTER TABLE pgs ADD COLUMN amenities TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pgs' AND column_name='main_image') THEN
        ALTER TABLE pgs ADD COLUMN main_image TEXT;
    END IF;

    -- Rooms Table Updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='amenities') THEN
        ALTER TABLE rooms ADD COLUMN amenities TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='image_url') THEN
        ALTER TABLE rooms ADD COLUMN image_url TEXT;
    END IF;

    -- Bookings Table Updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='user_photo_url') THEN
        ALTER TABLE bookings ADD COLUMN user_photo_url TEXT;
        ALTER TABLE bookings ADD COLUMN university_id_url TEXT;
        ALTER TABLE bookings ADD COLUMN aadhar_front_url TEXT;
        ALTER TABLE bookings ADD COLUMN aadhar_back_url TEXT;
        ALTER TABLE bookings ADD COLUMN is_kyc_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE bookings ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0.00;
        ALTER TABLE bookings ADD COLUMN payment_plan TEXT DEFAULT 'full';
        ALTER TABLE bookings ADD COLUMN contract_months INTEGER DEFAULT 1;
    END IF;
END $$;

-- 4. SECURITY & POLICIES (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_queries ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all policies for consistency
-- Users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable update for users" ON users;
CREATE POLICY "Enable update for users" ON users FOR UPDATE USING (true) WITH CHECK (true);

-- PGs
DROP POLICY IF EXISTS "Public can view active PGs" ON pgs;
CREATE POLICY "Public can view active PGs" ON pgs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all operations for pgs" ON pgs;
CREATE POLICY "Enable all operations for pgs" ON pgs FOR ALL USING (true) WITH CHECK (true);

-- Rooms
DROP POLICY IF EXISTS "Public can view rooms" ON rooms;
CREATE POLICY "Public can view rooms" ON rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all operations for rooms" ON rooms;
CREATE POLICY "Enable all operations for rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Enable all operations for bookings" ON bookings;
CREATE POLICY "Enable all operations for bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Enable all operations for payments" ON payments;
CREATE POLICY "Enable all operations for payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Complaints
DROP POLICY IF EXISTS "Enable all operations for complaints" ON complaints;
CREATE POLICY "Enable all operations for complaints" ON complaints FOR ALL USING (true) WITH CHECK (true);

-- Electricity Bills
DROP POLICY IF EXISTS "Public can view electricity_bills" ON electricity_bills;
CREATE POLICY "Public can view electricity_bills" ON electricity_bills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all operations for electricity_bills" ON electricity_bills;
CREATE POLICY "Enable all operations for electricity_bills" ON electricity_bills FOR ALL USING (true) WITH CHECK (true);

-- Contact Queries
DROP POLICY IF EXISTS "Public can submit contact queries" ON contact_queries;
CREATE POLICY "Public can submit contact queries" ON contact_queries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view contact queries" ON contact_queries;
CREATE POLICY "Admins can view contact queries" ON contact_queries FOR SELECT USING (true);

-- 5. STORAGE SETUP
-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('pg-images', 'pg-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'pg-images');
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pg-images');
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'pg-images');
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'pg-images');

DROP POLICY IF EXISTS "Private Access" ON storage.objects;
CREATE POLICY "Private Access" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents');
DROP POLICY IF EXISTS "Private Upload" ON storage.objects;
CREATE POLICY "Private Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents');

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_rooms_pg_id ON rooms(pg_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- 7. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 8. SEED DATA (Admin Account)
-- Email: apnarooms@gmail.com | Password: se4ospl7IW!@
INSERT INTO users (email, password, full_name, role)
VALUES (
    'apnarooms@gmail.com', 
    '$2b$10$YKvN7HiVD9IPap50l.mFZ.f70uQ6DuMefGup84Z06Ab.wys6L5Uqi', 
    'Apna Rooms Admin', 
    'super_admin'
) ON CONFLICT (email) DO NOTHING;
