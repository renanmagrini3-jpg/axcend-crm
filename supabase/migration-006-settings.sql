-- ============================================
-- Migration 006: Settings (Members, Loss Reasons, Task Types)
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Organization Members table
-- ============================================

CREATE TABLE IF NOT EXISTS organization_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID,
  organization_id  UUID NOT NULL,
  role             TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'manager', 'seller')),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  invited_at       TIMESTAMPTZ,
  joined_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organization_members
  ADD CONSTRAINT fk_organization_members_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE organization_members
  ADD CONSTRAINT fk_organization_members_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_unique_email
  ON organization_members(organization_id, email);

CREATE INDEX IF NOT EXISTS idx_organization_members_organization
  ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON organization_members(user_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organization_members_select" ON organization_members
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "organization_members_insert" ON organization_members
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "organization_members_update" ON organization_members
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "organization_members_delete" ON organization_members
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- 2. Loss Reasons table
-- ============================================

CREATE TABLE IF NOT EXISTS loss_reasons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  organization_id  UUID NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE loss_reasons
  ADD CONSTRAINT fk_loss_reasons_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_loss_reasons_organization ON loss_reasons(organization_id);
CREATE INDEX IF NOT EXISTS idx_loss_reasons_active ON loss_reasons(organization_id, is_active);

ALTER TABLE loss_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loss_reasons_select" ON loss_reasons
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "loss_reasons_insert" ON loss_reasons
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "loss_reasons_update" ON loss_reasons
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "loss_reasons_delete" ON loss_reasons
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- 3. Task Types table
-- ============================================

CREATE TABLE IF NOT EXISTS task_types (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  icon             TEXT,
  organization_id  UUID NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_types
  ADD CONSTRAINT fk_task_types_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_task_types_organization ON task_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_types_active ON task_types(organization_id, is_active);

ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_types_select" ON task_types
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "task_types_insert" ON task_types
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "task_types_update" ON task_types
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "task_types_delete" ON task_types
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- 4. Seeds for Renan Magrini's organization
-- Looks up renanmagrini3@gmail.com in auth.users,
-- reads organization_id from user_metadata, and seeds defaults.
-- Safe to re-run (uses ON CONFLICT / NOT EXISTS).
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id  UUID;
  v_name    TEXT;
  v_email   TEXT := 'renanmagrini3@gmail.com';
BEGIN
  SELECT
    u.id,
    (u.raw_user_meta_data->>'organization_id')::UUID,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Renan Magrini')
  INTO v_user_id, v_org_id, v_name
  FROM auth.users u
  WHERE u.email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User % not found in auth.users — skipping seed.', v_email;
    RETURN;
  END IF;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'User % has no organization_id in user_metadata — skipping seed.', v_email;
    RETURN;
  END IF;

  -- 4.1 Seed Renan as admin
  INSERT INTO organization_members (user_id, organization_id, role, name, email, joined_at)
  VALUES (v_user_id, v_org_id, 'admin', v_name, v_email, now())
  ON CONFLICT (organization_id, email) DO UPDATE
    SET role = 'admin',
        user_id = EXCLUDED.user_id,
        joined_at = COALESCE(organization_members.joined_at, EXCLUDED.joined_at);

  -- 4.2 Seed loss reasons (5 padrão)
  INSERT INTO loss_reasons (name, organization_id)
  SELECT reason_name, v_org_id
  FROM (VALUES
    ('Preço'),
    ('Concorrência'),
    ('Timing'),
    ('Sem resposta'),
    ('Outro')
  ) AS t(reason_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM loss_reasons lr
    WHERE lr.organization_id = v_org_id AND lr.name = t.reason_name
  );

  -- 4.3 Seed task types (6 padrão)
  INSERT INTO task_types (name, icon, organization_id)
  SELECT type_name, type_icon, v_org_id
  FROM (VALUES
    ('Ligação', 'Phone'),
    ('E-mail', 'Mail'),
    ('Reunião', 'Calendar'),
    ('Follow-up', 'Repeat'),
    ('Proposta', 'FileText'),
    ('Outro', 'Circle')
  ) AS t(type_name, type_icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM task_types tt
    WHERE tt.organization_id = v_org_id AND tt.name = t.type_name
  );
END $$;
