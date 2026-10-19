-- Этап 3: когда владелец последний раз обновлял занятость объекта.
-- Нужно для правила «больше 7 дней без обновления → Уточняйте наличие».
-- security_invoker: работают RLS-политики availability (видны только опубликованные).
create view public.place_availability_updates
with (security_invoker = true) as
select place_id, max(updated_at) as last_updated_at
from public.availability
group by place_id;

grant select on public.place_availability_updates to anon, authenticated;
