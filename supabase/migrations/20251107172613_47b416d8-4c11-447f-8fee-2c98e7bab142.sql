-- Create or replace a SECURITY DEFINER function to fetch or sync the public.users row
-- with the authenticated user's id. This bypasses RLS safely and avoids leaking data.
create or replace function public.get_or_sync_user_by_auth()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_id uuid := auth.uid();
  v_email text;
  v_first text;
  v_last text;
  v_user public.users;
begin
  if v_auth_id is null then
    raise exception 'No authenticated user';
  end if;

  -- Get email and names from auth.users
  select au.email,
         coalesce(au.raw_user_meta_data->>'first_name','') as first,
         coalesce(au.raw_user_meta_data->>'last_name','')  as last
    into v_email, v_first, v_last
  from auth.users au
  where au.id = v_auth_id;

  if v_email is null then
    raise exception 'Authenticated user not found in auth.users';
  end if;

  -- Try to find existing row by id (already synced)
  select * into v_user from public.users where id = v_auth_id;
  if found then
    return v_user;
  end if;

  -- Try to find existing row by email and sync its id
  select * into v_user from public.users where email = v_email limit 1;
  if found then
    update public.users
       set id = v_auth_id,
           updated_at = now()
     where email = v_email;

    select * into v_user from public.users where id = v_auth_id;
    return v_user;
  end if;

  -- Otherwise create a minimal active profile row
  insert into public.users (id, email, first_name, last_name, status)
  values (v_auth_id, v_email, v_first, v_last, 'active')
  returning * into v_user;

  return v_user;
end;
$$;

-- Allow authenticated users to execute this function
grant execute on function public.get_or_sync_user_by_auth() to authenticated;