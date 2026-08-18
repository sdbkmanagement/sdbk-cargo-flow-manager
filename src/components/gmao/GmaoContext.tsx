import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gmaoService, GmaoEquipement, GmaoOrdreTravail, GmaoDemande, GmaoPiece, GmaoPlan } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';

export type GmaoSection =
  | 'dashboard'
  | 'equipements'
  | 'interventions'
  | 'preventif'
  | 'pieces'
  | 'couts'
  | 'rapports';

export type StatsEquipement = {
  interventions: number;
  pannes: number;
  coutTotal: number;
  coutPieces: number;
  coutMainOeuvre: number;
  coutPrestation: number;
  immobilisationHeures: number;
  derniereMaintenance: string | null;
  prochaineEcheance: string | null;
  prochainKm: number | null;
  otEnCours: number;
};

export type AlerteGmao = {
  id: string;
  type: 'preventif_echu' | 'preventif_proche' | 'ot_retard' | 'immobilise' | 'stock' | 'attente_piece';
  gravite: 'danger' | 'alerte' | 'info';
  titre: string;
  detail: string;
  section: GmaoSection;
  equipementId?: string | null;
};

type Ctx = {
  chargement: boolean;
  equipements: GmaoEquipement[];
  ots: (GmaoOrdreTravail & Record<string, any>)[];
  demandes: GmaoDemande[];
  pieces: GmaoPiece[];
  plans: GmaoPlan[];
  statsParEquipement: Record<string, StatsEquipement>;
  alertes: AlerteGmao[];
  equipementParId: (id?: string | null) => GmaoEquipement | undefined;
  libelleEquipement: (id?: string | null) => string;
  rafraichir: () => Promise<void>;
  section: GmaoSection;
  allerA: (s: GmaoSection, equipementId?: string) => void;
  equipementCible: string | null;
  consommerEquipementCible: () => string | null;
};

const GmaoCtx = createContext<Ctx | null>(null);

export const useGmao = () => {
  const ctx = useContext(GmaoCtx);
  if (!ctx) throw new Error('useGmao doit être utilisé dans GmaoProvider');
  return ctx;
};

const JOUR = 24 * 60 * 60 * 1000;

export const GmaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [chargement, setChargement] = useState(true);
  const [equipements, setEquipements] = useState<GmaoEquipement[]>([]);
  const [ots, setOts] = useState<any[]>([]);
  const [demandes, setDemandes] = useState<GmaoDemande[]>([]);
  const [pieces, setPieces] = useState<GmaoPiece[]>([]);
  const [plans, setPlans] = useState<GmaoPlan[]>([]);
  const [section, setSection] = useState<GmaoSection>('dashboard');
  const [equipementCible, setEquipementCible] = useState<string | null>(null);

  const rafraichir = useCallback(async () => {
    try {
      const d = await gmaoService.getVueGlobale();
      setEquipements(d.equipements);
      setOts(d.ots as any[]);
      setDemandes(d.demandes);
      setPieces(d.pieces);
      setPlans(d.plans);
    } catch (e: any) {
      toast({ title: 'Erreur de chargement GMAO', description: e.message, variant: 'destructive' });
    } finally {
      setChargement(false);
    }
  }, [toast]);

  useEffect(() => { rafraichir(); }, [rafraichir]);

  const statsParEquipement = useMemo(() => {
    const map: Record<string, StatsEquipement> = {};
    const base = (): StatsEquipement => ({
      interventions: 0, pannes: 0, coutTotal: 0, coutPieces: 0, coutMainOeuvre: 0,
      coutPrestation: 0, immobilisationHeures: 0, derniereMaintenance: null,
      prochaineEcheance: null, prochainKm: null, otEnCours: 0,
    });

    equipements.forEach((e) => { map[e.id] = base(); });

    ots.forEach((o) => {
      if (!o.equipement_id) return;
      const s = (map[o.equipement_id] ||= base());
      s.interventions += 1;
      if (o.type_maintenance === 'correctif') s.pannes += 1;
      s.coutTotal += Number(o.cout_total || 0);
      s.coutPieces += Number(o.cout_pieces || 0);
      s.coutMainOeuvre += Number(o.cout_main_oeuvre || 0);
      s.coutPrestation += Number(o.cout_prestation || 0);
      s.immobilisationHeures += Number(o.duree_immobilisation_heures || 0);
      if (!o.cloture) s.otEnCours += 1;
      const d = o.date_fin || o.date_debut || o.date_planifiee;
      if (d && (!s.derniereMaintenance || new Date(d) > new Date(s.derniereMaintenance))) {
        s.derniereMaintenance = d;
      }
    });

    plans.forEach((p) => {
      if (!p.equipement_id || p.actif === false) return;
      const s = (map[p.equipement_id] ||= base());
      if (p.prochaine_echeance && (!s.prochaineEcheance || p.prochaine_echeance < s.prochaineEcheance)) {
        s.prochaineEcheance = p.prochaine_echeance;
      }
      if (p.prochain_km && (!s.prochainKm || p.prochain_km < s.prochainKm)) {
        s.prochainKm = p.prochain_km;
      }
    });

    return map;
  }, [equipements, ots, plans]);

  const alertes = useMemo(() => {
    const liste: AlerteGmao[] = [];
    const maintenant = Date.now();
    const nomEq = (id?: string | null) => {
      const e = equipements.find((x) => x.id === id);
      return e ? (e.immatriculation || e.code) : 'Équipement non renseigné';
    };

    plans.forEach((p) => {
      if (p.actif === false || !p.prochaine_echeance) return;
      const ecart = (new Date(p.prochaine_echeance).getTime() - maintenant) / JOUR;
      if (ecart < 0) {
        liste.push({
          id: `plan-${p.id}`, type: 'preventif_echu', gravite: 'danger',
          titre: `Maintenance préventive échue — ${nomEq(p.equipement_id)}`,
          detail: `${p.libelle} • échéance dépassée de ${Math.abs(Math.round(ecart))} j`,
          section: 'preventif', equipementId: p.equipement_id,
        });
      } else if (ecart <= 15) {
        liste.push({
          id: `plan-${p.id}`, type: 'preventif_proche', gravite: 'alerte',
          titre: `Maintenance à échéance — ${nomEq(p.equipement_id)}`,
          detail: `${p.libelle} • dans ${Math.round(ecart)} j`,
          section: 'preventif', equipementId: p.equipement_id,
        });
      }
    });

    ots.forEach((o) => {
      if (o.cloture) return;
      if (o.date_planifiee && new Date(o.date_planifiee).getTime() < maintenant && o.statut !== 'termine') {
        liste.push({
          id: `ot-${o.id}`, type: 'ot_retard', gravite: 'danger',
          titre: `Intervention en retard — ${o.numero || o.titre}`,
          detail: `${nomEq(o.equipement_id)} • planifiée le ${new Date(o.date_planifiee).toLocaleDateString('fr-FR')}`,
          section: 'interventions', equipementId: o.equipement_id,
        });
      }
      if (o.statut === 'attente_piece') {
        liste.push({
          id: `otp-${o.id}`, type: 'attente_piece', gravite: 'alerte',
          titre: `Intervention en attente de pièce — ${o.numero || o.titre}`,
          detail: nomEq(o.equipement_id), section: 'interventions', equipementId: o.equipement_id,
        });
      }
    });

    equipements.forEach((e) => {
      if (e.statut !== 'en_maintenance' && e.statut !== 'immobilise') return;
      const s = statsParEquipement[e.id];
      const depuis = s?.derniereMaintenance ? (maintenant - new Date(s.derniereMaintenance).getTime()) / JOUR : null;
      if (depuis !== null && depuis > 7) {
        liste.push({
          id: `imm-${e.id}`, type: 'immobilise', gravite: 'alerte',
          titre: `Équipement immobilisé depuis ${Math.round(depuis)} j`,
          detail: `${e.immatriculation || e.code} — ${e.designation}`,
          section: 'equipements', equipementId: e.id,
        });
      }
    });

    pieces.forEach((p) => {
      if (Number(p.quantite_stock) <= Number(p.seuil_mini)) {
        liste.push({
          id: `piece-${p.id}`,
          type: 'stock',
          gravite: Number(p.quantite_stock) === 0 ? 'danger' : 'alerte',
          titre: `${Number(p.quantite_stock) === 0 ? 'Pièce indisponible' : 'Stock sous le seuil'} — ${p.reference}`,
          detail: `${p.designation} • stock ${p.quantite_stock} / seuil ${p.seuil_mini}`,
          section: 'pieces',
        });
      }
    });

    const ordre = { danger: 0, alerte: 1, info: 2 } as const;
    return liste.sort((a, b) => ordre[a.gravite] - ordre[b.gravite]);
  }, [equipements, ots, plans, pieces, statsParEquipement]);

  const equipementParId = useCallback(
    (id?: string | null) => equipements.find((e) => e.id === id),
    [equipements]
  );

  const libelleEquipement = useCallback(
    (id?: string | null) => {
      const e = equipements.find((x) => x.id === id);
      return e ? `${e.immatriculation || e.code}${e.marque ? ` — ${e.marque}` : ''}` : '—';
    },
    [equipements]
  );

  const allerA = useCallback((s: GmaoSection, equipementId?: string) => {
    setSection(s);
    if (equipementId) setEquipementCible(equipementId);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const consommerEquipementCible = useCallback(() => {
    const v = equipementCible;
    setEquipementCible(null);
    return v;
  }, [equipementCible]);

  const value: Ctx = {
    chargement, equipements, ots, demandes, pieces, plans,
    statsParEquipement, alertes, equipementParId, libelleEquipement,
    rafraichir, section, allerA, equipementCible, consommerEquipementCible,
  };

  return <GmaoCtx.Provider value={value}>{children}</GmaoCtx.Provider>;
};
