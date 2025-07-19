
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Car,
  Edit,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { ChauffeurDocumentManager } from './ChauffeurDocumentManager';

interface ChauffeurDetailDialogProps {
  chauffeur: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChauffeurDetailDialog = ({ 
  chauffeur, 
  open, 
  onOpenChange 
}: ChauffeurDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!chauffeur) return null;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactif':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'suspendu':
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const calculateAge = (dateNaissance: string) => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateAnciennete = (dateEmbauche: string) => {
    if (!dateEmbauche) return null;
    const today = new Date();
    const hireDate = new Date(dateEmbauche);
    const diffTime = Math.abs(today.getTime() - hireDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-6 h-6" />
            {chauffeur.prenom} {chauffeur.nom}
            {getStatutBadge(chauffeur.statut)}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="permis">Permis</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="contrat">Contrat</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations personnelles</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Nom:</span>
                    <span>{chauffeur.prenom} {chauffeur.nom}</span>
                  </div>
                  
                  {chauffeur.date_naissance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Âge:</span>
                      <span>{calculateAge(chauffeur.date_naissance)} ans</span>
                    </div>
                  )}

                  {chauffeur.nationalite && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Nationalité:</span>
                      <span>{chauffeur.nationalite}</span>
                    </div>
                  )}

                  {chauffeur.lieu_naissance && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Lieu de naissance:</span>
                      <span>{chauffeur.lieu_naissance}</span>
                    </div>
                  )}

                  {chauffeur.groupe_sanguin && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Groupe sanguin:</span>
                      <span>{chauffeur.groupe_sanguin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Téléphone:</span>
                    <span>{chauffeur.telephone}</span>
                  </div>
                  
                  {chauffeur.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span>{chauffeur.email}</span>
                    </div>
                  )}
                  
                  {chauffeur.adresse && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <span className="font-medium">Adresse:</span>
                        <p className="text-sm">{chauffeur.adresse}</p>
                        {chauffeur.ville && chauffeur.code_postal && (
                          <p className="text-sm">{chauffeur.code_postal} {chauffeur.ville}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations professionnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations professionnelles</h3>
                <div className="space-y-3">
                  {chauffeur.matricule && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Matricule:</span>
                      <span>{chauffeur.matricule}</span>
                    </div>
                  )}

                  {chauffeur.date_embauche && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Date d'embauche:</span>
                      <span>{new Date(chauffeur.date_embauche).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}

                  {chauffeur.date_embauche && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Ancienneté:</span>
                      <span>{calculateAnciennete(chauffeur.date_embauche)} ans</span>
                    </div>
                  )}

                  {chauffeur.type_contrat && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Type de contrat:</span>
                      <Badge variant="outline">{chauffeur.type_contrat}</Badge>
                    </div>
                  )}

                  {chauffeur.fonction && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Fonction:</span>
                      <span>{chauffeur.fonction}</span>
                    </div>
                  )}

                  {chauffeur.base_chauffeur && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Base:</span>
                      <span>{chauffeur.base_chauffeur}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact d'urgence */}
              {(chauffeur.urgence_nom || chauffeur.urgence_prenom || chauffeur.urgence_telephone) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Contact d'urgence
                  </h3>
                  <div className="space-y-3">
                    {(chauffeur.urgence_nom || chauffeur.urgence_prenom) && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Nom:</span>
                        <span>{chauffeur.urgence_prenom} {chauffeur.urgence_nom}</span>
                      </div>
                    )}
                    
                    {chauffeur.urgence_telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Téléphone:</span>
                        <span>{chauffeur.urgence_telephone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="permis" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informations sur le permis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Numéro de permis:</span>
                    <span>{chauffeur.numero_permis}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Types de permis:</span>
                    <div className="flex gap-1">
                      {chauffeur.type_permis?.map((type: string, index: number) => (
                        <Badge key={index} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {chauffeur.date_obtention_permis && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Date d'obtention:</span>
                      <span>{new Date(chauffeur.date_obtention_permis).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Date d'expiration:</span>
                    <span>{new Date(chauffeur.date_expiration_permis).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <ChauffeurDocumentManager 
              chauffeur={chauffeur} 
              onUpdate={() => {
                // Callback pour rafraîchir les données si nécessaire
              }}
            />
          </TabsContent>

          <TabsContent value="contrat" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contrat de travail
              </h3>
              
              {chauffeur.contrat_url ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Contrat signé</p>
                      <p className="text-sm text-gray-500">Document téléchargé</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(chauffeur.contrat_url, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir le contrat
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Aucun contrat téléchargé</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
