-- ============================================
-- Migration 010: Custom Field Values
-- Stores actual values for custom fields per entity (deal, contact, company)
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS custom_field_values (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id  UUID NOT NULL,
  entity_id        UUID NOT NULL,
  entity_type      TEXT NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company')),
  value            TEXT NOT NULL DEFAULT '',
  organization_id  UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys
ALTER TABLE custom_field_values
  ADD CONSTRAINT fk_cfv_custom_field
  FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE;

ALTER TABLE custom_field_values
  ADD CONSTRAINT fk_cfv_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Unique constraint: one value per field per entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_cfv_unique
  ON custom_field_values(custom_field_id, entity_id);

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_cfv_entity
  ON custom_field_values(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_cfv_organization
  ON custom_field_values(organization_id);

-- RLS
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_field_values_select" ON custom_field_values
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "custom_field_values_insert" ON custom_field_values
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "custom_field_values_update" ON custom_field_values
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "custom_field_values_delete" ON custom_field_values
  FOR DELETE USING (organization_id = public.get_user_org_id());
