-- Phase 0 : extensions et types de base (CDC §5.2).
-- Les tables métier arrivent en phase 3.

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.workspace_kind as enum ('personal','club','company','association','brand');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.member_role as enum ('owner','admin','designer','reviewer','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('pending','processing','completed','failed','cancelled');
exception when duplicate_object then null; end $$;
