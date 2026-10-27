-- Migration 7: Add file_data column to files table for robust internal binary/base64 storage without B-Tree index limit
alter table files add column if not exists file_data text;
