import React from 'react';
import { Plus, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Conversation } from '@/services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelectConversation,
  onNewConversation
}) => {
  const getConversationName = (conv: Conversation): string => {
    if (conv.is_group && conv.name) {
      return conv.name;
    }
    
    const otherParticipant = conv.participants?.find(
      p => p.user_id !== currentUserId
    );
    
    if (otherParticipant?.user) {
      const { first_name, last_name, email } = otherParticipant.user;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return email;
    }
    
    return 'Conversation';
  };

  const getInitials = (conv: Conversation): string => {
    const name = getConversationName(conv);
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button 
          className="w-full" 
          onClick={onNewConversation}
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">Aucune conversation</p>
            <p className="text-xs mt-1">Créez une nouvelle conversation pour commencer</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map(conv => (
              <button
                key={conv.id}
                className="w-full p-3 hover:bg-accent/50 transition-colors text-left flex items-start gap-3"
                onClick={() => onSelectConversation(conv)}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conv.is_group ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      getInitials(conv)
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {getConversationName(conv)}
                    </span>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), {
                          addSuffix: false,
                          locale: fr
                        })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {conv.last_message?.content || 'Aucun message'}
                    </p>
                    {(conv.unread_count || 0) > 0 && (
                      <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
