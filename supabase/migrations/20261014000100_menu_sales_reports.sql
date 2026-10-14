-- Prepared after read-only inspection of the linked spot-garage project.
-- APPROVAL REQUIRED before applying. Existing monthly tables and rows are untouched.
create table public.categories (
 id text primary key, name text not null unique, created_at timestamptz not null default now()
);
create table public.products (
 id text primary key, category_id text not null references public.categories(id),
 name text not null, unit_price numeric(12,2) not null check(unit_price>=0),
 active boolean not null default true, created_at timestamptz not null default now(),
 unique(category_id,name)
);
create table public.sales_entries (
 id uuid primary key default gen_random_uuid(), idempotency_key uuid not null unique,
 product_id text not null references public.products(id), product_name text not null, category_name text not null,
 quantity integer not null check(quantity between 1 and 100000),
 unit_price numeric(12,2) not null check(unit_price>=0),
 total_amount numeric(18,2) generated always as (quantity*unit_price) stored,
 saved_at timestamptz not null default clock_timestamp(),
 status text not null default 'saved' check(status in ('saved','reversed')),
 saved_by text not null, reversed_at timestamptz,
 check((status='saved' and reversed_at is null) or (status='reversed' and reversed_at is not null))
);
create index sales_entries_saved_at_idx on public.sales_entries(saved_at desc,id);
create index sales_entries_product_time_idx on public.sales_entries(product_id,saved_at desc);
create table public.sales_entry_audit_logs (
 id uuid primary key default gen_random_uuid(), sales_entry_id uuid not null references public.sales_entries(id),
 action text not null check(action in ('created','reversed')), reason text,
 actor text not null, created_at timestamptz not null default clock_timestamp(),
 before_record jsonb, after_record jsonb
);
create index sales_audit_entry_idx on public.sales_entry_audit_logs(sales_entry_id,created_at desc);
create table public.report_exports (
 id uuid primary key default gen_random_uuid(), report_type text not null, report_title text not null,
 file_format text not null check(file_format in ('pdf','xlsx','csv')),
 date_from date, date_to date, filters jsonb not null default '{}',
 data_source text not null check(data_source in ('historical_pos','manual_sales','menu')),
 file_name text not null, storage_path text, file_size_bytes bigint check(file_size_bytes>=0),
 status text not null default 'pending' check(status in ('pending','completed','failed')),
 created_at timestamptz not null default clock_timestamp(), completed_at timestamptz, error_message text,
 check(date_to is null or date_from is null or date_to>=date_from)
);
create index report_exports_created_idx on public.report_exports(created_at desc,id);
create index report_exports_type_idx on public.report_exports(report_type,created_at desc);
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.sales_entries enable row level security;
alter table public.sales_entry_audit_logs enable row level security;
alter table public.report_exports enable row level security;
revoke all on public.categories,public.products,public.sales_entries,public.sales_entry_audit_logs,public.report_exports from anon,authenticated;
grant all on public.categories,public.products,public.sales_entries,public.sales_entry_audit_logs,public.report_exports to service_role;

create function public.record_sale(p_product_id text,p_quantity integer,p_idempotency_key uuid,p_actor text)
returns public.sales_entries language plpgsql security invoker set search_path='' as $$
declare p record; e public.sales_entries;
begin
 if p_quantity is null or p_quantity<1 or p_quantity>100000 or p_idempotency_key is null or nullif(trim(p_actor),'') is null then raise exception 'Invalid sale request' using errcode='22023'; end if;
 -- Serialize retries of the same request, including simultaneous submissions.
 perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text,0));
 select * into e from public.sales_entries where idempotency_key=p_idempotency_key;
 if found then
  if e.product_id<>p_product_id or e.quantity<>p_quantity then raise exception 'Idempotency key belongs to another request' using errcode='22023'; end if;
  return e;
 end if;
 select p1.*,c.name category_name into p from public.products p1 join public.categories c on c.id=p1.category_id where p1.id=p_product_id and p1.active for share of p1;
 if not found then raise exception 'Active product not found' using errcode='22023'; end if;
 insert into public.sales_entries(idempotency_key,product_id,product_name,category_name,quantity,unit_price,saved_by)
 values(p_idempotency_key,p.id,p.name,p.category_name,p_quantity,p.unit_price,p_actor) returning * into e;
 insert into public.sales_entry_audit_logs(sales_entry_id,action,actor,after_record) values(e.id,'created',p_actor,to_jsonb(e));
 return e;
end $$;
create function public.reverse_sale(p_entry_id uuid,p_reason text,p_actor text)
returns public.sales_entries language plpgsql security invoker set search_path='' as $$
declare e public.sales_entries; before_e jsonb;
begin
 if length(trim(coalesce(p_reason,'')))<5 or length(p_reason)>500 or nullif(trim(p_actor),'') is null then raise exception 'A reason of 5-500 characters is required' using errcode='22023'; end if;
 select * into e from public.sales_entries where id=p_entry_id for update;
 if not found then raise exception 'Sale not found' using errcode='22023'; end if;
 if e.status='reversed' then return e; end if;
 before_e=to_jsonb(e);
 update public.sales_entries set status='reversed',reversed_at=clock_timestamp() where id=p_entry_id returning * into e;
 insert into public.sales_entry_audit_logs(sales_entry_id,action,actor,reason,before_record,after_record) values(e.id,'reversed',p_actor,p_reason,before_e,to_jsonb(e));
 return e;
end $$;
revoke all on function public.record_sale(text,integer,uuid,text),public.reverse_sale(uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_sale(text,integer,uuid,text),public.reverse_sale(uuid,text,text) to service_role;
