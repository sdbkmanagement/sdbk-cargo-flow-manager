-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON public.conversation_participants;

-- Créer une nouvelle politique sans récursion pour les participants
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view other participants in same conversation"
ON public.conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Ajouter une politique de lecture sur la table users pour le chat
CREATE POLICY "Users can view other users for chat"
ON public.users FOR SELECT
USING (auth.uid() IS NOT NULL);