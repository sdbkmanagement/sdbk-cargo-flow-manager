
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, MapPin, Calendar, Truck, FileText, Edit } from 'lucide-react';
import type { Chauffeur } from '@/types/chauffeur';

interface ChauffeurDetailDialogProps {
  chauffeur: Chauffeur | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (chauffeur: Chauffeur) => void;
}

export const ChauffeurDetailDialog = ({ 
  chauffeur, 
  open, 
  onOpenChange, 
  onEdit 
}: ChauffeurDetailDialogProps) => {
  const { hasRole } = useAuth();

  // Vérifier les permissions d'écriture
  const hasWritePermission = hasRole('transport') || hasRole('admin') || hasRole('direction');

  if (!chauffeur) return null;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Inactif</Badge>;
      case 'suspendu':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {chauffeur.prenom} {chauffeur.nom}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  {getStatutBadge(chauffeur.statut || 'actif')}
                </DialogDescription>
              </div>
            </div>
            {hasWritePermission && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(chauffeur)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations personnelles */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{chauffeur.telephone}</p>
                </div>
              </div>
              {chauffeur.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{chauffeur.email}</p>
                  </div>
                </div>
              )}
              {chauffeur.date_naissance && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date de naissance</p>
                    <p className="font-medium">
                      {new Date(chauffeur.date_naissance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {chauffeur.adresse && (
              <div className="mt-4 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="font-medium">{chauffeur.adresse}</p>
                  {(chauffeur.ville || chauffeur.code_postal) && (
                    <p className="text-sm text-gray-500">
                      {chauffeur.code_postal} {chauffeur.ville}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Informations professionnelles */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations professionnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Numéro de permis</p>
                <p className="font-medium">{chauffeur.numero_permis}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d'expiration du permis</p>
                <p className="font-medium">
                  {new Date(chauffeur.date_expiration_permis).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Types de permis</p>
              <div className="flex flex-wrap gap-2">
                {chauffeur.type_permis?.map((type, index) => (
                  <Badge key={index} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {chauffeur.vehicule_assigne && (
              <div className="mt-4 flex items-center gap-3">
                <Truck className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Véhicule assigné</p>
                  <p className="font-medium">{chauffeur.vehicule_assigne}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
