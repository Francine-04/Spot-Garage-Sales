alter table public.sales_entries add column payment_method text check(payment_method in ('Cash','GCash','Maya','Card','GoTyme','MariBank'));
create function public.record_sale(p_product_id text,p_quantity integer,p_idempotency_key uuid,p_actor text,p_payment_method text)
returns public.sales_entries language plpgsql security invoker set search_path='' as $$
declare p record; e public.sales_entries;
begin
 if p_payment_method is null or p_payment_method not in ('Cash','GCash','Maya','Card','GoTyme','MariBank') then raise exception 'Select a valid payment method' using errcode='22023'; end if;
 if p_quantity is null or p_quantity<1 or p_quantity>100000 or p_idempotency_key is null or nullif(trim(p_actor),'') is null then raise exception 'Invalid sale request' using errcode='22023'; end if;
 -- Serialize retries of the same request, including simultaneous submissions.
 perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text,0));
 select * into e from public.sales_entries where idempotency_key=p_idempotency_key;
 if found then
  if e.product_id<>p_product_id or e.quantity<>p_quantity or e.payment_method is distinct from p_payment_method then raise exception 'Idempotency key belongs to another request' using errcode='22023'; end if;
  return e;
 end if;
 select p1.*,c.name category_name into p from public.products p1 join public.categories c on c.id=p1.category_id where p1.id=p_product_id and p1.active for share of p1;
 if not found then raise exception 'Active product not found' using errcode='22023'; end if;
 insert into public.sales_entries(idempotency_key,product_id,product_name,category_name,quantity,unit_price,saved_by,payment_method)
 values(p_idempotency_key,p.id,p.name,p.category_name,p_quantity,p.unit_price,p_actor,p_payment_method) returning * into e;
 insert into public.sales_entry_audit_logs(sales_entry_id,action,actor,after_record) values(e.id,'created',p_actor,to_jsonb(e));
 return e;
end $$;

revoke all on function public.record_sale(text,integer,uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_sale(text,integer,uuid,text,text) to service_role;
