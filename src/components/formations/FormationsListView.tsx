import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, CheckCircle, AlertTriangle, XCircle, Plus, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formationsService, Formation } from '@/services/formationsService';
import { chauffeursService } from '@/services/chauffeurs';
import { FormationFormDialog } from './FormationFormDialog';
import { BulkFormationDialog } from './BulkFormationDialog';
import { toast } from '@/hooks/use-toast';

const statutConfig = {
  valide: { label: 'Valide', icon: CheckCircle, className: 'text-green-600' },
  a_renouveler: { label: 'À renouveler', icon: AlertTriangle, className: 'text-orange-500' },
  expire: { label: 'Expiré', icon: XCircle, className: 'text-red-500' },
};

export const FormationsListView = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editFormation, setEditFormation] = useState<any>(null);
  const [preselectedChauffeur, setPreselectedChauffeur] = useState<string>('');
  const [preselectedTheme, setPreselectedTheme] = useState<string>('');
  const [bulkChauffeur, setBulkChauffeur] = useState<any>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const { data: chauffeurs = [], isLoading: loadingChauffeurs } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  const { data: themes = [], isLoading: loadingThemes } = useQuery({
    queryKey: ['themes-formation'],
    queryFn: formationsService.getThemes,
  });

  const { data: formations = [], isLoading: loadingFormations } = useQuery({
    queryKey: ['formations'],
    queryFn: formationsService.getAll,
  });

  const isLoading = loadingChauffeurs || loadingThemes || loadingFormations;

  // Build a map: chauffeur_id -> theme_id -> formation
  const formationMap = new Map<string, Map<string, Formation>>();
  formations.forEach(f => {
    if (!formationMap.has(f.chauffeur_id)) {
      formationMap.set(f.chauffeur_id, new Map());
    }
    formationMap.get(f.chauffeur_id)!.set(f.theme_id, f);
  });

  const searchLower = search.toLowerCase();
  const filteredChauffeurs = chauffeurs.filter(c => {
    if (!search) return true;
    return (
      c.nom?.toLowerCase().includes(searchLower) ||
      c.prenom?.toLowerCase().includes(searchLower) ||
      c.matricule?.toLowerCase().includes(searchLower)
    );
  });

  const handleCellClick = (chauffeurId: string, themeId: string) => {
    const existing = formationMap.get(chauffeurId)?.get(themeId);
    if (existing) {
      setEditFormation(existing);
      setPreselectedChauffeur('');
      setPreselectedTheme('');
      setShowForm(true);
    } else {
      // Open bulk dialog for this chauffeur instead of single theme
      const chauffeur = chauffeurs.find(c => c.id === chauffeurId);
      if (chauffeur) {
        setBulkChauffeur(chauffeur);
        setShowBulkDialog(true);
      }
    }
  };

  const handleBulkClick = (chauffeur: any) => {
    setBulkChauffeur(chauffeur);
    setShowBulkDialog(true);
  };

  const getStatutIcon = (statut: string) => {
    const config = statutConfig[statut as keyof typeof statutConfig];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.className}`} />;
  };

  const getChauffeurConformite = (chauffeurId: string) => {
    const themesObligatoires = themes.filter(t => t.obligatoire);
    if (themesObligatoires.length === 0) return 100;
    const chauffeurFormations = formationMap.get(chauffeurId);
    let conformes = 0;
    themesObligatoires.forEach(theme => {
      const f = chauffeurFormations?.get(theme.id);
      if (f && f.statut === 'valide') conformes++;
    });
    return Math.round((conformes / themesObligatoires.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Suivi Recyclage par chauffeur</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur un chauffeur pour enregistrer ses formations (même formateur et date pour tous les thèmes)
            </p>
          </div>
          <Button onClick={() => { setEditFormation(null); setPreselectedChauffeur(''); setPreselectedTheme(''); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Saisie individuelle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un chauffeur par nom, prénom ou matricule..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Chargement...</p>
        ) : themes.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucun thème de formation défini. Créez des thèmes dans l'onglet "Thèmes".
          </p>
        ) : filteredChauffeurs.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Aucun chauffeur trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium sticky left-0 bg-muted/30 min-w-[200px]">Chauffeur</th>
                  {themes.map(theme => (
                    <th key={theme.id} className="text-center p-3 font-medium min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs">{theme.nom}</span>
                        {theme.obligatoire && (
                          <Badge variant="outline" className="text-[10px] px-1">Obligatoire</Badge>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium min-w-[100px]">Conformité</th>
                  <th className="text-center p-3 font-medium min-w-[80px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredChauffeurs.map(chauffeur => {
                  const conformite = getChauffeurConformite(chauffeur.id);
                  const conformiteColor = conformite === 100
                    ? 'text-green-600 bg-green-50'
                    : conformite >= 50
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-red-600 bg-red-50';

                  return (
                    <tr key={chauffeur.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 sticky left-0 bg-background">
                        <div>
                          <p className="font-medium">{chauffeur.prenom} {chauffeur.nom}</p>
                          <div className="flex items-center gap-2">
                            {chauffeur.matricule && (
                              <span className="text-xs text-muted-foreground">{chauffeur.matricule}</span>
                            )}
                            {chauffeur.statut && (
                              <Badge variant="outline" className="text-[10px]">{chauffeur.statut}</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      {themes.map(theme => {
                        const formation = formationMap.get(chauffeur.id)?.get(theme.id);
                        const hasFormation = !!formation;
                        const statut = formation?.statut || '';

                        return (
                          <td key={theme.id} className="p-3 text-center">
                            <button
                              onClick={() => handleCellClick(chauffeur.id, theme.id)}
                              className="flex flex-col items-center gap-1 w-full cursor-pointer hover:bg-muted/50 rounded p-1 transition-colors"
                            >
                              {hasFormation ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Checkbox checked={true} className="pointer-events-none" />
                                    {getStatutIcon(statut)}
                                  </div>
                                  <span className={`text-[10px] ${statutConfig[statut as keyof typeof statutConfig]?.className || ''}`}>
                                    {statutConfig[statut as keyof typeof statutConfig]?.label || statut}
                                  </span>
                                  {formation.date_formation && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(formation.date_formation).toLocaleDateString('fr-FR')}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-70 transition-opacity">
                                  <Checkbox checked={false} className="pointer-events-none" />
                                  <span className="text-[10px] text-muted-foreground">Non effectuée</span>
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <Badge className={`${conformiteColor} border-0`}>
                          {conformite}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkClick(chauffeur)}
                          title="Enregistrer plusieurs formations"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <FormationFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        formation={editFormation}
        preselectedChauffeurId={preselectedChauffeur}
        preselectedThemeId={preselectedTheme}
      />

      <BulkFormationDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        chauffeur={bulkChauffeur}
        themes={themes}
        existingFormations={formationMap.get(bulkChauffeur?.id) || new Map()}
      />
    </Card>
  );
};
