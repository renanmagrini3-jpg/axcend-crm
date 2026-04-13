-- ============================================
-- Migration 011: Deal Attachments
-- Stores file metadata for deal attachments (files in Supabase Storage)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Table
CREATE TABLE IF NOT EXISTS deal_attachments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          UUID NOT NULL,
  file_name        TEXT NOT NULL,
  file_path        TEXT NOT NULL,
  file_size        INTEGER NOT NULL DEFAULT 0,
  uploaded_by      UUID NOT NULL,
  organization_id  UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Foreign keys
ALTER TABLE deal_attachments
  ADD CONSTRAINT fk_deal_attachments_deal
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

ALTER TABLE deal_attachments
  ADD CONSTRAINT fk_deal_attachments_user
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE deal_attachments
  ADD CONSTRAINT fk_deal_attachments_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_deal_attachments_deal
  ON deal_attachments(deal_id);

CREATE INDEX IF NOT EXISTS idx_deal_attachments_organization
  ON deal_attachments(organization_id);

-- 4. RLS
ALTER TABLE deal_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_attachments_select" ON deal_attachments
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "deal_attachments_insert" ON deal_attachments
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "deal_attachments_delete" ON deal_attachments
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- 5. Storage bucket (run separately if this fails — some Supabase plans require UI creation)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('deal-attachments', 'deal-attachments', false)
-- ON CONFLICT (id) DO NOTHING;

-- NOTE: Create the bucket 'deal-attachments' manually in Supabase Dashboard > Storage
-- Set it as PRIVATE (not public)
-- Add these storage policies in Supabase Dashboard > Storage > Policies:
--
-- SELECT policy (name: "Org members can read attachments"):
--   bucket_id = 'deal-attachments'
--   AND (storage.foldername(name))[1] = (
--     SELECT (raw_user_meta_data->>'organization_id')
--     FROM auth.users WHERE id = auth.uid()
--   )
--
-- INSERT policy (name: "Org members can upload attachments"):
--   bucket_id = 'deal-attachments'
--   AND (storage.foldername(name))[1] = (
--     SELECT (raw_user_meta_data->>'organization_id')
--     FROM auth.users WHERE id = auth.uid()
--   )
--
-- DELETE policy (name: "Org members can delete attachments"):
--   bucket_id = 'deal-attachments'
--   AND (storage.foldername(name))[1] = (
--     SELECT (raw_user_meta_data->>'organization_id')
--     FROM auth.users WHERE id = auth.uid()
--   )
