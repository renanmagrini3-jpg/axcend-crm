-- ============================================
-- Fix: encoding dos seeds da migration 006
-- Corrige nomes com caracteres especiais quebrados.
-- Safe para re-rodar: só atualiza linhas que ainda estão incorretas.
-- ============================================

UPDATE task_types
SET name = 'Ligação'
WHERE name LIKE 'Liga%' AND name <> 'Ligação';

UPDATE task_types
SET name = 'Reunião'
WHERE name LIKE 'Reuni%' AND name <> 'Reunião';

UPDATE loss_reasons
SET name = 'Concorrência'
WHERE name LIKE 'Concorr%' AND name <> 'Concorrência';

UPDATE loss_reasons
SET name = 'Preço'
WHERE name LIKE 'Pre%o' AND name <> 'Preço';
