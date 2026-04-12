-- ============================================
-- Fix: encoding de todos os registros com caracteres quebrados
-- Tabelas: companies, contacts, automations, automation_steps
-- Safe para re-rodar: usa LIKE para achar strings quebradas
-- ============================================

-- ── Companies ──
UPDATE companies SET name = 'Gamma Logística'      WHERE name LIKE 'Gamma Log%stica%'      AND name <> 'Gamma Logística';
UPDATE companies SET name = 'Delta Mídia'           WHERE name LIKE 'Delta M%dia%'           AND name <> 'Delta Mídia';
UPDATE companies SET name = 'Iota Distribuição'     WHERE name LIKE 'Iota Distribui%'        AND name <> 'Iota Distribuição';
UPDATE companies SET segment = 'Logística'          WHERE segment LIKE 'Log%stica%'          AND segment <> 'Logística';
UPDATE companies SET segment = 'Educação'           WHERE segment LIKE 'Educa%'              AND segment IS DISTINCT FROM 'Educação' AND segment LIKE 'Educa__o%';

-- ── Contacts ──
UPDATE contacts SET origin = 'Indicação'            WHERE origin LIKE 'Indica%'              AND origin <> 'Indicação' AND origin LIKE '%indica%';
UPDATE contacts SET origin = 'Orgânico'             WHERE origin LIKE 'Org%nico%'            AND origin <> 'Orgânico';
UPDATE contacts SET position = 'Operações'          WHERE position LIKE 'Opera%es%'          AND position <> 'Operações' AND position LIKE 'Opera%';
UPDATE contacts SET name = REPLACE(name, '�', '')   WHERE name LIKE '%�%';

-- ── Automations ──
UPDATE automations SET name = 'Deal avançou de etapa'
  WHERE name LIKE 'Deal avan%ou%etapa%' AND name <> 'Deal avançou de etapa';

UPDATE automations SET description = 'Notifica a equipe quando um deal muda de etapa no pipeline.'
  WHERE description LIKE '%avan%ou%pr%xima%' AND description <> 'Notifica a equipe quando um deal muda de etapa no pipeline.';

UPDATE automations SET description = 'Notifica o responsável e cria tarefa de cobrança quando uma tarefa fica vencida.'
  WHERE description LIKE '%respons%vel%cobran%a%'
    AND description <> 'Notifica o responsável e cria tarefa de cobrança quando uma tarefa fica vencida.';

UPDATE automations SET description = 'Cria tarefa de follow-up em 24h quando um novo contato é cadastrado.'
  WHERE description LIKE '%follow-up%24h%' AND description LIKE '%cadastr%'
    AND description <> 'Cria tarefa de follow-up em 24h quando um novo contato é cadastrado.';

-- ── Automation Steps ──
UPDATE automation_steps
  SET step_config = jsonb_set(step_config, '{message}', '"Um deal avançou para a próxima etapa do pipeline."')
  WHERE step_config->>'message' LIKE '%avan%ou%pr%xima%'
    AND step_config->>'message' <> 'Um deal avançou para a próxima etapa do pipeline.';

UPDATE automation_steps
  SET step_config = jsonb_set(step_config, '{message}', '"Tarefa vencida requer atenção imediata."')
  WHERE step_config->>'message' LIKE '%aten%o imediata%'
    AND step_config->>'message' <> 'Tarefa vencida requer atenção imediata.';

UPDATE automation_steps
  SET step_config = jsonb_set(step_config, '{title}', '"Cobrar responsável sobre tarefa atrasada"')
  WHERE step_config->>'title' LIKE '%Cobrar respons%vel%'
    AND step_config->>'title' <> 'Cobrar responsável sobre tarefa atrasada';

-- ── Generic fallback: replace common mojibake patterns ──
-- Latin1→UTF8 double encoding fixes for Portuguese
UPDATE companies SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE name ~ 'Ã[£©§³º]';

UPDATE contacts SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE name ~ 'Ã[£©§³º]';

UPDATE contacts SET origin = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(origin,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE origin ~ 'Ã[£©§³º]';

UPDATE contacts SET position = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(position,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE position ~ 'Ã[£©§³º]';

UPDATE companies SET segment = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(segment,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE segment ~ 'Ã[£©§³º]';

UPDATE automations SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE name ~ 'Ã[£©§³º]';

UPDATE automations SET description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(description,
  'Ã£', 'ã'), 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã³', 'ó'), 'Ãº', 'ú')
  WHERE description ~ 'Ã[£©§³º]';
