
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Eye, Calendar, User } from 'lucide-react';
import { ValidationStatusBadge } from './ValidationStatusBadge';

interface Commentaire {
  id: string;
  statut: string;
  commentaire: string;
  validateur_nom: string;
  validateur_role: string;
  created_at: string;
}

interface EtapeCommentairesProps {
  etapeLabel: string;
  commentaires: Commentaire[];
  dernierCommentaire?: string;
  derniereModification?: {
    validateur_nom: string;
    date: string;
  };
}

export const EtapeCommentaires = ({ 
  etapeLabel, 
  commentaires, 
  dernierCommentaire,
  derniereModification 
}: EtapeCommentairesProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-2">
      {dernierCommentaire && (
        <div className="mb-2 p-2 bg-gray-50 rounded text-sm border">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3 h-3 mt-0.5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 break-words">{dernierCommentaire}</p>
              {derniereModification && (
                <p className="text-xs text-gray-500 mt-1">
                  Par {derniereModification.validateur_nom} • {formatDate(derniereModification.date)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {commentaires.length > 0 && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-1 text-xs text-gray-600 hover:text-gray-800"
            >
              <Eye className="w-3 h-3 mr-1" />
              Historique ({commentaires.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[500px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Historique des commentaires - {etapeLabel}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              {commentaires.length === 0 ? (
                <p className="text-gray-500 text-center p-4">Aucun commentaire disponible</p>
              ) : (
                commentaires.map((commentaire) => (
                  <Card key={commentaire.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <ValidationStatusBadge statut={commentaire.statut as any} size="sm" />
                          <Badge variant="outline" className="text-xs">
                            {commentaire.validateur_role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(commentaire.created_at)}
                        </div>
                      </div>
                      
                      {commentaire.commentaire && (
                        <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-700 break-words">{commentaire.commentaire}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>Modifié par {commentaire.validateur_nom}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
