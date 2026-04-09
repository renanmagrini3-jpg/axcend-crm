-- ============================================
-- Migration 001: Organizations, Contacts, Companies
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  mode        TEXT NOT NULL DEFAULT 'B2B',
  logo        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  position        TEXT,
  company_id      UUID,
  organization_id UUID NOT NULL,
  origin          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Companies table
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  cnpj            TEXT,
  segment         TEXT,
  size            TEXT,
  website         TEXT,
  organization_id UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys
ALTER TABLE contacts
  ADD CONSTRAINT fk_contacts_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE contacts
  ADD CONSTRAINT fk_contacts_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_organization ON companies(organization_id);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Helper: get organization_id from JWT user_metadata
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
$$;

-- Organizations: users can only access their own org
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = public.get_user_org_id());

CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = public.get_user_org_id());

CREATE POLICY "org_delete" ON organizations
  FOR DELETE USING (id = public.get_user_org_id());

-- Contacts: filter by organization_id
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- Companies: filter by organization_id
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "companies_update" ON companies
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "companies_delete" ON companies
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- Auto-update updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
