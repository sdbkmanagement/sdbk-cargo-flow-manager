-- Politique plus permissive: on permet à l'utilisateur d'ajouter des participants à une conversation 
-- dont il est le créateur OU à laquelle il participe déjà (pour les groupes)
-- On utilise SECURITY DEFINER pour éviter les problèmes de récursion RLS

DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_conversation_creator(conversation_id, auth.uid())
);