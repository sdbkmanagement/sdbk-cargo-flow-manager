import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export type RHKpiKey =
  | 'effectif_total' | 'effectif_actif' | 'inactifs' | 'masse_salariale'
  | 'age_moyen' | 'anciennete' | 'absences' | 'conges'
  | 'contrats' | 'documents' | 'visites' | 'retraite';

const TITLES: Record<RHKpiKey, string> = {
  effectif_total: 'Effectif total',
  effectif_actif: 'Effectif actif',
  inactifs: 'Collaborateurs inactifs',
  masse_salariale: 'Masse salariale — détail par collaborateur',
  age_moyen: "Âge des collaborateurs",
  anciennete: 'Ancienneté des collaborateurs',
  absences: 'Absences en cours',
  conges: 'Congés en cours',
  contrats: 'Contrats à échéance (< 60 jours)',
  documents: 'Documents expirants (< 30 jours)',
  visites: 'Visites médicales à renouveler',
  retraite: 'Départs à la retraite (59 ans et +)',
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const age = (dn?: string | null) =>
  dn ? Math.floor((Date.now() - new Date(dn).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
const anciennete = (de?: string | null) =>
  de ? Math.floor((Date.now() - new Date(de).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 p-3 border rounded-lg text-sm">{children}</div>
);

const EmployeNom = ({ e }: { e: any }) => (
  <div>
    <p className="font-medium">{e.prenom} {e.nom}</p>
    <p className="text-xs text-muted-foreground">{[e.poste, e.service].filter(Boolean).join(' · ')}</p>
  </div>
);

export const RHKpiDetailDialog = ({
  kpi,
  open,
  onOpenChange,
  employes,
}: {
  kpi: RHKpiKey | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employes: any[];
}) => {
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 864e5).toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];

  const { data: absences = [], isLoading: loadAbs } = useQuery({
    queryKey: ['rh-detail-absences'],
    enabled: open && (kpi === 'absences' || kpi === 'conges'),
    queryFn: async () => {
      const { data, error } = await sb
        .from('absences')
        .select('*, employe:employes(nom, prenom, service)')
        .eq('statut', 'approuve')
        .lte('date_debut', today)
        .gte('date_fin', today);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: conges = [], isLoading: loadCng } = useQuery({
    queryKey: ['rh-detail-conges'],
    enabled: open && kpi === 'conges',
    queryFn: async () => {
      const { data, error } = await sb
        .from('conges')
        .select('*, employe:employes(nom, prenom, service)')
        .lte('date_debut', today)
        .gte('date_fin', today);
      if (error) throw error;
      return (data as any[]).filter((c) =>
        ['approuve', 'approuvé', 'valide', 'validé', 'en_cours'].includes(String(c.statut || '').toLowerCase())
      );
    },
  });

  const { data: documents = [], isLoading: loadDoc } = useQuery({
    queryKey: ['rh-detail-documents'],
    enabled: open && kpi === 'documents',
    queryFn: async () => {
      const { data, error } = await sb
        .from('documents_rh')
        .select('*, employe:employes(nom, prenom, service)')
        .not('date_expiration', 'is', null)
        .lte('date_expiration', in30)
        .order('date_expiration');
      if (error) throw error;
      return data as any[];
    },
  });

  const loadCtr = false;
  const loadVis = false;

  const loading = loadAbs || loadCtr || loadDoc || loadVis;

  const renderContent = () => {
    if (!kpi) return null;
    if (loading) return <p className="text-sm text-muted-foreground py-6 text-center">Chargement...</p>;

    const list = employes || [];
    const actifs = list.filter((e) => e.statut === 'actif');

    switch (kpi) {
      case 'effectif_total':
      case 'effectif_actif':
      case 'inactifs': {
        const rows = kpi === 'effectif_total' ? list : kpi === 'effectif_actif' ? actifs : list.filter((e) => e.statut !== 'actif');
        return rows.map((e) => (
          <Row key={e.id}>
            <EmployeNom e={e} />
            <Badge variant={e.statut === 'actif' ? 'default' : 'secondary'}>{e.statut}</Badge>
          </Row>
        ));
      }
      case 'masse_salariale': {
        const rows = actifs.filter((e) => e.salaire_base).sort((a, b) => (b.salaire_base || 0) - (a.salaire_base || 0));
        const total = rows.reduce((s, e) => s + (e.salaire_base || 0), 0);
        return (
          <>
            {rows.map((e) => (
              <Row key={e.id}>
                <EmployeNom e={e} />
                <span className="font-semibold whitespace-nowrap">{(e.salaire_base || 0).toLocaleString('fr-FR')} GNF</span>
              </Row>
            ))}
            <div className="flex justify-between p-3 text-sm font-bold border-t mt-2">
              <span>Total</span><span>{total.toLocaleString('fr-FR')} GNF</span>
            </div>
          </>
        );
      }
      case 'age_moyen':
      case 'retraite': {
        let rows = list.filter((e) => age(e.date_naissance) !== null);
        if (kpi === 'retraite') rows = rows.filter((e) => (age(e.date_naissance) || 0) >= 59);
        rows = rows.sort((a, b) => (age(b.date_naissance) || 0) - (age(a.date_naissance) || 0));
        return rows.map((e) => (
          <Row key={e.id}>
            <EmployeNom e={e} />
            <Badge variant="outline">{age(e.date_naissance)} ans</Badge>
          </Row>
        ));
      }
      case 'anciennete': {
        const rows = list
          .filter((e) => anciennete(e.date_embauche) !== null)
          .sort((a, b) => (anciennete(b.date_embauche) || 0) - (anciennete(a.date_embauche) || 0));
        return rows.map((e) => (
          <Row key={e.id}>
            <EmployeNom e={e} />
            <Badge variant="outline">{anciennete(e.date_embauche)} ans</Badge>
          </Row>
        ));
      }
      case 'absences':
      case 'conges': {
        const rows = (absences as any[]).filter((a) =>
          kpi === 'conges' ? /cong/i.test(a.type_absence || '') : !/cong/i.test(a.type_absence || '')
        );
        if (!rows.length) return <p className="text-sm text-muted-foreground py-6 text-center">Aucun élément en cours</p>;
        return rows.map((a) => (
          <Row key={a.id}>
            <div>
              <p className="font-medium">{a.employe?.prenom} {a.employe?.nom}</p>
              <p className="text-xs text-muted-foreground">{a.type_absence}{a.motif ? ` — ${a.motif}` : ''}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(a.date_debut)} → {fmtDate(a.date_fin)}</span>
          </Row>
        ));
      }
      case 'contrats': {
        if (!contrats.length) return <p className="text-sm text-muted-foreground py-6 text-center">Aucun contrat à échéance</p>;
        return (contrats as any[]).map((c) => (
          <Row key={c.id}>
            <div>
              <p className="font-medium">{c.employe?.prenom} {c.employe?.nom}</p>
              <p className="text-xs text-muted-foreground">{c.employe?.service || ''}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline">{c.type_contrat}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Fin : {fmtDate(c.date_fin)}</p>
            </div>
          </Row>
        ));
      }
      case 'documents': {
        if (!documents.length) return <p className="text-sm text-muted-foreground py-6 text-center">Aucun document expirant</p>;
        return (documents as any[]).map((d) => (
          <Row key={d.id}>
            <div>
              <p className="font-medium">{d.employe?.prenom} {d.employe?.nom}</p>
              <p className="text-xs text-muted-foreground">{d.type_document}</p>
            </div>
            <Badge variant={d.date_expiration < today ? 'destructive' : 'secondary'}>
              {d.date_expiration < today ? 'Expiré' : `Expire le ${fmtDate(d.date_expiration)}`}
            </Badge>
          </Row>
        ));
      }
      case 'visites': {
        if (!visites.length) return <p className="text-sm text-muted-foreground py-6 text-center">Aucune visite à renouveler</p>;
        return (visites as any[]).map((v) => (
          <Row key={v.id}>
            <div>
              <p className="font-medium">{v.employe?.prenom} {v.employe?.nom}</p>
              <p className="text-xs text-muted-foreground">Visite {v.type_visite} — dernière le {fmtDate(v.date_visite)}</p>
            </div>
            <Badge variant={v.date_prochaine < today ? 'destructive' : 'secondary'}>
              {v.date_prochaine < today ? 'En retard' : `Prochaine : ${fmtDate(v.date_prochaine)}`}
            </Badge>
          </Row>
        ));
      }
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kpi ? TITLES[kpi] : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
