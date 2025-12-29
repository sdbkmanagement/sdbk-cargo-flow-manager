import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, Check, CheckCheck, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Conversation, Message, getMessages, sendMessage, markMessagesAsRead } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface ChatConversationProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  conversation,
  currentUserId,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
    subscribeToMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await getMessages(conversation.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await markMessagesAsRead(conversation.id, currentUserId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        () => {
          loadMessages();
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      const msg = await sendMessage(
        conversation.id,
        currentUserId,
        newMessage.trim(),
        attachments.length > 0 ? attachments : undefined
      );
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getConversationName = (): string => {
    if (conversation.is_group && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participants?.find(
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

  const getSenderName = (msg: Message): string => {
    if (msg.sender) {
      const { first_name, last_name, email } = msg.sender;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return email;
    }
    return 'Utilisateur';
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOwnMessage = (msg: Message) => msg.sender_id === currentUserId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-medium text-sm">{getConversationName()}</p>
          {conversation.is_group && (
            <p className="text-xs text-muted-foreground">
              {conversation.participants?.length || 0} participants
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                {!isOwnMessage(msg) && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs bg-muted">
                      {getInitials(getSenderName(msg))}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`rounded-lg p-2 ${
                  isOwnMessage(msg) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {!isOwnMessage(msg) && conversation.is_group && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {getSenderName(msg)}
                    </p>
                  )}
                  
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map(att => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs underline"
                        >
                          <FileIcon className="h-3 w-3" />
                          {att.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-1 mt-1 ${
                    isOwnMessage(msg) ? 'justify-end' : ''
                  }`}>
                    <span className="text-[10px] opacity-60">
                      {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                    </span>
                    {isOwnMessage(msg) && (
                      msg.read_by && msg.read_by.length > 0 ? (
                        <CheckCheck className="h-3 w-3 opacity-60" />
                      ) : (
                        <Check className="h-3 w-3 opacity-60" />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Pièces jointes en attente */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-background rounded px-2 py-1 text-xs">
                <FileIcon className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(index)}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrire un message..."
            className="flex-1 h-9"
            disabled={isSending}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;
