-- PostgreSQL Database Schema for SyncSpace Organization System
-- Run this script to create all necessary tables

-- Users table (if not already exists)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_photo TEXT,
    otp VARCHAR(6),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    org_id SERIAL PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    org_description TEXT NOT NULL,
    org_type VARCHAR(50) DEFAULT 'business' CHECK (org_type IN ('business', 'nonprofit', 'educational', 'community', 'other')),
    access_level VARCHAR(20) DEFAULT 'invite-only' CHECK (access_level IN ('public', 'invite-only', 'admin-only')),
    org_code VARCHAR(6) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(org_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- Organization channels table
CREATE TABLE IF NOT EXISTS organization_channels (
    channel_id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(org_id) ON DELETE CASCADE,
    channel_name VARCHAR(100) NOT NULL,
    channel_description TEXT,
    created_by INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, channel_name)
);

-- Organization roles table
CREATE TABLE IF NOT EXISTS organization_roles (
    role_id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(org_id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_by INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, role_name)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_channels_org_id ON organization_channels(org_id);
CREATE INDEX IF NOT EXISTS idx_org_roles_org_id ON organization_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(org_code);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_access_level ON organizations(access_level);

-- GIN index for JSONB permissions queries
CREATE INDEX IF NOT EXISTS idx_org_roles_permissions ON organization_roles USING GIN (permissions);

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Main organizations table storing organization details';
COMMENT ON TABLE organization_members IS 'Junction table for organization membership';
COMMENT ON TABLE organization_channels IS 'Channels within organizations for communication';
COMMENT ON TABLE organization_roles IS 'Custom roles with permissions within organizations';

COMMENT ON COLUMN organizations.org_code IS 'Unique 6-character code for joining organizations';
COMMENT ON COLUMN organization_members.role IS 'User role in organization: admin or member';
COMMENT ON COLUMN organization_roles.permissions IS 'JSON array of permission strings';

-- Functions for common operations
CREATE OR REPLACE FUNCTION generate_org_code() 
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate org_code if not provided
CREATE OR REPLACE FUNCTION set_org_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_code IS NULL OR NEW.org_code = '' THEN
        NEW.org_code := generate_org_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_org_code
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION set_org_code();
