-- ============================================
-- Migration 005: Deal Notes
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Deal Notes table
CREATE TABLE IF NOT EXISTS deal_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          UUID NOT NULL,
  content          TEXT NOT NULL,
  author_id        UUID,
  author_name      TEXT,
  organization_id  UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys
ALTER TABLE deal_notes
  ADD CONSTRAINT fk_deal_notes_deal
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

ALTER TABLE deal_notes
  ADD CONSTRAINT fk_deal_notes_author
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE deal_notes
  ADD CONSTRAINT fk_deal_notes_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_notes_deal ON deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_notes_organization ON deal_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_deal_notes_created_at ON deal_notes(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_notes_select" ON deal_notes
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "deal_notes_insert" ON deal_notes
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "deal_notes_update" ON deal_notes
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "deal_notes_delete" ON deal_notes
  FOR DELETE USING (organization_id = public.get_user_org_id());
