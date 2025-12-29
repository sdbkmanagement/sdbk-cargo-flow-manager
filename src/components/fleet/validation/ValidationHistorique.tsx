
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, Calendar, User, MessageSquare, ArrowRight } from 'lucide-react';
import { validationService } from '@/services/validation';
import type { Database } from '@/integrations/supabase/types';

type ValidationHistorique = Database['public']['Tables']['validation_historique']['Row'];

interface ValidationHistoriqueProps {
  workflowId: string;
}

const ETAPE_LABELS = {
  maintenance: 'Maintenance',
  administratif: 'Administratif', 
  hseq: 'HSEQ',
  obc: 'OBC (Opérations)'
};

export const ValidationHistorique = ({ workflowId }: ValidationHistoriqueProps) => {
  const [historique, setHistorique] = useState<ValidationHistorique[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistorique = async () => {
    try {
      setLoading(true);
      const data = await validationService.getHistorique(workflowId);
      setHistorique(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workflowId) {
      loadHistorique();
    }
  }, [workflowId]);

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case 'rejete':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const formatDateHeure = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={loadHistorique}>
          <History className="w-4 h-4 mr-2" />
          Historique ({historique.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[700px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique complet des validations
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement de l'historique...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {historique.length === 0 ? (
              <p className="text-gray-500 text-center p-6">Aucun historique disponible</p>
            ) : (
              <div className="space-y-3">
                {historique.map((entry) => (
                  <Card key={entry.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-lg">
                            {ETAPE_LABELS[entry.etape as keyof typeof ETAPE_LABELS] || entry.etape}
                          </h4>
                          <div className="flex items-center gap-2">
                            {entry.ancien_statut && getStatutBadge(entry.ancien_statut)}
                            {entry.ancien_statut && entry.nouveau_statut && (
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            )}
                            {getStatutBadge(entry.nouveau_statut)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDateHeure(entry.created_at)}
                        </div>
                      </div>
                      
                      {entry.commentaire && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 mt-0.5 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {entry.commentaire}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {entry.validateur_nom && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          <User className="w-3 h-3" />
                          <span>Modifié par {entry.validateur_nom}</span>
                          {entry.validateur_role && (
                            <span className="text-gray-400">({entry.validateur_role})</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
