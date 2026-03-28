-- Migration: Add metadata columns to visitor_logs
-- Run in Supabase SQL Editor

ALTER TABLE visitor_logs
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser     text,
  ADD COLUMN IF NOT EXISTS country     text,
  ADD COLUMN IF NOT EXISTS page_path   text,
  ADD COLUMN IF NOT EXISTS referrer    text;
