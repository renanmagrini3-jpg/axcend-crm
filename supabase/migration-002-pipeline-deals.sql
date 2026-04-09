-- ============================================
-- Migration 002: Pipelines, Pipeline Stages, Deals
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  organization_id UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Pipeline Stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  "order"     INT NOT NULL DEFAULT 0,
  pipeline_id UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Deals table
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  value           DECIMAL(15,2) NOT NULL DEFAULT 0,
  priority        TEXT NOT NULL DEFAULT 'MEDIUM',
  contact_id      UUID NOT NULL,
  company_id      UUID,
  pipeline_id     UUID NOT NULL,
  stage_id        UUID NOT NULL,
  assigned_to_id  UUID,
  organization_id UUID NOT NULL,
  loss_reason     TEXT,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys: Pipelines
ALTER TABLE pipelines
  ADD CONSTRAINT fk_pipelines_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Foreign keys: Pipeline Stages
ALTER TABLE pipeline_stages
  ADD CONSTRAINT fk_pipeline_stages_pipeline
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE;

-- Foreign keys: Deals
ALTER TABLE deals
  ADD CONSTRAINT fk_deals_contact
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE deals
  ADD CONSTRAINT fk_deals_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE deals
  ADD CONSTRAINT fk_deals_pipeline
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE;

ALTER TABLE deals
  ADD CONSTRAINT fk_deals_stage
  FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE CASCADE;

ALTER TABLE deals
  ADD CONSTRAINT fk_deals_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipelines_organization ON pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_organization ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_deals_priority ON deals(priority);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Pipelines: filter by organization_id
CREATE POLICY "pipelines_select" ON pipelines
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "pipelines_insert" ON pipelines
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "pipelines_update" ON pipelines
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "pipelines_delete" ON pipelines
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- Pipeline Stages: access through pipeline's organization
CREATE POLICY "pipeline_stages_select" ON pipeline_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pipelines
      WHERE pipelines.id = pipeline_stages.pipeline_id
        AND pipelines.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "pipeline_stages_insert" ON pipeline_stages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pipelines
      WHERE pipelines.id = pipeline_stages.pipeline_id
        AND pipelines.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "pipeline_stages_update" ON pipeline_stages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pipelines
      WHERE pipelines.id = pipeline_stages.pipeline_id
        AND pipelines.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "pipeline_stages_delete" ON pipeline_stages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pipelines
      WHERE pipelines.id = pipeline_stages.pipeline_id
        AND pipelines.organization_id = public.get_user_org_id()
    )
  );

-- Deals: filter by organization_id
CREATE POLICY "deals_select" ON deals
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "deals_insert" ON deals
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "deals_update" ON deals
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "deals_delete" ON deals
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- ============================================
-- Auto-update updated_at trigger for deals
-- ============================================

CREATE TRIGGER set_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
