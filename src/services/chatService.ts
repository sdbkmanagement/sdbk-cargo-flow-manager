import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  attachments?: MessageAttachment[];
  read_by?: string[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

// Récupérer les conversations de l'utilisateur
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (partError) throw partError;
  if (!participations || participations.length === 0) return [];

  const conversationIds = participations.map(p => p.conversation_id);

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Récupérer les participants pour chaque conversation
  const conversationsWithDetails = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('conversation_id', conv.id);

      // Récupérer le dernier message
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Compter les messages non lus
      const userParticipation = participants?.find(p => p.user_id === userId);
      let unreadCount = 0;
      if (userParticipation?.last_read_at) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', userParticipation.last_read_at)
          .neq('sender_id', userId);
        unreadCount = count || 0;
      }

      return {
        ...conv,
        participants: participants || [],
        last_message: lastMessages?.[0] || null,
        unread_count: unreadCount
      };
    })
  );

  return conversationsWithDetails;
};

// Récupérer les messages d'une conversation
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users(id, first_name, last_name, email)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Récupérer les pièces jointes
  const messagesWithAttachments = await Promise.all(
    (messages || []).map(async (msg) => {
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', msg.id);

      // Récupérer les confirmations de lecture
      const { data: receipts } = await supabase
        .from('message_read_receipts')
        .select('user_id')
        .eq('message_id', msg.id);

      return {
        ...msg,
        attachments: attachments || [],
        read_by: receipts?.map(r => r.user_id) || []
      };
    })
  );

  return messagesWithAttachments;
};

// Créer une nouvelle conversation
export const createConversation = async (
  userId: string,
  participantIds: string[],
  name?: string,
  isGroup: boolean = false
): Promise<Conversation> => {
  // Vérifier si une conversation 1:1 existe déjà
  if (!isGroup && participantIds.length === 1) {
    const existingConv = await findExistingDirectConversation(userId, participantIds[0]);
    if (existingConv) return existingConv;
  }

  // Récupérer l'ID de l'utilisateur authentifié pour RLS
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    throw new Error('Utilisateur non authentifié');
  }

  // IMPORTANT:
  // Ne pas faire `.select().single()` sur l'INSERT, sinon Postgres applique aussi la RLS de SELECT
  // (et à ce moment-là l'utilisateur n'est pas encore participant) => erreur RLS.
  const conversationId = crypto.randomUUID();

  const { error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      name: isGroup ? (name ?? null) : null,
      is_group: isGroup,
      created_by: authUser.id
    });

  if (error) throw error;

  // Ajouter tous les participants (y compris l'utilisateur actuel)
  const allParticipants = [...new Set([authUser.id, ...participantIds])];
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(
      allParticipants.map((pId) => ({
        conversation_id: conversationId,
        user_id: pId
      }))
    );

  if (partError) throw partError;

  // Maintenant que les participants existent, le SELECT RLS passe.
  const { data: conversation, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!conversation) throw new Error('Conversation créée mais non récupérable');

  return conversation;
};

// Trouver une conversation directe existante
const findExistingDirectConversation = async (
  userId1: string,
  userId2: string
): Promise<Conversation | null> => {
  const { data: user1Convs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId1);

  if (!user1Convs || user1Convs.length === 0) return null;

  const convIds = user1Convs.map(c => c.conversation_id);

  const { data: sharedConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId2)
    .in('conversation_id', convIds);

  if (!sharedConvs || sharedConvs.length === 0) return null;

  // Vérifier si c'est une conversation 1:1 (exactement 2 participants)
  for (const conv of sharedConvs) {
    const { data: convDetails } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conv.conversation_id)
      .eq('is_group', false)
      .single();

    if (convDetails) {
      const { count } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.conversation_id);

      if (count === 2) return convDetails;
    }
  }

  return null;
};

// Envoyer un message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  attachments?: File[]
): Promise<Message> => {
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content
    })
    .select(`
      *,
      sender:users(id, first_name, last_name, email)
    `)
    .single();

  if (error) throw error;

  // Upload des pièces jointes
  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      const fileName = `${message.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      await supabase.from('message_attachments').insert({
        message_id: message.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size
      });
    }
  }

  // Mettre à jour la date de la conversation
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return { ...message, attachments: [], read_by: [] };
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  // Mettre à jour last_read_at du participant
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  // Récupérer les messages non lus
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId);

  if (!unreadMessages || unreadMessages.length === 0) return;

  // Ajouter les confirmations de lecture
  for (const msg of unreadMessages) {
    await supabase
      .from('message_read_receipts')
      .upsert({
        message_id: msg.id,
        user_id: userId
      }, {
        onConflict: 'message_id,user_id'
      });
  }
};

// Récupérer tous les utilisateurs pour créer des conversations
export const getAvailableUsers = async (currentUserId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .neq('id', currentUserId)
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
};
