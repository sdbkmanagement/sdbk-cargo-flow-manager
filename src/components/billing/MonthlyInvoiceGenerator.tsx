import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { tarifsHydrocarburesService } from '@/services/tarifsHydrocarburesService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { generateMonthlyInvoicePDF } from '@/utils/pdfGenerator';

export const MonthlyInvoiceGenerator = ({ onInvoiceCreated }: { onInvoiceCreated?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [clientNom, setClientNom] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Récupérer les missions terminées
  const { data: missions = [] } = useQuery({
    queryKey: ['missions-terminees'],
    queryFn: billingService.getMissionsTerminees,
    enabled: open
  });

  const handleGenerate = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner le mois et l\'année',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Début de génération de facture');
      const monthNumber = parseInt(selectedMonth);
      const yearNumber = parseInt(selectedYear);

      // Récupérer toutes les missions terminées du mois avec leurs BL
      const startDate = `${yearNumber}-${selectedMonth.padStart(2, '0')}-01`;
      const endDate = monthNumber === 12 
        ? `${yearNumber + 1}-01-01` 
        : `${yearNumber}-${(monthNumber + 1).toString().padStart(2, '0')}-01`;

      console.log('Recherche missions entre:', startDate, 'et', endDate);

      const { data: missionsData, error } = await supabase
        .from('missions')
        .select(`
          *,
          bons_livraison(*)
        `)
        .eq('statut', 'terminee')
        .or('facturation_statut.eq.en_attente,facturation_statut.is.null')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Missions récupérées:', missionsData?.length || 0);

      if (!missionsData || missionsData.length === 0) {
        toast({
          title: 'Aucune mission',
          description: 'Aucune mission terminée trouvée pour cette période',
          variant: 'destructive'
        });
        setIsGenerating(false);
        return;
      }

      // Calculer les totaux à partir des missions et leurs BL
      let totalHT = 0;
      let blCount = 0;

      for (const mission of missionsData as any[]) {
        console.log('Mission:', mission.numero, 'BL:', mission.bons_livraison?.length || 0);
        const depart = mission.site_depart || '';
        if (mission.bons_livraison && mission.bons_livraison.length > 0) {
          for (const bl of mission.bons_livraison) {
            const quantite = bl.quantite_livree ?? bl.quantite_prevue ?? 0;
            if (!quantite) { continue; }
            let prixUnitaire = bl.prix_unitaire ?? 0;

            if ((!prixUnitaire || prixUnitaire === 0) && mission.type_transport === 'hydrocarbures') {
              const destination = bl.lieu_arrivee || bl.destination || mission.site_arrivee || '';
              try {
                const tarif = await tarifsHydrocarburesService.getTarif(depart, destination);
                if (tarif?.tarif_au_litre) {
                  prixUnitaire = tarif.tarif_au_litre;
                }
              } catch (e) {
                console.warn('Tarif introuvable pour', depart, '→', destination);
              }
            }

            const montant = quantite * (prixUnitaire || 0);
            console.log('BL:', bl.numero, 'Qté:', quantite, 'PU:', prixUnitaire, 'Montant:', montant);
            totalHT += montant;
            blCount++;
          }
        }
      }

      console.log('Total HT:', totalHT, 'BL Count:', blCount);

      if (totalHT === 0 || blCount === 0) {
        toast({
          title: 'Aucun montant',
          description: 'Aucun montant à facturer pour les missions de cette période',
          variant: 'destructive'
        });
        setIsGenerating(false);
        return;
      }

      const totalTVA = totalHT * 0.18;
      const totalTTC = totalHT + totalTVA;

      // Préparer les lignes et les éléments à mettre à jour
      const lignes: { description: string; quantite: number; prix_unitaire: number; total: number }[] = [];
      const blIds: string[] = [];
      const missionIds = new Set<string>();

      for (const mission of missionsData as any[]) {
        const depart = mission.site_depart || '';
        if (mission.bons_livraison && mission.bons_livraison.length > 0) {
          for (const bl of mission.bons_livraison) {
            const quantite = bl.quantite_livree ?? bl.quantite_prevue ?? 0;
            if (!quantite) continue;
            let prixUnitaire = bl.prix_unitaire ?? 0;

            if ((!prixUnitaire || prixUnitaire === 0) && mission.type_transport === 'hydrocarbures') {
              const destination = bl.lieu_arrivee || bl.destination || mission.site_arrivee || '';
              try {
                const tarif = await tarifsHydrocarburesService.getTarif(depart, destination);
                if (tarif?.tarif_au_litre) prixUnitaire = tarif.tarif_au_litre;
              } catch {}
            }

            const description = `${mission.type_transport === 'hydrocarbures' ? 'Transport hydrocarbures' : 'Transport'} ${depart} → ${(bl.lieu_arrivee || bl.destination || mission.site_arrivee || '')} (BL: ${bl.numero})`;
            const total = quantite * (prixUnitaire || 0);
            lignes.push({ description, quantite, prix_unitaire: prixUnitaire || 0, total });
            blIds.push(bl.id);
            missionIds.add(mission.id);
          }
        }
      }

      // Créer la facture en base
      const padMonth = selectedMonth.padStart(2, '0');
      const numero = `FM${selectedYear}${padMonth}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      const today = new Date();
      const date_emission = today.toISOString().split('T')[0];
      const date_echeance = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const facture = await billingService.createFacture({
        numero,
        client_nom: clientNom || 'TOTALEnergies GUINEE SA',
        date_emission,
        date_echeance,
        montant_ht: totalHT,
        montant_tva: totalTVA,
        montant_ttc: totalTTC,
        statut: 'en_attente'
      } as any, lignes);

      // Marquer les BL comme facturés (en lot)
      if (blIds.length > 0) {
        await supabase.from('bons_livraison').update({ facture: true }).in('id', blIds);
      }

      // Marquer les missions comme facturées via le nouveau statut
      const missionsToUpdate = Array.from(missionIds);
      if (missionsToUpdate.length > 0) {
        await supabase
          .from('missions')
          .update({ facturation_statut: 'facturee', facturation_date: new Date().toISOString() })
          .in('id', missionsToUpdate);
      }

      // Générer le PDF récapitulatif
      generateMonthlyInvoicePDF({
        month: selectedMonth,
        year: selectedYear,
        clientNom: clientNom || 'TOTALEnergies GUINEE SA',
        totalHT,
        totalTVA,
        totalTTC,
        blCount
      });

      toast({
        title: 'Facture groupée créée',
        description: `Facture ${facture.numero} créée (${blIds.length} BL) – Total: ${totalTTC.toLocaleString('fr-FR')} GNF`
      });

      onInvoiceCreated?.();
      setOpen(false);
    } catch (error: any) {
      console.error('Erreur complète:', error);
      console.error('Message:', error?.message);
      console.error('Details:', error?.details);
      toast({
        title: 'Erreur',
        description: error?.message || 'Erreur lors de la génération de la facture',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const months = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i.toString());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Facture groupée mensuelle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer une facture groupée mensuelle</DialogTitle>
          <DialogDescription>
            Créer une facture unique pour toutes les missions du mois
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom du client (optionnel)</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Ex: TOTALEnergies GUINEE SA"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !selectedMonth || !selectedYear}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Générer facture PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
