-- Migration 8: Add question_ids column to assignments table for tracking question bank usage
alter table assignments add column if not exists question_ids jsonb default '[]'::jsonb;
