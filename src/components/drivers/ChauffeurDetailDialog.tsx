
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  IdCard, 
  Edit,
  FileText,
  Activity
} from 'lucide-react';
import { ChauffeurForm } from './ChauffeurForm';
import { ChauffeurDocumentManager } from './ChauffeurDocumentManager';
import { ChauffeurStatutManager } from './ChauffeurStatutManager';

interface ChauffeurDetailDialogProps {
  chauffeur: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChauffeurDetailDialog = ({ chauffeur, open, onOpenChange }: ChauffeurDetailDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('infos');

  const handleEditSuccess = () => {
    setIsEditing(false);
    // Le parent gérera le refresh des données
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-500';
      case 'conge': return 'bg-blue-500';
      case 'maladie': return 'bg-red-500';
      case 'suspendu': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getDisponibiliteColor = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'bg-green-500';
      case 'en_conge': return 'bg-blue-500';
      case 'maladie': return 'bg-red-500';
      case 'indisponible': return 'bg-gray-500';
      default: return 'bg-green-500';
    }
  };

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le chauffeur</DialogTitle>
          </DialogHeader>
          <ChauffeurForm
            chauffeur={chauffeur}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={chauffeur.photo_url} />
                <AvatarFallback>
                  {chauffeur.nom?.[0]}{chauffeur.prenom?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  {chauffeur.prenom} {chauffeur.nom}
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className={`${getStatutColor(chauffeur.statut)} text-white`}>
                    {chauffeur.statut}
                  </Badge>
                  <Badge className={`${getDisponibiliteColor(chauffeur.statut_disponibilite || 'disponible')} text-white`}>
                    {chauffeur.statut_disponibilite || 'Disponible'}
                  </Badge>
                  {chauffeur.fonction && (
                    <Badge variant="outline">
                      {chauffeur.fonction.charAt(0).toUpperCase() + chauffeur.fonction.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="infos" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="statut" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Statut
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infos" className="space-y-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {chauffeur.matricule && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Matricule</p>
                      <p>{chauffeur.matricule}</p>
                    </div>
                  )}
                  {chauffeur.id_conducteur && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">ID Conducteur</p>
                      <p>{chauffeur.id_conducteur}</p>
                    </div>
                  )}
                  {chauffeur.date_naissance && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date de naissance</p>
                      <p>{new Date(chauffeur.date_naissance).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  {chauffeur.lieu_naissance && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Lieu de naissance</p>
                      <p>{chauffeur.lieu_naissance}</p>
                    </div>
                  )}
                  {chauffeur.groupe_sanguin && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Groupe sanguin</p>
                      <p>{chauffeur.groupe_sanguin}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {chauffeur.base_chauffeur && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Base</p>
                      <p className="capitalize">{chauffeur.base_chauffeur}</p>
                    </div>
                  )}
                  {chauffeur.date_embauche && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date d'embauche</p>
                      <p>{new Date(chauffeur.date_embauche).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  {chauffeur.statut_matrimonial && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Statut matrimonial</p>
                      <p className="capitalize">{chauffeur.statut_matrimonial}</p>
                    </div>
                  )}
                  {chauffeur.immatricule_cnss && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">CNSS</p>
                      <p>{chauffeur.immatricule_cnss}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{chauffeur.telephone}</span>
                  </div>
                  {chauffeur.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{chauffeur.email}</span>
                    </div>
                  )}
                </div>
                {chauffeur.adresse && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p>{chauffeur.adresse}</p>
                      {(chauffeur.ville || chauffeur.code_postal) && (
                        <p className="text-sm text-gray-500">
                          {chauffeur.ville} {chauffeur.code_postal}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="w-5 h-5" />
                  Permis de conduire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Numéro de permis</p>
                    <p>{chauffeur.numero_permis}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date d'expiration</p>
                    <p>{new Date(chauffeur.date_expiration_permis).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                {chauffeur.type_permis && chauffeur.type_permis.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Types de permis</p>
                    <div className="flex gap-2">
                      {chauffeur.type_permis.map((type: string) => (
                        <Badge key={type} variant="outline">
                          Permis {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statut">
            <ChauffeurStatutManager
              chauffeur={chauffeur}
              onUpdate={() => {
                // Refresh des données - à implémenter
              }}
            />
          </TabsContent>

          <TabsContent value="documents">
            <ChauffeurDocumentManager
              chauffeur={chauffeur}
              onUpdate={() => {
                // Refresh des données - à implémenter
              }}
            />
          </TabsContent>

          <TabsContent value="historique">
            <Card>
              <CardHeader>
                <CardTitle>Historique des activités</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">
                  Fonctionnalité d'historique en cours de développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
