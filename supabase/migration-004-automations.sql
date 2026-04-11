-- ============================================
-- Migration 004: Automations, Automation Steps, Automation Logs
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Automations table
CREATE TABLE IF NOT EXISTS automations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT false,
  trigger_type      TEXT NOT NULL,
  trigger_config    JSONB NOT NULL DEFAULT '{}'::jsonb,
  organization_id   UUID NOT NULL,
  created_by        UUID,
  execution_count   INTEGER NOT NULL DEFAULT 0,
  last_executed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Automation Steps table
CREATE TABLE IF NOT EXISTS automation_steps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id  UUID NOT NULL,
  step_order     INTEGER NOT NULL,
  step_type      TEXT NOT NULL,
  step_config    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Automation Logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id  UUID NOT NULL,
  deal_id        UUID,
  contact_id     UUID,
  status         TEXT NOT NULL,
  message        TEXT,
  executed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign keys: Automations
ALTER TABLE automations
  ADD CONSTRAINT fk_automations_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE automations
  ADD CONSTRAINT fk_automations_created_by
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Foreign keys: Automation Steps
ALTER TABLE automation_steps
  ADD CONSTRAINT fk_automation_steps_automation
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE;

-- Foreign keys: Automation Logs
ALTER TABLE automation_logs
  ADD CONSTRAINT fk_automation_logs_automation
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE;

ALTER TABLE automation_logs
  ADD CONSTRAINT fk_automation_logs_deal
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE automation_logs
  ADD CONSTRAINT fk_automation_logs_contact
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_organization ON automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_steps_automation ON automation_steps(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON automation_logs(executed_at);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Automations: direct organization filter
CREATE POLICY "automations_select" ON automations
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "automations_insert" ON automations
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "automations_update" ON automations
  FOR UPDATE USING (organization_id = public.get_user_org_id());

CREATE POLICY "automations_delete" ON automations
  FOR DELETE USING (organization_id = public.get_user_org_id());

-- Automation Steps: access via parent automation's organization
CREATE POLICY "automation_steps_select" ON automation_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_steps.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "automation_steps_insert" ON automation_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_steps.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "automation_steps_update" ON automation_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_steps.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "automation_steps_delete" ON automation_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_steps.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

-- Automation Logs: access via parent automation's organization
CREATE POLICY "automation_logs_select" ON automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_logs.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "automation_logs_insert" ON automation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_logs.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "automation_logs_update" ON automation_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_logs.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "automation_logs_delete" ON automation_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM automations
      WHERE automations.id = automation_logs.automation_id
        AND automations.organization_id = public.get_user_org_id()
    )
  );

-- ============================================
-- Auto-update updated_at trigger for automations
-- ============================================

CREATE TRIGGER set_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Seed: default automations for Axcend Sales
-- ============================================

DO $$
DECLARE
  v_org_id        UUID;
  v_automation_id UUID;
BEGIN
  SELECT id INTO v_org_id
  FROM organizations
  WHERE slug = 'axcend-sales'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Organization "axcend-sales" not found — skipping automation seed.';
    RETURN;
  END IF;

  -- 1. Boas-vindas ao lead
  IF NOT EXISTS (
    SELECT 1 FROM automations
    WHERE name = 'Boas-vindas ao lead' AND organization_id = v_org_id
  ) THEN
    INSERT INTO automations (name, description, is_active, trigger_type, trigger_config, organization_id)
    VALUES (
      'Boas-vindas ao lead',
      'Cria tarefa de follow-up em 24h quando um novo contato é cadastrado.',
      true,
      'contact_created',
      '{}'::jsonb,
      v_org_id
    )
    RETURNING id INTO v_automation_id;

    INSERT INTO automation_steps (automation_id, step_order, step_type, step_config)
    VALUES (
      v_automation_id,
      1,
      'create_task',
      '{"title":"Follow-up com novo lead","delay_hours":24,"priority":"MEDIUM","type":"FOLLOW_UP"}'::jsonb
    );
  END IF;

  -- 2. Deal avançou de etapa
  IF NOT EXISTS (
    SELECT 1 FROM automations
    WHERE name = 'Deal avançou de etapa' AND organization_id = v_org_id
  ) THEN
    INSERT INTO automations (name, description, is_active, trigger_type, trigger_config, organization_id)
    VALUES (
      'Deal avançou de etapa',
      'Notifica a equipe quando um deal muda de etapa no pipeline.',
      true,
      'deal_stage_changed',
      '{}'::jsonb,
      v_org_id
    )
    RETURNING id INTO v_automation_id;

    INSERT INTO automation_steps (automation_id, step_order, step_type, step_config)
    VALUES (
      v_automation_id,
      1,
      'send_notification',
      '{"channel":"team","message":"Um deal avançou para a próxima etapa do pipeline."}'::jsonb
    );
  END IF;

  -- 3. Tarefa atrasada
  IF NOT EXISTS (
    SELECT 1 FROM automations
    WHERE name = 'Tarefa atrasada' AND organization_id = v_org_id
  ) THEN
    INSERT INTO automations (name, description, is_active, trigger_type, trigger_config, organization_id)
    VALUES (
      'Tarefa atrasada',
      'Notifica o responsável e cria tarefa de cobrança quando uma tarefa fica vencida.',
      true,
      'task_overdue',
      '{}'::jsonb,
      v_org_id
    )
    RETURNING id INTO v_automation_id;

    INSERT INTO automation_steps (automation_id, step_order, step_type, step_config)
    VALUES
      (
        v_automation_id,
        1,
        'send_notification',
        '{"channel":"owner","message":"Tarefa vencida requer atenção imediata."}'::jsonb
      ),
      (
        v_automation_id,
        2,
        'create_task',
        '{"title":"Cobrar responsável sobre tarefa atrasada","delay_hours":0,"priority":"HIGH","type":"FOLLOW_UP"}'::jsonb
      );
  END IF;
END $$;
