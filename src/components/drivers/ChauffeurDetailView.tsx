
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, Mail, MapPin, Calendar, FileText, Car, Clock, UserCheck } from 'lucide-react';
import { ChauffeurStatutManager } from './ChauffeurStatutManager';
import { ChauffeurDocumentManager } from './ChauffeurDocumentManagerSimple';
import { useQuery } from '@tanstack/react-query';
import { chauffeursService } from '@/services/chauffeurs';

interface ChauffeurDetailViewProps {
  chauffeur: any;
}

export const ChauffeurDetailView = ({ chauffeur: initialChauffeur }: ChauffeurDetailViewProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Récupérer les données actualisées du chauffeur
  const { data: chauffeur = initialChauffeur } = useQuery({
    queryKey: ['chauffeur', initialChauffeur.id, refreshKey],
    queryFn: async () => {
      const chauffeurs = await chauffeursService.getAll();
      return chauffeurs.find(c => c.id === initialChauffeur.id) || initialChauffeur;
    },
    initialData: initialChauffeur
  });

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatutBadge = (statut: string) => {
    const statusConfig = {
      'actif': { label: 'Actif', color: 'bg-green-500' },
      'inactif': { label: 'Inactif', color: 'bg-red-500' },
      'conge': { label: 'En congé', color: 'bg-blue-500' },
      'maladie': { label: 'Maladie', color: 'bg-orange-500' },
      'suspendu': { label: 'Suspendu', color: 'bg-gray-500' }
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || { label: statut, color: 'bg-gray-400' };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  // Calculer l'ancienneté
  const calculateAnciennete = (dateEmbauche: string) => {
    if (!dateEmbauche) return 'Non définie';
    
    const today = new Date();
    const embauche = new Date(dateEmbauche);
    const diffTime = today.getTime() - embauche.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` et ${months} mois` : ''}`;
    } else if (months > 0) {
      return `${months} mois`;
    } else {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec photo et informations principales */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {chauffeur.photo_url ? (
                <img 
                  src={chauffeur.photo_url} 
                  alt={`${chauffeur.prenom} ${chauffeur.nom}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {chauffeur.prenom} {chauffeur.nom}
                </h2>
                {getStatutBadge(chauffeur.statut)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {chauffeur.telephone}
                </div>
                {chauffeur.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {chauffeur.email}
                  </div>
                )}
                {chauffeur.vehicule_assigne && (
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Véhicule: {chauffeur.vehicule_assigne}
                  </div>
                )}
                {chauffeur.date_embauche && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Embauché le: {new Date(chauffeur.date_embauche).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets avec détails */}
      <Tabs defaultValue="infos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="statut">Statut</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="permis">Permis</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chauffeur.date_naissance && (
                  <div>
                    <span className="font-medium">Date de naissance:</span>
                    <span className="ml-2">{new Date(chauffeur.date_naissance).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {chauffeur.lieu_naissance && (
                  <div>
                    <span className="font-medium">Lieu de naissance:</span>
                    <span className="ml-2">{chauffeur.lieu_naissance}</span>
                  </div>
                )}
                {chauffeur.age && (
                  <div>
                    <span className="font-medium">Âge:</span>
                    <span className="ml-2">{chauffeur.age} ans</span>
                  </div>
                )}
                {chauffeur.groupe_sanguin && (
                  <div>
                    <span className="font-medium">Groupe sanguin:</span>
                    <span className="ml-2">{chauffeur.groupe_sanguin}</span>
                  </div>
                )}
                {chauffeur.statut_matrimonial && (
                  <div>
                    <span className="font-medium">Statut matrimonial:</span>
                    <span className="ml-2">{chauffeur.statut_matrimonial}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chauffeur.adresse && (
                  <div>
                    <span className="font-medium">Adresse:</span>
                    <p className="ml-2 text-sm">{chauffeur.adresse}</p>
                  </div>
                )}
                {chauffeur.ville && (
                  <div>
                    <span className="font-medium">Ville:</span>
                    <span className="ml-2">{chauffeur.ville}</span>
                  </div>
                )}
                {chauffeur.code_postal && (
                  <div>
                    <span className="font-medium">Code postal:</span>
                    <span className="ml-2">{chauffeur.code_postal}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Informations professionnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chauffeur.matricule && (
                  <div>
                    <span className="font-medium">Matricule:</span>
                    <span className="ml-2">{chauffeur.matricule}</span>
                  </div>
                )}
                {chauffeur.fonction && (
                  <div>
                    <span className="font-medium">Fonction:</span>
                    <span className="ml-2">{chauffeur.fonction}</span>
                  </div>
                )}
                {chauffeur.base_chauffeur && (
                  <div>
                    <span className="font-medium">Base:</span>
                    <span className="ml-2">{chauffeur.base_chauffeur}</span>
                  </div>
                )}
                {chauffeur.type_contrat && (
                  <div>
                    <span className="font-medium">Type de contrat:</span>
                    <span className="ml-2">{chauffeur.type_contrat}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Dates importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chauffeur.date_embauche && (
                  <div>
                    <span className="font-medium">Date d'embauche:</span>
                    <span className="ml-2">{new Date(chauffeur.date_embauche).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {chauffeur.date_embauche && (
                  <div>
                    <span className="font-medium">Ancienneté:</span>
                    <span className="ml-2 text-blue-600 font-medium">{calculateAnciennete(chauffeur.date_embauche)}</span>
                  </div>
                )}
                {chauffeur.date_obtention_permis && (
                  <div>
                    <span className="font-medium">Permis obtenu le:</span>
                    <span className="ml-2">{new Date(chauffeur.date_obtention_permis).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Créé le:</span>
                  <span className="ml-2">{new Date(chauffeur.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statut">
          <ChauffeurStatutManager chauffeur={chauffeur} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="documents">
          <ChauffeurDocumentManager chauffeur={chauffeur} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="permis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informations sur le permis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Numéro de permis:</span>
                  <span className="ml-2">{chauffeur.numero_permis}</span>
                </div>
                <div>
                  <span className="font-medium">Types de permis:</span>
                  <div className="ml-2 flex gap-2 mt-1">
                    {chauffeur.type_permis?.map((type: string, index: number) => (
                      <Badge key={index} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Date d'expiration:</span>
                  <span className="ml-2">{new Date(chauffeur.date_expiration_permis).toLocaleDateString('fr-FR')}</span>
                </div>
                {chauffeur.date_obtention_permis && (
                  <div>
                    <span className="font-medium">Date d'obtention:</span>
                    <span className="ml-2">{new Date(chauffeur.date_obtention_permis).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
