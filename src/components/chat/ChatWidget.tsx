import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getConversations, Conversation } from '@/services/chatService';
import ConversationList from './ConversationList';
import ChatConversation from './ChatConversation';
import NewConversationDialog from './NewConversationDialog';

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [showNewConversation, setShowNewConversation] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    loadConversations();
    return subscribeToMessages();
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;
    try {
      const convs = await getConversations(user.id);
      setConversations(convs);
      setTotalUnread(convs.reduce((sum, c) => sum + (c.unread_count || 0), 0));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    loadConversations();
  };

  const handleNewConversation = (conv: Conversation) => {
    setShowNewConversation(false);
    setConversations(prev => [conv, ...prev]);
    setSelectedConversation(conv);
  };

  if (!user) return null;

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      )}

      {/* Widget de chat */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 bg-background border rounded-lg shadow-xl z-50 flex flex-col transition-all duration-200 ${
            isMinimized ? 'h-14 w-80' : 'h-[500px] w-96'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Messagerie</span>
              {totalUnread > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalUnread}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              {selectedConversation ? (
                <ChatConversation
                  conversation={selectedConversation}
                  currentUserId={user.id}
                  onBack={handleBack}
                />
              ) : (
                <ConversationList
                  conversations={conversations}
                  currentUserId={user.id}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={() => setShowNewConversation(true)}
                />
              )}
            </div>
          )}
        </div>
      )}

      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        currentUserId={user.id}
        onConversationCreated={handleNewConversation}
      />
    </>
  );
};

export default ChatWidget;
