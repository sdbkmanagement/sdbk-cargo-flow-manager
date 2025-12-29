import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { supabase } from '@/integrations/supabase/client';
import { generateMonthlyInvoicePDF } from '@/utils/pdfGenerator';

export const MonthlyInvoiceGenerator = ({ onInvoiceCreated }: { onInvoiceCreated?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [clientNom, setClientNom] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      const monthNumber = parseInt(selectedMonth);
      const yearNumber = parseInt(selectedYear);

      const startDate = `${yearNumber}-${selectedMonth.padStart(2, '0')}-01`;
      const endDate = monthNumber === 12 
        ? `${yearNumber + 1}-01-01` 
        : `${yearNumber}-${(monthNumber + 1).toString().padStart(2, '0')}-01`;

      // Charger BL et tarifs en parallèle
      const [blResult, tarifsResult] = await Promise.all([
        supabase
          .from('bons_livraison')
          .select(`
            id, numero, destination, lieu_arrivee, quantite_livree, quantite_prevue, prix_unitaire,
            missions!inner(id, numero, type_transport, site_depart, site_arrivee)
          `)
          .in('statut', ['livre', 'termine'])
          .gte('date_chargement_reelle', startDate)
          .lt('date_chargement_reelle', endDate)
          .order('date_chargement_reelle', { ascending: true }),
        supabase
          .from('tarifs_hydrocarbures')
          .select('lieu_depart, destination, tarif_au_litre')
      ]);

      if (blResult.error) throw blResult.error;
      
      const blData = blResult.data || [];
      const tarifs = tarifsResult.data || [];

      if (blData.length === 0) {
        toast({
          title: 'Aucun BL',
          description: 'Aucun bon de livraison trouvé pour cette période',
          variant: 'destructive'
        });
        setIsGenerating(false);
        return;
      }

      // Créer un map des tarifs pour recherche rapide
      const tarifMap = new Map<string, number>();
      tarifs.forEach(t => {
        tarifMap.set(`${t.lieu_depart.toLowerCase()}|${t.destination.toLowerCase()}`, t.tarif_au_litre);
      });

      // Fonction pour trouver un tarif (avec recherche flexible)
      const findTarif = (depart: string, dest: string): number => {
        const key = `${depart.toLowerCase()}|${dest.toLowerCase()}`;
        if (tarifMap.has(key)) return tarifMap.get(key)!;
        
        // Recherche flexible
        for (const [k, v] of tarifMap) {
          const [d, dst] = k.split('|');
          if (depart.toLowerCase().includes(d) || d.includes(depart.toLowerCase())) {
            if (dest.toLowerCase().includes(dst) || dst.includes(dest.toLowerCase())) {
              return v;
            }
          }
        }
        return 0;
      };

      // Une seule boucle pour tout calculer
      let totalHT = 0;
      const lignes: { description: string; quantite: number; prix_unitaire: number; total: number }[] = [];
      const blIds: string[] = [];
      const missionIds = new Set<string>();

      for (const bl of blData as any[]) {
        const mission = bl.missions || {};
        const depart = mission.site_depart || '';
        const destination = bl.lieu_arrivee || bl.destination || mission.site_arrivee || '';
        const quantite = bl.quantite_livree ?? bl.quantite_prevue ?? 0;
        
        if (!quantite) continue;
        
        let prixUnitaire = bl.prix_unitaire ?? 0;
        if ((!prixUnitaire || prixUnitaire === 0) && mission.type_transport === 'hydrocarbures') {
          prixUnitaire = findTarif(depart, destination);
        }

        const total = quantite * prixUnitaire;
        totalHT += total;

        const description = `${mission.type_transport === 'hydrocarbures' ? 'Transport hydrocarbures' : 'Transport'} ${depart} → ${destination} (BL: ${bl.numero})`;
        lignes.push({ description, quantite, prix_unitaire: prixUnitaire, total });
        blIds.push(bl.id);
        if (mission.id) missionIds.add(mission.id);
      }

      if (totalHT === 0 || blIds.length === 0) {
        toast({
          title: 'Aucun montant',
          description: 'Aucun montant à facturer pour cette période',
          variant: 'destructive'
        });
        setIsGenerating(false);
        return;
      }

      const totalTVA = totalHT * 0.18;
      const totalTTC = totalHT + totalTVA;

      // Créer la facture
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

      // Marquer BL et missions en parallèle
      const missionsToUpdate = Array.from(missionIds);
      await Promise.all([
        blIds.length > 0 
          ? supabase.from('bons_livraison').update({ facture: true }).in('id', blIds)
          : Promise.resolve(),
        missionsToUpdate.length > 0
          ? supabase.from('missions').update({ facturation_statut: 'facturee', facturation_date: new Date().toISOString() }).in('id', missionsToUpdate)
          : Promise.resolve()
      ]);

      // Générer le PDF
      generateMonthlyInvoicePDF({
        month: selectedMonth,
        year: selectedYear,
        clientNom: clientNom || 'TOTALEnergies GUINEE SA',
        totalHT,
        totalTVA,
        totalTTC,
        blCount: blIds.length
      });

      toast({
        title: 'Facture groupée créée',
        description: `Facture ${facture.numero} créée (${blIds.length} BL) – Total: ${totalTTC.toLocaleString('fr-FR')} GNF`
      });

      onInvoiceCreated?.();
      setOpen(false);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error?.message || 'Erreur lors de la génération',
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
