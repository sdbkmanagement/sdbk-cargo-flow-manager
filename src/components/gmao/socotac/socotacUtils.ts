import type { SocotacControle } from '@/services/socotac';

export type StatutSocotac = 'conforme' | 'proche' | 'urgent' | 'expire';

export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const JOUR = 24 * 60 * 60 * 1000;

export const joursRestants = (dateProchain?: string | null): number | null => {
  if (!dateProchain) return null;
  const d = new Date(`${dateProchain}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / JOUR);
};

export const statutDepuisJours = (j: number | null): StatutSocotac => {
  if (j === null) return 'expire';
  if (j <= 0) return 'expire';
  if (j <= 15) return 'urgent';
  if (j <= 40) return 'proche';
  return 'conforme';
};

export const LIBELLE_STATUT: Record<StatutSocotac, string> = {
  conforme: 'Conforme',
  proche: 'Échéance proche',
  urgent: 'Urgent',
  expire: 'Expiré',
};

export const CLASSE_STATUT: Record<StatutSocotac, string> = {
  conforme: 'bg-success text-success-foreground border-transparent',
  proche: 'bg-info text-info-foreground border-transparent',
  urgent: 'bg-warning text-warning-foreground border-transparent',
  expire: 'bg-destructive text-destructive-foreground border-transparent',
};

export const prochainControle = (dateControle: string): string => {
  const d = new Date(`${dateControle}T00:00:00`);
  const jour = d.getDate();
  const cible = new Date(d.getFullYear(), d.getMonth() + 6, 1);
  const dernierJour = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  cible.setDate(Math.min(jour, dernierJour));
  return cible.toISOString().slice(0, 10);
};

/** Dernier contrôle par ensemble (clé = immatriculation tracteur) */
export const dernierParEquipement = (controles: SocotacControle[]): SocotacControle[] => {
  const map = new Map<string, SocotacControle>();
  controles.forEach((c) => {
    const cle = (c.immatriculation_tracteur || c.equipement_id || c.id).toString().toUpperCase();
    const actuel = map.get(cle);
    if (!actuel || new Date(c.date_controle) > new Date(actuel.date_controle)) map.set(cle, c);
  });
  return Array.from(map.values());
};

export type StatMois = {
  cle: string;
  mois: string;
  total: number;
  acceptes: number;
  rejetes: number;
  tauxAcceptation: number;
  tauxRejet: number;
};

export const statistiquesMensuelles = (controles: SocotacControle[], annee: number): StatMois[] =>
  MOIS_FR.map((mois, index) => {
    const duMois = controles.filter((c) => {
      const d = new Date(`${c.date_controle}T00:00:00`);
      return d.getFullYear() === annee && d.getMonth() === index;
    });
    const acceptes = duMois.filter((c) => c.resultat === 'accepte').length;
    const rejetes = duMois.filter((c) => c.resultat === 'rejete').length;
    const total = duMois.length;
    return {
      cle: `${annee}-${String(index + 1).padStart(2, '0')}`,
      mois,
      total,
      acceptes,
      rejetes,
      tauxAcceptation: total ? Math.round((acceptes / total) * 1000) / 10 : 0,
      tauxRejet: total ? Math.round((rejetes / total) * 1000) / 10 : 0,
    };
  });

export const taux = (partie: number, total: number) =>
  total ? Math.round((partie / total) * 1000) / 10 : 0;

export const anneesDisponibles = (controles: SocotacControle[]): number[] => {
  const set = new Set<number>();
  controles.forEach((c) => {
    const d = new Date(`${c.date_controle}T00:00:00`);
    if (!isNaN(d.getTime())) set.add(d.getFullYear());
  });
  set.add(new Date().getFullYear());
  return Array.from(set).sort((a, b) => b - a);
};

export const normaliserImmat = (v?: string | null) => (v || '').trim().toUpperCase();
