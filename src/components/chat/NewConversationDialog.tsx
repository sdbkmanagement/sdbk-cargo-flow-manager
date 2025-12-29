import React, { useState, useEffect } from 'react';
import { Search, Users, User, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { getAvailableUsers, createConversation, Conversation } from '@/services/chatService';
import { toast } from 'sonner';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onConversationCreated: (conv: Conversation) => void;
}

interface AvailableUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  currentUserId,
  onConversationCreated
}) => {
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    } else {
      // Reset state when closing
      setSearchTerm('');
      setSelectedUsers([]);
      setIsGroup(false);
      setGroupName('');
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const availableUsers = await getAvailableUsers(currentUserId);
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getUserName = (user: AvailableUser): string => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  const getInitials = (user: AvailableUser): string => {
    const name = getUserName(user);
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Sélectionnez au moins un participant');
      return;
    }

    if (isGroup && !groupName.trim()) {
      toast.error('Entrez un nom pour le groupe');
      return;
    }

    setIsLoading(true);
    try {
      const conv = await createConversation(
        currentUserId,
        selectedUsers,
        isGroup ? groupName.trim() : undefined,
        isGroup || selectedUsers.length > 1
      );
      onConversationCreated(conv);
      toast.success('Conversation créée');
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      const message =
        typeof error?.message === 'string' && error.message.trim().length > 0
          ? error.message
          : 'Erreur lors de la création';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle groupe */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="is-group">Créer un groupe</Label>
            </div>
            <Switch
              id="is-group"
              checked={isGroup}
              onCheckedChange={setIsGroup}
            />
          </div>

          {/* Nom du groupe */}
          {isGroup && (
            <div>
              <Label htmlFor="group-name">Nom du groupe</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Entrez le nom du groupe..."
                className="mt-1"
              />
            </div>
          )}

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="pl-9"
            />
          </div>

          {/* Sélection affichée */}
          {selectedUsers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedUsers.length} utilisateur(s) sélectionné(s)
            </div>
          )}

          {/* Liste des utilisateurs */}
          <ScrollArea className="h-[250px] border rounded-md">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    className="w-full p-3 hover:bg-accent/50 transition-colors text-left flex items-center gap-3"
                    onClick={() => toggleUser(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {getUserName(user)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading || selectedUsers.length === 0}
            >
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
