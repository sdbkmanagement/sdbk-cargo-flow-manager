import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculerBulletin, getParametresPaie, PARAMETRES_PAIE_DEFAUT } from '@/services/paieConfig';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const champs = [
  ['salaire_base', 'Salaire de base'],
  ['prime_transport', 'Prime de transport'],
  ['prime_logement', 'Prime de logement'],
  ['prime_cherete_vie', 'Prime de cherté de vie'],
  ['autres_primes', 'Autres primes et indemnités'],
  ['avance_salaire', 'Avance sur salaire'],
  ['manquant', 'Manquant'],
  ['complement_mois_precedent', 'Complément mois précédent'],
] as const;

type BulletinEditDialogProps = {
  bulletin: any | null;
  onClose: () => void;
  onSaved?: () => void;
};

export const BulletinEditDialog = ({ bulletin, onClose, onSaved }: BulletinEditDialogProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});

  const { data: parametres } = useQuery({
    queryKey: ['parametres-paie'],
    queryFn: getParametresPaie,
  });

  useEffect(() => {
    if (!bulletin) return;
    setForm(Object.fromEntries(champs.map(([key]) => [key, bulletin[key] ?? 0])));
  }, [bulletin]);

  const n = (value: any) => Number(value) || 0;
  const entree = () => ({
    salaireBase: n(form.salaire_base),
    primeTransport: n(form.prime_transport),
    primeLogement: n(form.prime_logement),
    primeChereteVie: n(form.prime_cherete_vie),
    autresPrimes: n(form.autres_primes),
    avanceSalaire: n(form.avance_salaire),
    manquant: n(form.manquant),
    complementMoisPrecedent: n(form.complement_mois_precedent),
    retenuePret: n(bulletin?.retenue_pret),
  });

  const apercu = useMemo(
    () => calculerBulletin(entree(), parametres || PARAMETRES_PAIE_DEFAUT),
    [form, bulletin, parametres]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!bulletin) return;
      const params = await getParametresPaie();
      const r = calculerBulletin(entree(), params);
      const { error } = await supabase.from('bulletins_paie').update({
        salaire_base: r.salaireBase,
        prime_transport: n(form.prime_transport),
        prime_logement: n(form.prime_logement),
        prime_cherete_vie: n(form.prime_cherete_vie),
        autres_primes: n(form.autres_primes),
        total_primes: r.totalPrimes,
        salaire_brut: r.salaireBrut,
        base_cnss: r.baseCnss,
        cotisation_cnss_employe: r.cnssSalarie,
        cotisation_cnss_employeur: r.cnssPatronal,
        base_rts: r.baseRts,
        rts: r.rts,
        irg: r.rts,
        onfpp: r.onfpp,
        versement_forfaitaire: r.versementForfaitaire,
        total_charges_patronales: r.totalChargesPatronales,
        avance_salaire: n(form.avance_salaire),
        manquant: n(form.manquant),
        complement_mois_precedent: n(form.complement_mois_precedent),
        total_retenues: r.totalRetenues,
        salaire_net: r.netAPayer,
        net_a_payer: r.netAPayer,
      }).eq('id', bulletin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletins-paie'] });
      queryClient.invalidateQueries({ queryKey: ['masse-salariale-bulletins'] });
      onClose();
      onSaved?.();
      toast({ title: 'Primes et bulletin mis à jour' });
    },
    onError: (error: any) => toast({ title: 'Erreur', description: error.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={!!bulletin} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Saisir les primes — {bulletin?.employe?.prenom} {bulletin?.employe?.nom}
            {bulletin?.periode ? ` (${moisNoms[bulletin.periode.mois]} ${bulletin.periode.annee})` : ''}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Saisissez les montants propres à ce collaborateur. Le brut, les cotisations et le net sont recalculés automatiquement.
        </p>
        <div className="overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {champs.map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`bulletin-${key}`}>{label} (GNF)</Label>
                <Input
                  id={`bulletin-${key}`}
                  type="number"
                  min="0"
                  step="1"
                  value={form[key] ?? 0}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/30">
            <div className="flex justify-between"><span>Total des primes</span><span>{apercu.totalPrimes.toLocaleString('fr-FR')} GNF</span></div>
            <div className="flex justify-between"><span>Salaire brut</span><span className="font-medium">{apercu.salaireBrut.toLocaleString('fr-FR')} GNF</span></div>
            <div className="flex justify-between"><span>CNSS salarié (5%)</span><span>{apercu.cnssSalarie.toLocaleString('fr-FR')} GNF</span></div>
            <div className="flex justify-between"><span>Base d'imposition RTS</span><span>{apercu.baseRts.toLocaleString('fr-FR')} GNF</span></div>
            <div className="flex justify-between"><span>RTS</span><span>{apercu.rts.toLocaleString('fr-FR')} GNF</span></div>
            <div className="flex justify-between"><span>Total retenues</span><span>{apercu.totalRetenues.toLocaleString('fr-FR')} GNF</span></div>
            <div className="flex justify-between text-base font-semibold pt-1 border-t"><span>Salaire net à payer</span><span>{apercu.netAPayer.toLocaleString('fr-FR')} GNF</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
