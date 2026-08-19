import type { ControleAnnuel } from '@/services/controlesAnnuels';

export type StatutAnnuel = 'conforme' | 'proche' | 'urgent' | 'expire';

/** Seuils propres au contrôle annuel : 60 j (proche) et 30 j (urgent) */
export const SEUIL_PROCHE = 60;
export const SEUIL_URGENT = 30;

export const statutAnnuel = (j: number | null): StatutAnnuel => {
  if (j === null) return 'expire';
  if (j <= 0) return 'expire';
  if (j <= SEUIL_URGENT) return 'urgent';
  if (j <= SEUIL_PROCHE) return 'proche';
  return 'conforme';
};

export const LIBELLE_STATUT_ANNUEL: Record<StatutAnnuel, string> = {
  conforme: 'Conforme',
  proche: 'Échéance proche',
  urgent: 'Urgent',
  expire: 'Expiré',
};

export const CLASSE_STATUT_ANNUEL: Record<StatutAnnuel, string> = {
  conforme: 'bg-success text-success-foreground border-transparent',
  proche: 'bg-info text-info-foreground border-transparent',
  urgent: 'bg-warning text-warning-foreground border-transparent',
  expire: 'bg-destructive text-destructive-foreground border-transparent',
};

/** Prochaine échéance = date du contrôle + 12 mois */
export const prochainControleAnnuel = (dateControle: string): string => {
  const d = new Date(`${dateControle}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const jour = d.getDate();
  const cible = new Date(d.getFullYear() + 1, d.getMonth(), 1);
  const dernierJour = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  cible.setDate(Math.min(jour, dernierJour));
  return `${cible.getFullYear()}-${String(cible.getMonth() + 1).padStart(2, '0')}-${String(cible.getDate()).padStart(2, '0')}`;
};

/** Dernier contrôle annuel par ensemble (clé = immatriculation tracteur) */
export const dernierAnnuelParEquipement = (controles: ControleAnnuel[]): ControleAnnuel[] => {
  const map = new Map<string, ControleAnnuel>();
  controles.forEach((c) => {
    const cle = (c.immatriculation_tracteur || c.equipement_id || c.id).toString().toUpperCase();
    const actuel = map.get(cle);
    if (!actuel || new Date(c.date_controle) > new Date(actuel.date_controle)) map.set(cle, c);
  });
  return Array.from(map.values());
};
