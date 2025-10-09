-- migration: add occupation column to members and set occupations for Alon
BEGIN;

ALTER TABLE IF EXISTS members
  ADD COLUMN IF NOT EXISTS occupation text[];

-- Set Alon's occupations (update the name match as needed)
UPDATE members
SET occupation = ARRAY['musician','software engineer']
WHERE lower(name) = 'alon' OR name = 'Alon';

COMMIT;
