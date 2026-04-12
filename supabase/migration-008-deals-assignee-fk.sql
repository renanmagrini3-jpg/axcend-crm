-- ============================================
-- Migration 008: Add FK from deals.assigned_to_id to organization_members
-- Run this in Supabase SQL Editor
-- ============================================

-- Add FK constraint (safe: skips if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deals_assigned_to_id_fkey'
      AND table_name = 'deals'
  ) THEN
    ALTER TABLE deals
      ADD CONSTRAINT deals_assigned_to_id_fkey
      FOREIGN KEY (assigned_to_id) REFERENCES organization_members(id) ON DELETE SET NULL;
  END IF;
END $$;
