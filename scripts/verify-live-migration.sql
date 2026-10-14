-- Live verification only: every test write is rolled back.
begin;
do $$
declare a public.sales_entries; b public.sales_entries; c public.sales_entries; retry public.sales_entries;
 k1 uuid:=gen_random_uuid(); k2 uuid:=gen_random_uuid(); k3 uuid:=gen_random_uuid(); n integer; total numeric;
begin
 a:=public.record_sale('Coffee-Based-Varoom Classic',5,k1,'migration-verification');
 b:=public.record_sale('Coffee-Based-Varoom Classic',5,k2,'migration-verification');
 c:=public.record_sale('Coffee-Based-Varoom Classic',3,k3,'migration-verification');
 retry:=public.record_sale('Coffee-Based-Varoom Classic',3,k3,'migration-verification');
 if retry.id<>c.id then raise exception 'Retry duplicated the sale'; end if;
 select sum(quantity),sum(total_amount) into n,total from public.sales_entries where id in(a.id,b.id,c.id);
 if n<>13 or total<>845 then raise exception 'Incorrect additive total'; end if;
 if a.unit_price<>65 or a.saved_at is null then raise exception 'Incorrect price or timestamp'; end if;
 perform public.reverse_sale(a.id,'Rollback-only verification','migration-verification');
 perform public.reverse_sale(a.id,'Rollback-only verification','migration-verification');
 select count(*) into n from public.sales_entry_audit_logs where sales_entry_id in(a.id,b.id,c.id);
 if n<>4 then raise exception 'Incorrect audit count'; end if;
 if has_function_privilege('anon','public.record_sale(text,integer,uuid,text)','EXECUTE') then raise exception 'Public save access'; end if;
 if has_table_privilege('anon','public.sales_entries','INSERT') then raise exception 'Public insert access'; end if;
 insert into public.report_exports(report_type,report_title,file_format,data_source,file_name) values('monthly','Rollback verification','csv','historical_pos','verification.csv');
end $$;
rollback;
select 'Passed: additive totals, retry, database price/timestamp, reversal, audit, export history and anonymous-access restrictions. All test writes rolled back.' as verification;
