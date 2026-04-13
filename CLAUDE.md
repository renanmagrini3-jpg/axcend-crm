# Axcend CRM Platform

## Projeto
Este é o CRM da Axcend Sales — plataforma premium de gestão comercial.

## Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4 com Design Tokens
- Framer Motion (animações)
- Supabase (banco, auth, storage, real-time)
- Prisma (ORM, migrations)
- Upstash Redis (cache, filas)
- Stripe (pagamentos, assinaturas)
- Vercel (deploy)

## Design System
- Paleta: Laranja #F97316 (primária), Preto, Branco
- Dark mode como padrão
- Fontes: Inter (sans) + JetBrains Mono (mono)
- Animações via lib/motion.ts (Framer Motion)

## Regras de Desenvolvimento
1. SEMPRE usar Context7 antes de implementar código com libs externas
2. NUNCA usar cores hex direto — sempre tokens semânticos
3. NUNCA usar any no TypeScript
4. Server Components por padrão — use client apenas quando necessário
5. Toda tabela precisa de RLS no Supabase
6. Schema.prisma é fonte de verdade para dados
7. Secrets no .env.local — nunca commitar
8. Naming em inglês para código, português para conteúdo do usuário
9. Animações com propósito funcional — nunca decorativas
10. Cada módulo deve ter qualidade de referência mundial

## Context7 Integration
Always use Context7 MCP tools before planning or implementing code that involves external libraries or frameworks:
1. Use resolve-library-id to get the correct library identifier
2. Use get-library-docs to fetch up-to-date documentation
3. Apply the documentation patterns in implementation

## Tabelas Supabase (RLS via get_user_org_id())
- organizations — id, name, slug, mode, logo, plan
- contacts — id, name, email, phone, position, origin, company_id, organization_id
- companies — id, name, cnpj, segment, size, website, organization_id
- pipelines — id, name, organization_id
- pipeline_stages — id, name, order, pipeline_id
- deals — id, title, value, priority, contact_id, company_id, pipeline_id, stage_id, assigned_to_id, loss_reason, closed_at, organization_id
- deal_notes — id, deal_id, content, author_name, author_id
- tasks — id, title, type, status, priority, due_at, completed_at, assigned_to_id, contact_id, deal_id, notes, organization_id
- automations — id, name, description, trigger_type, trigger_config, is_active, execution_count, last_executed_at, organization_id
- automation_steps — id, automation_id, step_order, step_type, step_config
- automation_logs — id, automation_id, status, message, executed_at
- organization_members — id, user_id, organization_id, role, name, email
- loss_reasons — id, name, is_active, organization_id
- task_types — id, name, icon, is_active, organization_id
- custom_fields — id, entity_type, field_name, field_type, field_options, is_required, field_order, is_active, organization_id
- custom_field_values — id, custom_field_id, entity_id, entity_type, value, organization_id, created_at, updated_at
- notification_preferences — id, user_id, organization_id, notify_deal_assigned, notify_deal_stage_changed, notify_task_due, notify_task_overdue, notify_new_contact, notify_deal_won, notify_deal_lost, email_notifications, browser_notifications
- lead_distribution_rules — id, name, description, rule_type, rule_config, is_active, priority, organization_id

## API Routes
- /api/auth/callback — OAuth callback
- /api/organizations — GET, POST
- /api/organizations/current — GET, PUT (plan field included)
- /api/contacts — GET (search, origin filter, pagination), POST (email/phone validation, duplicate detection)
- /api/contacts/[id] — GET, PUT, DELETE
- /api/contacts/import — POST (CSV with company lookup/create)
- /api/companies — GET (search, segment, size filter, pagination), POST (CNPJ validation, website auto-prefix)
- /api/companies/[id] — GET, PUT, DELETE
- /api/deals — GET (pipeline_id, stage_id, assigned_to_id, priority filter), POST
- /api/deals/[id] — GET, PUT, DELETE (joins organization_members for assignee)
- /api/deals/[id]/move — PATCH
- /api/deals/[id]/notes — GET, POST
- /api/pipelines — GET, POST
- /api/pipelines/[id] — PUT, DELETE
- /api/pipelines/[id]/stages — GET, POST
- /api/pipelines/[id]/stages/[stageId] — PUT, DELETE
- /api/pipelines/[id]/stages/reorder — PATCH
- /api/tasks — GET (auto-marks OVERDUE), POST
- /api/tasks/[id] — PUT, DELETE
- /api/team — GET, POST
- /api/team/[id] — PUT, DELETE
- /api/loss-reasons — GET, POST
- /api/loss-reasons/[id] — PUT, DELETE
- /api/task-types — GET, POST
- /api/task-types/[id] — PUT, DELETE
- /api/custom-fields — GET, POST
- /api/custom-fields/[id] — PUT, DELETE
- /api/custom-field-values — GET (entity_id, entity_type), POST (upsert batch)
- /api/notification-preferences — GET, PUT (upsert)
- /api/lead-distribution — GET, POST
- /api/lead-distribution/[id] — PUT, DELETE
- /api/automations — GET, POST
- /api/automations/[id] — PUT, DELETE
- /api/automations/[id]/execute — POST (real step execution)
- /api/automations/[id]/toggle — PATCH
- /api/dashboard — GET (period comparison, 6 metrics with changePercent)
- /api/reports — GET (9 report types including forecast and response-time)
- /api/ranking — GET (period, scope=all|team)
- /api/notifications — GET (automation logs + overdue tasks)
- /api/search — GET (global: deals, contacts, companies)
