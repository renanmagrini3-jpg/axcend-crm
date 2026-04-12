-- ============================================
-- Migration 009: Fix onboarding RLS
-- Run this in Supabase SQL Editor
-- ============================================
-- Problem: During onboarding, a new user has no organization_id in their JWT.
-- The INSERT into organizations works (WITH CHECK true), but the subsequent
-- SELECT (from .select().single()), plus INSERT into pipelines/stages all fail
-- because get_user_org_id() returns NULL.
--
-- Solution: A SECURITY DEFINER function that atomically creates the org,
-- default pipeline, stages, and organization_member entry — all bypassing RLS.
-- ============================================

CREATE OR REPLACE FUNCTION public.onboard_create_organization(
  p_name TEXT,
  p_slug TEXT,
  p_mode TEXT DEFAULT 'B2B'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_org_id UUID;
  v_org_id UUID;
  v_pipeline_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has an org
  v_existing_org_id := (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID;
  IF v_existing_org_id IS NOT NULL THEN
    RETURN json_build_object('organization_id', v_existing_org_id, 'already_exists', true);
  END IF;

  -- Get user info from auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
  INTO v_user_email, v_user_name
  FROM auth.users WHERE id = v_user_id;

  -- Create organization
  INSERT INTO organizations (name, slug, mode)
  VALUES (p_name, p_slug, p_mode)
  RETURNING id INTO v_org_id;

  -- Create organization member (admin)
  INSERT INTO organization_members (user_id, organization_id, role, name, email, joined_at)
  VALUES (v_user_id, v_org_id, 'admin', v_user_name, v_user_email, now());

  -- Create default pipeline
  INSERT INTO pipelines (name, organization_id)
  VALUES ('Pipeline Comercial', v_org_id)
  RETURNING id INTO v_pipeline_id;

  -- Create default stages
  INSERT INTO pipeline_stages (name, "order", pipeline_id)
  VALUES
    ('Prospecção',      1, v_pipeline_id),
    ('Agendamento',     2, v_pipeline_id),
    ('Reunião',         3, v_pipeline_id),
    ('Proposta',        4, v_pipeline_id),
    ('Negociação',      5, v_pipeline_id),
    ('Fechado Ganho',   6, v_pipeline_id),
    ('Fechado Perdido', 7, v_pipeline_id);

  -- Create default loss reasons
  INSERT INTO loss_reasons (name, organization_id)
  VALUES
    ('Preço',        v_org_id),
    ('Concorrência', v_org_id),
    ('Timing',       v_org_id),
    ('Sem resposta', v_org_id),
    ('Outro',        v_org_id);

  -- Create default task types
  INSERT INTO task_types (name, icon, organization_id)
  VALUES
    ('Ligação',   'phone',    v_org_id),
    ('E-mail',    'mail',     v_org_id),
    ('Reunião',   'calendar', v_org_id),
    ('Follow-up', 'repeat',   v_org_id);

  RETURN json_build_object('organization_id', v_org_id);
END;
$$;
