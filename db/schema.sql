-- شغف — database schema (PostgreSQL / Neon)
-- Run once:  npm run db:setup   (applies schema.sql then seed.sql)
-- Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- Categories are fixed in the app (src/data/categories.ts); this table exists for referential integrity.
create table if not exists categories (
  id          text primary key,
  name        text not null,
  description text not null default '',
  image       text not null,
  sort_order  integer not null default 0
);

create table if not exists products (
  id                 text primary key,                 -- URL slug, e.g. pink-rose-bouquet
  name               text not null,
  description        text not null default '',
  price              numeric(10, 2) not null check (price >= 0),
  category           text not null references categories (id),
  image              text not null,                    -- https URL or /api/images/<uuid>
  images             text[] not null default '{}',     -- additional images
  available          boolean not null default true,
  featured           boolean not null default false,
  is_new             boolean not null default false,
  is_category_cover  boolean not null default false,
  flowers_count      integer check (flowers_count >= 0),
  color              text,
  size               text,
  handmade           boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Business rule: at most one cover product per category (the API clears the previous one in the same transaction).
create unique index if not exists products_one_cover_per_category
  on products (category) where is_category_cover;

create index if not exists products_created_at_idx on products (created_at desc);

-- Editable site content (today: hero images). One row per key, e.g. key = 'hero', value = {"main": "...", "detail": "..."}.
create table if not exists site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Uploaded photos (already resized by the browser). Served at /api/images/<id>.
create table if not exists images (
  id         uuid primary key default gen_random_uuid(),
  mime       text not null,
  bytes      bytea not null,
  size       integer not null,
  created_at timestamptz not null default now()
);

-- Keep updated_at fresh on product updates.
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
