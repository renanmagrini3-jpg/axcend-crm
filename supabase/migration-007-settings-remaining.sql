-- ============================================
-- Migration 007: Settings Remaining Tabs
-- (Custom Fields, Notification Preferences, Lead Distribution Rules)
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Custom Fields table
-- ============================================

CREATE TABLE IF NOT EXISTS custom_fields (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL CHECK (entity_type IN ('deal', 'contact', 'company')),
  field_name       TEXT NOT NULL,
  field_type       TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'boolean')),
  field_options    JSONB NOT NULL DEFAULT '[]',
  is_required      BOOLEAN NOT NULL DEFAULT false,
  field_order      INTEGER NOT NULL DEFAULT 0,
  organization_id  UUID NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE custom_fields
  ADD CONSTRAINT fk_custom_fields_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_custom_fields_organization
  ON custom_fields(organization_id);

CREATE INDEX IF NOT EXISTS idx_custom_fields_entity
  ON custom_fields(organization_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_custom_fields_active
  ON custom_fields(organization_id, is_active);

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_fields_select" ON custom_fields
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "custom_fields_insert" ON custom_fields
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "custom_fields_update" ON custom_fields
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "custom_fields_delete" ON custom_fields
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- 2. Notification Preferences table
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL,
  organization_id            UUID NOT NULL,
  notify_deal_assigned       BOOLEAN NOT NULL DEFAULT true,
  notify_deal_stage_changed  BOOLEAN NOT NULL DEFAULT true,
  notify_task_due            BOOLEAN NOT NULL DEFAULT true,
  notify_task_overdue        BOOLEAN NOT NULL DEFAULT true,
  notify_new_contact         BOOLEAN NOT NULL DEFAULT false,
  notify_deal_won            BOOLEAN NOT NULL DEFAULT true,
  notify_deal_lost           BOOLEAN NOT NULL DEFAULT true,
  email_notifications        BOOLEAN NOT NULL DEFAULT true,
  browser_notifications      BOOLEAN NOT NULL DEFAULT false,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences
  ADD CONSTRAINT fk_notification_preferences_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE notification_preferences
  ADD CONSTRAINT fk_notification_preferences_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_unique
  ON notification_preferences(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_organization
  ON notification_preferences(organization_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select" ON notification_preferences
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "notification_preferences_insert" ON notification_preferences
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "notification_preferences_update" ON notification_preferences
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "notification_preferences_delete" ON notification_preferences
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- 3. Lead Distribution Rules table
-- ============================================

CREATE TABLE IF NOT EXISTS lead_distribution_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  rule_type        TEXT NOT NULL CHECK (rule_type IN ('round_robin', 'weighted', 'territory', 'segment', 'value_based', 'hybrid', 'custom')),
  rule_config      JSONB NOT NULL DEFAULT '{}',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  priority         INTEGER NOT NULL DEFAULT 0,
  organization_id  UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lead_distribution_rules
  ADD CONSTRAINT fk_lead_distribution_rules_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lead_distribution_rules_organization
  ON lead_distribution_rules(organization_id);

CREATE INDEX IF NOT EXISTS idx_lead_distribution_rules_active
  ON lead_distribution_rules(organization_id, is_active);

ALTER TABLE lead_distribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_distribution_rules_select" ON lead_distribution_rules
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "lead_distribution_rules_insert" ON lead_distribution_rules
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "lead_distribution_rules_update" ON lead_distribution_rules
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "lead_distribution_rules_delete" ON lead_distribution_rules
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- 4. Add plan field to organizations (if missing)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;

-- ============================================
-- 5. Seeds for Renan Magrini's organization
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_email  TEXT := 'renanmagrini3@gmail.com';
BEGIN
  SELECT (u.raw_user_meta_data->>'organization_id')::UUID
  INTO v_org_id
  FROM auth.users u
  WHERE u.email = v_email
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'User % not found or has no org — skipping seed.', v_email;
    RETURN;
  END IF;

  -- 5.1 Seed lead distribution rules (3 defaults)
  INSERT INTO lead_distribution_rules (name, description, rule_type, is_active, priority, organization_id)
  SELECT r.name, r.description, r.rule_type, r.is_active, r.priority, v_org_id
  FROM (VALUES
    ('Round Robin',   'Distribuição igualitária e sequencial entre todos os vendedores',          'round_robin', true,  1),
    ('Por Segmento',  'Distribuição baseada no segmento do lead (ex: indústria, porte)',          'segment',     false, 2),
    ('Por Valor',     'Leads acima de determinado valor direcionados a vendedores especializados', 'value_based', false, 3)
  ) AS r(name, description, rule_type, is_active, priority)
  WHERE NOT EXISTS (
    SELECT 1 FROM lead_distribution_rules ldr
    WHERE ldr.organization_id = v_org_id AND ldr.name = r.name
  );

END $$;
