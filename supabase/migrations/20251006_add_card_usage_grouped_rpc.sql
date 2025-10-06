-- RPC to return grouped card usage summary by date and uid
-- Returns: array of records { date date, uids jsonb }

create or replace function public.rpc_card_usage_grouped(
  start_ts timestamptz default null,
  end_ts timestamptz default null,
  search_uid text default null,
  search_exact boolean default false
)
returns table(date date, uids jsonb)
language sql stable as $$
with filtered as (
  select * from card_usage_logs
  where ($1 is null or timestamp >= $1)
    and ($2 is null or timestamp <= $2)
    and (
      $3 is null
      or ($4 and card_usage_logs.card_uid = $3)
      or (not $4 and card_usage_logs.card_uid ilike ('%' || $3 || '%'))
    )
)
select
  date(timestamp) as date,
  jsonb_agg(jsonb_build_object(
    'card_uid', card_uid,
    'total_add', sum(case when action_type = 'balance_add' then points_amount else 0 end),
    'total_deduct', sum(case when action_type = 'balance_deduct' then points_amount else 0 end),
    'net_change', sum(case when action_type = 'balance_add' then points_amount else 0 end) - sum(case when action_type = 'balance_deduct' then points_amount else 0 end),
    'events', jsonb_agg(jsonb_build_object('id', id, 'timestamp', timestamp, 'action_type', action_type, 'points_amount', points_amount, 'balance_before', balance_before, 'balance_after', balance_after, 'notes', notes) order by timestamp desc)
  ) order by sum(case when action_type = 'balance_add' then points_amount else 0 end) - sum(case when action_type = 'balance_deduct' then points_amount else 0 end) desc) as uids
from filtered
group by date
order by date desc;
$$;

-- index to help performance
create index if not exists idx_card_usage_logs_timestamp on card_usage_logs (timestamp);
