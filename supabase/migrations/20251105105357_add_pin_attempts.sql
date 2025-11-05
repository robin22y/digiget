create table if not exists pin_attempts (
  id bigserial primary key,
  shop_id uuid not null,
  device_hash text,
  ip text,
  created_at timestamptz default now()
);

create index if not exists pin_attempts_shop_time_idx 
  on pin_attempts (shop_id, created_at desc);

