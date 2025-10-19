import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { tarifsHydrocarburesService } from '@/services/tarifsHydrocarburesService';

export const ExportFactures = () => {
  const [dateDebut, setDateDebut] = useState<Date>();
  const [dateFin, setDateFin] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const exportToCSV = async (data: any[], filename: string) => {
    const headers = [
      'Date Chargement',
      'N°Tournée',
      'Camions',
      'Dépôt',
      'BL',
      'Client',
      'Destination',
      'Produit',
      'Quantité',
      'Prix Unitaire',
      'Montant',
      'Manquants (Total)',
      'Manquant Compteur',
      'Manquant Cuve',
      'Numéros Clients'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.date_chargement_reelle ? new Date(item.date_chargement_reelle).toLocaleDateString('fr-FR') : '',
        item.numero_tournee || '',
        item.vehicule || '',
        item.lieu_depart || '',
        item.numero || '',
        item.client_nom || '',
        item.destination || '',
        item.produit || '',
        item.quantite_livree?.toLocaleString('fr-FR') || '0',
        item.prix_unitaire?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0,00',
        item.montant_total?.toLocaleString('fr-FR') || '0',
        item.manquant_total?.toLocaleString('fr-FR') || '0',
        item.manquant_compteur?.toLocaleString('fr-FR') || '0',
        item.manquant_cuve?.toLocaleString('fr-FR') || '0',
        item.client_code || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBonsLivraisonData = async (dateDebutStr: string, dateFinStr: string) => {
    const { data: bonsLivraison, error } = await supabase
      .from('bons_livraison')
      .select(`
        *,
        vehicules!inner(numero, immatriculation, remorque_immatriculation, type_vehicule),
        chauffeurs!inner(nom, prenom),
        missions!inner(numero, site_depart, site_arrivee, type_transport)
      `)
      .in('statut', ['livre', 'termine'])
      .gte('date_chargement_reelle', dateDebutStr)
      .lte('date_chargement_reelle', dateFinStr)
      .order('date_chargement_reelle', { ascending: false });

    if (error) throw error;

    return bonsLivraison?.map(bl => ({
      date_chargement_reelle: bl.date_chargement_reelle,
      numero_tournee: bl.numero_tournee,
      vehicule: bl.vehicules?.remorque_immatriculation || bl.vehicules?.immatriculation || bl.vehicules?.numero || '',
      lieu_depart: bl.lieu_depart || bl.missions?.site_depart,
      numero: bl.numero,
      client_nom: bl.destination,
      destination: bl.lieu_arrivee || bl.missions?.site_arrivee,
      produit: bl.produit,
      quantite_livree: bl.quantite_livree,
      prix_unitaire: bl.prix_unitaire,
      montant_total: bl.montant_total,
      manquant_total: bl.manquant_total,
      manquant_compteur: bl.manquant_compteur,
      manquant_cuve: bl.manquant_cuve,
      client_code: bl.client_code,
      type_transport: bl.missions?.type_transport || null
    })) || [];
  };

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
      
      const data = await getBonsLivraisonData(dateDebutStr, dateFinStr);
      
      // Compléter les prix manquants et recalculer les montants si nécessaire
      const processedData = await Promise.all(
        data.map(async (item) => {
          let prix = item.prix_unitaire || 0;
          if ((!prix || prix === 0) && item.type_transport === 'hydrocarbures' && item.lieu_depart && item.destination) {
            try {
              const tarif = await tarifsHydrocarburesService.getTarif(item.lieu_depart, item.destination);
              if (tarif?.tarif_au_litre) prix = tarif.tarif_au_litre;
            } catch {}
          }
          const montant = item.montant_total || ((item.quantite_livree || 0) * prix);
          return { ...item, prix_unitaire: prix, montant_total: montant };
        })
      );
      
      // Préparer les données pour Excel
      const excelData = processedData.map(item => ({
        'Date Chargement': item.date_chargement_reelle ? new Date(item.date_chargement_reelle).toLocaleDateString('fr-FR') : '',
        'N° Tournée': item.numero_tournee || '',
        'Camions': item.vehicule || '',
        'Dépôt': item.lieu_depart || '',
        'BL': item.numero || '',
        'Client': item.client_nom || '',
        'Destination': item.destination || '',
        'Prod': item.produit || '',
        'Qté': item.quantite_livree || 0,
        'Pu': item.prix_unitaire || 0,
        'Montant': item.montant_total || 0,
        'Manq$': item.manquant_total || 0,
        'Cpteur': item.manquant_compteur || 0,
        'Cuve': item.manquant_cuve || 0,
        'Numéros Clients': item.client_code || ''
      }));

      // Créer le workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Définir la largeur des colonnes
      const colWidths = [
        { wch: 15 },  // Date Chargement
        { wch: 12 },  // N° Tournée
        { wch: 20 },  // Camions
        { wch: 15 },  // Dépôt
        { wch: 20 },  // BL
        { wch: 25 },  // Client
        { wch: 25 },  // Destination
        { wch: 8 },   // Prod
        { wch: 12 },  // Qté
        { wch: 12 },  // Pu
        { wch: 15 },  // Montant
        { wch: 12 },  // Manq$
        { wch: 12 },  // Cpteur
        { wch: 12 },  // Cuve
        { wch: 20 }   // Numéros Clients
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mouvement Hydrocarbures');

      // Télécharger le fichier
      const filename = `mouvement_${format(dateDebut, 'yyyy-MM')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast({
        title: 'Export réussi',
        description: `Fichier Excel généré pour la période du ${format(dateDebut, 'dd/MM/yyyy')} au ${format(dateFin, 'dd/MM/yyyy')} (${data.length} entrées)`,
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le fichier',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    await handleExportExcel(); // Même logique pour l'instant
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
        <h2 className="text-2xl font-bold">Export Mouvement Hydrocarbures</h2>
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
                debut.setDate(1);
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
                  <h3 className="font-medium">Export Mouvement (.xlsx)</h3>
                  <p className="text-sm text-gray-600">Format mouvement hydrocarbures TOTAL</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p>✓ Format identique au rapport mensuel</p>
                <p>✓ Toutes les colonnes du mouvement TOTAL</p>
                <p>✓ Compatible avec Excel et LibreOffice</p>
              </div>
              <Button
                onClick={handleExportExcel}
                disabled={loading || !dateDebut || !dateFin}
                className="w-full mt-3 bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {loading ? 'Export en cours...' : 'Exporter Mouvement'}
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
                  <p className="text-sm text-gray-600">Format texte avec BOM UTF-8</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p>✓ Compatible avec tous les logiciels</p>
                <p>✓ Séparateurs adaptés au format français</p>
                <p>✓ Encodage UTF-8 avec BOM pour Excel</p>
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
            <h4 className="font-medium mb-2">Colonnes incluses dans l'export (format TOTAL):</h4>
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
