import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { exportService } from '@/services/exportService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ExportFactures = () => {
  const [dateDebut, setDateDebut] = useState<Date>();
  const [dateFin, setDateFin] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExportExcel = async () => {
    if (!dateDebut || !dateFin) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner les dates de début et de fin',
        variant: 'destructive'
      });
      return;
    }

    if (dateDebut > dateFin) {
      toast({
        title: 'Erreur',
        description: 'La date de début doit être antérieure à la date de fin',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const dateDebutStr = format(dateDebut, 'yyyy-MM-dd');
      const dateFinStr = format(dateFin, 'yyyy-MM-dd');
      
      await exportService.exportToExcel(dateDebutStr, dateFinStr);
      
      toast({
        title: 'Export réussi',
        description: `Fichier Excel généré pour la période du ${format(dateDebut, 'dd/MM/yyyy')} au ${format(dateFin, 'dd/MM/yyyy')}`,
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le fichier Excel',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!dateDebut || !dateFin) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner les dates de début et de fin',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const dateDebutStr = format(dateDebut, 'yyyy-MM-dd');
      const dateFinStr = format(dateFin, 'yyyy-MM-dd');
      
      await exportService.exportToCSV(dateDebutStr, dateFinStr);
      
      toast({
        title: 'Export réussi',
        description: `Fichier CSV généré pour la période du ${format(dateDebut, 'dd/MM/yyyy')} au ${format(dateFin, 'dd/MM/yyyy')}`,
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le fichier CSV',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setPeriodesRapides = (jours: number) => {
    const fin = new Date();
    const debut = new Date();
    debut.setDate(fin.getDate() - jours);
    setDateDebut(debut);
    setDateFin(fin);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-2">
        <Download className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Export des Factures</h2>
      </div>

      {/* Sélection des dates */}
      <Card>
        <CardHeader>
          <CardTitle>Période d'export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Boutons de période rapide */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPeriodesRapides(7)}
            >
              7 derniers jours
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPeriodesRapides(30)}
            >
              30 derniers jours
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPeriodesRapides(90)}
            >
              3 derniers mois
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const debut = new Date();
                debut.setDate(1); // Premier jour du mois
                const fin = new Date();
                setDateDebut(debut);
                setDateFin(fin);
              }}
            >
              Ce mois
            </Button>
          </div>

          {/* Sélecteurs de dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateDebut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateDebut ? format(dateDebut, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateDebut}
                    onSelect={setDateDebut}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFin ? format(dateFin, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFin}
                    onSelect={setDateFin}
                    disabled={(date) => date > new Date() || (dateDebut && date < dateDebut)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Aperçu de la période */}
          {dateDebut && dateFin && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Période sélectionnée:</strong> du {format(dateDebut, "dd/MM/yyyy")} au {format(dateFin, "dd/MM/yyyy")}
                {' '}({Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1} jours)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Format d'export */}
      <Card>
        <CardHeader>
          <CardTitle>Format d'export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Excel */}
            <div className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Export Excel (.xlsx)</h3>
                  <p className="text-sm text-gray-600">Format recommandé avec mise en forme</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p>✓ Colonnes formatées selon le standard TOTAL</p>
                <p>✓ Calculs automatiques des montants</p>
                <p>✓ Compatible avec Excel et LibreOffice</p>
              </div>
              <Button
                onClick={handleExportExcel}
                disabled={loading || !dateDebut || !dateFin}
                className="w-full mt-3 bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {loading ? 'Export en cours...' : 'Exporter en Excel'}
              </Button>
            </div>

            {/* Export CSV */}
            <div className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Export CSV (.csv)</h3>
                  <p className="text-sm text-gray-600">Format texte universel</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p>✓ Compatible avec tous les logiciels</p>
                <p>✓ Séparateurs adaptés au format français</p>
                <p>✓ Encodage UTF-8 avec BOM</p>
              </div>
              <Button
                onClick={handleExportCSV}
                disabled={loading || !dateDebut || !dateFin}
                variant="outline"
                className="w-full mt-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                {loading ? 'Export en cours...' : 'Exporter en CSV'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations sur le format */}
      <Card>
        <CardHeader>
          <CardTitle>Format des données exportées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded border">
            <h4 className="font-medium mb-2">Colonnes incluses dans l'export:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>• Date Chargement</div>
              <div>• N°Tournée</div>
              <div>• Camions</div>
              <div>• Dépôt</div>
              <div>• BL (Bon de Livraison)</div>
              <div>• Client</div>
              <div>• Destination</div>
              <div>• Produit</div>
              <div>• Quantité</div>
              <div>• Prix Unitaire</div>
              <div>• Montant</div>
              <div>• Manquants (Total)</div>
              <div>• Manquant Compteur</div>
              <div>• Manquant Cuve</div>
              <div>• Numéros Clients</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Les données sont filtrées pour inclure uniquement les bons de livraison livrés (statut: "livre") 
            dans la période sélectionnée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};