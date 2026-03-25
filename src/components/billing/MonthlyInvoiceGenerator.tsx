import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { supabase } from '@/integrations/supabase/client';
import { generateMonthlyInvoicePDF } from '@/utils/pdfGenerator';
import { BLPreviewList, type BLPreviewItem } from './BLPreviewList';

export const MonthlyInvoiceGenerator = ({ onInvoiceCreated }: { onInvoiceCreated?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [clientNom, setClientNom] = useState('');
  const [selectedDepot, setSelectedDepot] = useState('tous');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Preview state
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [previewItems, setPreviewItems] = useState<BLPreviewItem[]>([]);
  const [selectedBLIds, setSelectedBLIds] = useState<Set<string>>(new Set());
  const [rawBLData, setRawBLData] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);

  const depots = [
    { value: 'tous', label: 'Tous les dépôts (facture globale)' },
    { value: 'Conakry', label: 'Conakry' },
    { value: 'Kankan', label: 'Kankan' },
    { value: 'N\'Zerekore', label: 'N\'Zérékoré' }
  ];

  const resetState = () => {
    setStep('config');
    setPreviewItems([]);
    setSelectedBLIds(new Set());
    setRawBLData([]);
    setTarifs([]);
  };

  // Tarif lookup helper
  const buildTarifMap = (tarifsData: any[]) => {
    const tarifMap = new Map<string, number>();
    tarifsData.forEach(t => {
      tarifMap.set(`${t.lieu_depart.toLowerCase()}|${t.destination.toLowerCase()}`, t.tarif_au_litre);
    });
    return tarifMap;
  };

  const findTarif = (tarifMap: Map<string, number>, depart: string, dest: string): number => {
    const key = `${depart.toLowerCase()}|${dest.toLowerCase()}`;
    if (tarifMap.has(key)) return tarifMap.get(key)!;
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

  const handlePreview = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner le mois et l\'année', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const monthNumber = parseInt(selectedMonth);
      const yearNumber = parseInt(selectedYear);
      const padMonth = selectedMonth.padStart(2, '0');
      const startDate = `${yearNumber}-${padMonth}-01`;
      const endDate = monthNumber === 12
        ? `${yearNumber + 1}-01-01`
        : `${yearNumber}-${(monthNumber + 1).toString().padStart(2, '0')}-01`;

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

      let blData = blResult.data || [];
      if (selectedDepot !== 'tous') {
        blData = blData.filter((bl: any) => {
          const siteDepart = (bl.missions?.site_depart || '').toLowerCase();
          return siteDepart.includes(selectedDepot.toLowerCase());
        });
      }

      if (blData.length === 0) {
        toast({ title: 'Aucun BL', description: 'Aucun bon de livraison trouvé pour cette période', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const tarifsData = tarifsResult.data || [];
      const tarifMap = buildTarifMap(tarifsData);

      const items: BLPreviewItem[] = blData.map((bl: any) => {
        const mission = bl.missions || {};
        const depart = mission.site_depart || '';
        const destination = bl.lieu_arrivee || bl.destination || mission.site_arrivee || '';
        const quantite = bl.quantite_livree ?? bl.quantite_prevue ?? 0;
        let prixUnitaire = bl.prix_unitaire ?? 0;
        if ((!prixUnitaire || prixUnitaire === 0) && mission.type_transport === 'hydrocarbures') {
          prixUnitaire = findTarif(tarifMap, depart, destination);
        }
        return {
          id: bl.id,
          numero: bl.numero,
          destination: bl.destination,
          lieu_arrivee: bl.lieu_arrivee,
          quantite,
          prix_unitaire: prixUnitaire,
          total: quantite * prixUnitaire,
          depart,
          mission_numero: mission.numero
        };
      });

      setPreviewItems(items);
      setSelectedBLIds(new Set(items.map(i => i.id)));
      setRawBLData(blData);
      setTarifs(tarifsData);
      setStep('preview');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: error?.message || 'Erreur lors du chargement', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBL = (id: string) => {
    setSelectedBLIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedBLIds(checked ? new Set(previewItems.map(i => i.id)) : new Set());
  };

  const generateInvoiceForItems = async (items: BLPreviewItem[], isAdditive: boolean) => {
    if (items.length === 0) {
      toast({ title: 'Erreur', description: 'Aucun BL à facturer', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const padMonth = selectedMonth.padStart(2, '0');
      const depotSuffix = selectedDepot !== 'tous' ? `-${selectedDepot.substring(0, 3).toUpperCase()}` : '';
      const addSuffix = isAdditive ? '-ADD' : '';
      const facturePrefix = `FM${selectedYear}${padMonth}${depotSuffix}${addSuffix}`;

      const { data: existingFactures } = await supabase
        .from('factures')
        .select('id, numero')
        .like('numero', `${facturePrefix}%`)
        .limit(1);

      const existingFacture = existingFactures && existingFactures.length > 0 ? existingFactures[0] : null;
      const isUpdate = !!existingFacture;

      let totalHT = 0;
      const lignes: { description: string; quantite: number; prix_unitaire: number; total: number }[] = [];
      const blIds: string[] = [];
      const missionIds = new Set<string>();

      for (const item of items) {
        const bl = rawBLData.find((b: any) => b.id === item.id);
        const mission = bl?.missions || {};

        totalHT += item.total;
        const prefix = isAdditive ? '[ADD] ' : '';
        const description = `${prefix}${mission.type_transport === 'hydrocarbures' ? 'Transport hydrocarbures' : 'Transport'} ${item.depart} → ${item.lieu_arrivee || item.destination} (BL: ${item.numero})`;
        lignes.push({ description, quantite: item.quantite, prix_unitaire: item.prix_unitaire, total: item.total });
        blIds.push(item.id);
        if (mission.id) missionIds.add(mission.id);
      }

      if (totalHT === 0 || blIds.length === 0) {
        toast({ title: 'Aucun montant', description: 'Aucun montant à facturer', variant: 'destructive' });
        setIsGenerating(false);
        return;
      }

      const totalTVA = totalHT * 0.18;
      const totalTTC = totalHT + totalTVA;
      let facture: any;

      if (isUpdate && existingFacture) {
        const today = new Date();
        const date_emission = today.toISOString().split('T')[0];
        const date_echeance = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await supabase.from('factures').update({
          client_nom: clientNom || 'TOTALEnergies GUINEE SA',
          date_emission, date_echeance,
          montant_ht: totalHT, montant_tva: totalTVA, montant_ttc: totalTTC,
          updated_at: new Date().toISOString()
        }).eq('id', existingFacture.id);

        await supabase.from('facture_lignes').delete().eq('facture_id', existingFacture.id);

        if (lignes.length > 0) {
          await supabase.from('facture_lignes').insert(
            lignes.map(l => ({ facture_id: existingFacture.id, description: l.description, quantite: l.quantite, prix_unitaire: l.prix_unitaire, total: l.total }))
          );
        }
        facture = { numero: existingFacture.numero };
      } else {
        const numero = `${facturePrefix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const today = new Date();
        const date_emission = today.toISOString().split('T')[0];
        const date_echeance = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        facture = await billingService.createFacture({
          numero,
          client_nom: clientNom || 'TOTALEnergies GUINEE SA',
          date_emission, date_echeance,
          montant_ht: totalHT, montant_tva: totalTVA, montant_ttc: totalTTC,
          statut: 'en_attente'
        } as any, lignes);
      }

      const missionsToUpdate = Array.from(missionIds);
      await Promise.all([
        blIds.length > 0 ? supabase.from('bons_livraison').update({ facture: true }).in('id', blIds) : Promise.resolve(),
        missionsToUpdate.length > 0 ? supabase.from('missions').update({ facturation_statut: 'facturee', facturation_date: new Date().toISOString() }).in('id', missionsToUpdate) : Promise.resolve()
      ]);

      const depotLabel = selectedDepot !== 'tous' ? ` – Dépôt: ${selectedDepot}` : '';
      const typeLabel = isAdditive ? ' (Additive)' : '';
      generateMonthlyInvoicePDF({
        month: selectedMonth, year: selectedYear,
        clientNom: (clientNom || 'TOTALEnergies GUINEE SA') + depotLabel + typeLabel,
        totalHT, totalTVA, totalTTC, blCount: blIds.length
      });

      toast({
        title: isUpdate ? 'Facture mise à jour' : `Facture ${isAdditive ? 'additive ' : ''}créée`,
        description: `Facture ${facture.numero} ${isUpdate ? 'mise à jour' : 'créée'} (${blIds.length} BL${depotLabel}) – Total: ${totalTTC.toLocaleString('fr-FR')} GNF`
      });

      onInvoiceCreated?.();
      resetState();
      setOpen(false);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: error?.message || 'Erreur lors de la génération', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    const selectedItems = previewItems.filter(i => selectedBLIds.has(i.id));
    return generateInvoiceForItems(selectedItems, false);
  };

  const handleGenerateAdditive = () => {
    const excludedItems = previewItems.filter(i => !selectedBLIds.has(i.id));
    return generateInvoiceForItems(excludedItems, true);
  };

  const months = [
    { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 1; i++) years.push(i.toString());

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Facture groupée mensuelle
        </Button>
      </DialogTrigger>
      <DialogContent className={step === 'preview' ? 'max-w-3xl' : ''}>
        <DialogHeader>
          <DialogTitle>
            {step === 'config' ? 'Générer une facture groupée mensuelle' : 'Sélection des BL à facturer'}
          </DialogTitle>
          <DialogDescription>
            {step === 'config'
              ? 'Sélectionnez la période puis prévisualisez les BL avant de facturer'
              : 'Décochez les BL en litige ou en attente d\'information'}
          </DialogDescription>
        </DialogHeader>

        {step === 'config' && (
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
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Année</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Dépôt (lieu de départ)</Label>
              <Select value={selectedDepot} onValueChange={setSelectedDepot}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {depots.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handlePreview}
              disabled={isLoading || !selectedMonth || !selectedYear}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Chargement des BL...' : 'Prévisualiser les BL'}
            </Button>
          </div>
        )}

        {step === 'preview' && (() => {
          const excludedCount = previewItems.length - selectedBLIds.size;
          return (
          <div className="space-y-4">
            <BLPreviewList
              items={previewItems}
              selectedIds={selectedBLIds}
              onToggle={handleToggleBL}
              onToggleAll={handleToggleAll}
            />

            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Si une facture existe déjà pour ce mois{selectedDepot !== 'tous' ? ` et ce dépôt (${selectedDepot})` : ''}, elle sera mise à jour automatiquement.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('config')} className="flex-1">
                Retour
              </Button>
              {excludedCount > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleGenerateAdditive}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Génération...' : `Facture additive (${excludedCount} BL)`}
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedBLIds.size === 0}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isGenerating ? 'Génération...' : `Facturer ${selectedBLIds.size} BL`}
              </Button>
            </div>
          </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
};
