-- ============================================
-- Migration 003: Tasks
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'CUSTOM',
  priority        TEXT NOT NULL DEFAULT 'MEDIUM',
  status          TEXT NOT NULL DEFAULT 'PENDING',
  due_at          TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  deal_id         UUID,
  contact_id      UUID,
  assigned_to_id  UUID,
  organization_id UUID NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_contact
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_deal
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal ON tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (organization_id = public.get_user_org_id());
