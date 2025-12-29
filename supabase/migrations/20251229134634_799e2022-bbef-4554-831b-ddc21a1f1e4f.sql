-- Fix chat conversation creation errors:
-- 1) Remove recursive RLS policy on conversation_participants
-- 2) Add SECURITY DEFINER helpers to avoid recursion
-- 3) Ensure authenticated role has SELECT privilege on public.users

BEGIN;

-- SECURITY DEFINER helper: list my conversation ids (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conversation_id
  FROM public.conversation_participants
  WHERE user_id = auth.uid();
$$;

-- SECURITY DEFINER helper: check if a user is member of a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  );
$$;

-- Drop the recursive policy (this is the source of "infinite recursion detected")
DROP POLICY IF EXISTS "Users can view other participants in same conversation" ON public.conversation_participants;

-- Re-create a non-recursive version using the SECURITY DEFINER function
CREATE POLICY "Users can view other participants in same conversation"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (SELECT * FROM public.get_my_conversation_ids())
);

-- Tighten conversation creation policy to prevent forging created_by
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Replace overly-permissive insert policy for participants
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants to conversations they created"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
  )
);

-- Ensure authenticated users can read public.users (RLS still applies)
GRANT SELECT ON TABLE public.users TO authenticated;

COMMIT;