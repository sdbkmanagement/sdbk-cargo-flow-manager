import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { tarifsHydrocarburesService } from '@/services/tarifsHydrocarburesService';
import { useQuery } from '@tanstack/react-query';

export const MonthlyInvoiceGenerator = () => {
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
    if (!selectedMonth || !selectedYear || !clientNom) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const monthNumber = parseInt(selectedMonth);
      const yearNumber = parseInt(selectedYear);

      // Filtrer les missions du mois sélectionné
      const missionsDuMois = missions.filter(m => {
        const missionDate = new Date(m.created_at);
        return missionDate.getMonth() + 1 === monthNumber && 
               missionDate.getFullYear() === yearNumber;
      });

      if (missionsDuMois.length === 0) {
        toast({
          title: 'Aucune mission',
          description: 'Aucune mission terminée trouvée pour ce mois',
          variant: 'destructive'
        });
        return;
      }

      // Calculer le total des missions
      let totalHT = 0;
      const lignesFacture = [];

      for (const mission of missionsDuMois) {
        if (mission.bons_livraison && mission.bons_livraison.length > 0) {
          for (const bl of mission.bons_livraison) {
            if (!bl.facture) {
              let prixUnitaire = bl.prix_unitaire || 0;
              
              // Pour les hydrocarbures, récupérer le tarif automatiquement
              if (mission.type_transport === 'hydrocarbures' && bl.lieu_arrivee) {
                const tarif = await tarifsHydrocarburesService.getTarif(
                  mission.site_depart, 
                  bl.lieu_arrivee
                );
                if (tarif) {
                  prixUnitaire = tarif.tarif_au_litre;
                }
              }
              
              const quantite = bl.quantite_livree || bl.quantite_prevue || 0;
              const total = quantite * prixUnitaire;
              totalHT += total;

              lignesFacture.push({
                description: `${mission.numero} - ${bl.produit} - ${bl.destination} (BL: ${bl.numero})`,
                quantite: quantite,
                prix_unitaire: prixUnitaire,
                total: total
              });
            }
          }
        }
      }

      if (lignesFacture.length === 0) {
        toast({
          title: 'Aucune facture à générer',
          description: 'Toutes les missions ont déjà été facturées',
          variant: 'destructive'
        });
        return;
      }

      // Créer la facture groupée
      const tva = totalHT * 0.18;
      const totalTTC = totalHT + tva;

      const factureData = {
        numero: `F${selectedYear}${selectedMonth.padStart(2, '0')}-GROUPE`,
        client_nom: clientNom,
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type_transport: 'Multiple',
        montant_ht: totalHT,
        montant_tva: tva,
        montant_ttc: totalTTC,
        statut: 'en_attente',
        observations: `Facture groupée pour le mois ${selectedMonth}/${selectedYear} - ${missionsDuMois.length} missions`
      };

      await billingService.createFacture(factureData, lignesFacture);

      // Marquer les BL comme facturés
      for (const mission of missionsDuMois) {
        if (mission.bons_livraison) {
          for (const bl of mission.bons_livraison) {
            if (!bl.facture) {
              await billingService.markBLAsFactured(bl.id);
            }
          }
        }
      }

      toast({
        title: 'Facture créée',
        description: `Facture groupée créée avec succès pour ${missionsDuMois.length} missions`
      });

      setOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération de la facture',
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
            <Label>Nom du client</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Nom du client"
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
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Génération en cours...' : 'Générer la facture'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
