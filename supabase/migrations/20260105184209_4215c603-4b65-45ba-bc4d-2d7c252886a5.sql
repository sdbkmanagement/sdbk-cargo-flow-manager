-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can view other participants in same conversation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON public.conversation_participants;

-- Recréer les politiques sans récursion en utilisant la fonction security definer existante

-- Politique SELECT: voir ses propres participations ou celles des conversations où on est membre
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_conversation_member(conversation_id, auth.uid())
);

-- Politique INSERT: ajouter des participants si on est le créateur de la conversation
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id 
    AND c.created_by = auth.uid()
  )
);