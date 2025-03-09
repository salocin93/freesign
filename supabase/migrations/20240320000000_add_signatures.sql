create table public.signatures (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  signature text not null,
  signed_at timestamp with time zone not null,
  agreed_to_terms boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.signatures enable row level security;

create policy "Users can view signatures for documents they have access to"
  on public.signatures for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = signatures.document_id
      and (
        d.user_id = auth.uid() or
        exists (
          select 1 from public.recipients r
          where r.document_id = d.id
          and r.email = auth.jwt()->>'email'
        )
      )
    )
  );

create policy "Users can create signatures for documents they have access to"
  on public.signatures for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id
      and (
        d.user_id = auth.uid() or
        exists (
          select 1 from public.recipients r
          where r.document_id = d.id
          and r.email = auth.jwt()->>'email'
        )
      )
    )
  );

-- Add function to update updated_at timestamp
create trigger handle_updated_at before update on public.signatures
  for each row execute procedure moddatetime (updated_at); 