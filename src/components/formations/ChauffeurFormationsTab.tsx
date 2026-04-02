import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, AlertTriangle, XCircle, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formationsService } from '@/services/formationsService';
import { FormationFormDialog } from './FormationFormDialog';

interface Props {
  chauffeurId: string;
}

const statutIcons = {
  valide: <CheckCircle className="w-4 h-4 text-green-500" />,
  a_renouveler: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  expire: <XCircle className="w-4 h-4 text-red-500" />,
};

const statutLabels = {
  valide: { label: 'Valide', className: 'bg-green-500 text-white' },
  a_renouveler: { label: 'À renouveler', className: 'bg-orange-500 text-white' },
  expire: { label: 'Expiré', className: 'bg-red-500 text-white' },
};

export const ChauffeurFormationsTab = ({ chauffeurId }: Props) => {
  const [showForm, setShowForm] = useState(false);

  const { data: formations = [] } = useQuery({
    queryKey: ['formations', chauffeurId],
    queryFn: () => formationsService.getByChauffeur(chauffeurId),
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes-formation'],
    queryFn: formationsService.getThemes,
  });

  const { data: conformite } = useQuery({
    queryKey: ['conformite', chauffeurId],
    queryFn: () => formationsService.checkConformite(chauffeurId),
  });

  return (
    <div className="space-y-4">
      {/* Score de conformité */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Score de conformité</h3>
              <p className="text-sm text-muted-foreground">
                {conformite?.conforme
                  ? 'Toutes les formations obligatoires sont à jour'
                  : `${conformite?.formationsManquantes?.length || 0} formation(s) manquante(s) ou expirée(s)`}
              </p>
              {conformite?.formationsManquantes && conformite.formationsManquantes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {conformite.formationsManquantes.map(f => (
                    <Badge key={f} variant="destructive" className="text-xs">{f}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className={`text-4xl font-bold ${
              (conformite?.score ?? 0) >= 80 ? 'text-green-600' :
              (conformite?.score ?? 0) >= 50 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {conformite?.score ?? 0}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des thèmes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Formations & Recyclage
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {themes.map(theme => {
              const formation = formations.find(f => f.theme_id === theme.id);
              const statut = formation?.statut || 'non_defini';

              return (
                <div key={theme.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                  !formation ? 'bg-muted/30' :
                  statut === 'valide' ? 'bg-green-50' :
                  statut === 'a_renouveler' ? 'bg-orange-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-3">
                    {formation ? statutIcons[statut as keyof typeof statutIcons] : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{theme.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        Validité : {theme.duree_validite} mois
                        {theme.obligatoire && ' • Obligatoire'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {formation ? (
                      <>
                        <Badge className={statutLabels[statut as keyof typeof statutLabels]?.className}>
                          {statutLabels[statut as keyof typeof statutLabels]?.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(formation.date_formation).toLocaleDateString('fr-FR')}
                          {formation.date_recyclage && (
                            <> → {new Date(formation.date_recyclage).toLocaleDateString('fr-FR')}</>
                          )}
                        </p>
                      </>
                    ) : (
                      <Badge variant="outline">Non effectuée</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <FormationFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        formation={null}
      />
    </div>
  );
};
