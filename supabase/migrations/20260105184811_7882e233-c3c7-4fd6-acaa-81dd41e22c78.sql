-- Fonction SECURITY DEFINER pour vérifier si l'utilisateur est le créateur de la conversation
CREATE OR REPLACE FUNCTION public.is_conversation_creator(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND c.created_by = _user_id
  );
$$;

-- Remplacer la policy INSERT pour éviter la dépendance RLS sur public.conversations
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.is_admin()
    OR public.is_conversation_creator(conversation_id, auth.uid())
  )
);
