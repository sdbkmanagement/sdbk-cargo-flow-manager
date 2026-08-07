
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  GraduationCap,
  Clock,
  User
} from 'lucide-react';
import { EmployeForm } from './EmployeForm';

interface EmployeDetailDialogProps {
  employe: any;
  onClose: () => void;
  onRefresh: () => void;
}

export const EmployeDetailDialog = ({ employe, onClose, onRefresh }: EmployeDetailDialogProps) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-500';
      case 'inactif': return 'bg-gray-500';
      case 'en_arret': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'actif': return 'Actif';
      case 'inactif': return 'Inactif';
      case 'en_arret': return 'En arrêt';
      default: return statut;
    }
  };

  return (
    <>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Fiche Personnel</DialogTitle>
            <Button size="sm" variant="outline" onClick={() => setShowEditForm(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec photo et infos principales */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={employe.photo_url} />
                  <AvatarFallback className="text-2xl">
                    {employe.nom[0]}{employe.prenom[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">{employe.nom} {employe.prenom}</h2>
                    <Badge className={`${getStatutColor(employe.statut)} text-white`}>
                      {getStatutLabel(employe.statut)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Poste</p>
                      <p className="font-medium">{employe.poste}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Service</p>
                      <p className="font-medium">{employe.service}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type de contrat</p>
                      <p className="font-medium">{employe.type_contrat}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date d'embauche</p>
                      <p className="font-medium">
                        {new Date(employe.date_embauche).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    {employe.telephone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>{employe.telephone}</span>
                      </div>
                    )}
                    {employe.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{employe.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets pour les détails */}
          <Tabs defaultValue="informations" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="informations"><User className="w-4 h-4 mr-2" />Informations</TabsTrigger>
              <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-2" />Documents</TabsTrigger>
              <TabsTrigger value="absences"><Calendar className="w-4 h-4 mr-2" />Absences</TabsTrigger>
              <TabsTrigger value="performance"><Clock className="w-4 h-4 mr-2" />Performance</TabsTrigger>
              <TabsTrigger value="competences">Compétences</TabsTrigger>
              <TabsTrigger value="formations"><GraduationCap className="w-4 h-4 mr-2" />Formations</TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations administratives & contractuelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { l: 'Matricule', v: employe.matricule },
                      { l: 'Département', v: employe.departement },
                      { l: 'Site / Lieu de travail', v: employe.site },
                      { l: 'Responsable hiérarchique', v: employe.responsable_hierarchique },
                      { l: 'Société', v: employe.societe },
                      { l: 'Situation familiale', v: employe.situation_familiale },
                      { l: 'Nombre d’enfants', v: employe.nombre_enfants },
                      { l: 'Date de naissance', v: employe.date_naissance ? new Date(employe.date_naissance).toLocaleDateString('fr-FR') : null },
                      { l: 'N° CNSS', v: employe.numero_cnss },
                      { l: 'Date d’embauche', v: employe.date_embauche ? new Date(employe.date_embauche).toLocaleDateString('fr-FR') : null },
                      { l: 'Fin période d’essai', v: employe.date_fin_essai ? new Date(employe.date_fin_essai).toLocaleDateString('fr-FR') : null },
                      { l: 'Fin de contrat', v: employe.date_fin_contrat ? new Date(employe.date_fin_contrat).toLocaleDateString('fr-FR') : null },
                      { l: 'Salaire de base', v: employe.salaire_base ? `${Number(employe.salaire_base).toLocaleString('fr-FR')} GNF` : null },
                    ].map((f) => (
                      <div key={f.l}>
                        <p className="text-muted-foreground">{f.l}</p>
                        <p className="font-medium">{f.v ?? '—'}</p>
                      </div>
                    ))}
                  </div>

                  {employe.remarques && (
                    <div>
                      <p className="text-sm text-muted-foreground">Remarques</p>
                      <p className="text-sm">{employe.remarques}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsRHList employeId={employe.id} compact />
            </TabsContent>

            <TabsContent value="absences">
              <EmployeAbsences employeId={employe.id} />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceModule employeId={employe.id} />
            </TabsContent>

            <TabsContent value="competences">
              <CompetencesModule employeId={employe.id} />
            </TabsContent>

            <TabsContent value="formations">
              <FormationRHModule employeId={employe.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

    {showEditForm && (
      <EmployeForm
        employe={employe}
        onClose={() => setShowEditForm(false)}
        onSuccess={() => {
          setShowEditForm(false);
          onRefresh();
          onClose();
        }}
      />
    )}
    </>
  );
};
