import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/* ---------- Formatage ---------- */

export const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

export const fmtMontant = (n?: number | null) =>
  `${Math.round(Number(n || 0)).toLocaleString('fr-FR')} GNF`;

export const fmtNombre = (n?: number | null) => Number(n || 0).toLocaleString('fr-FR');

export const moisCle = (d?: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/* ---------- Référentiels ---------- */

export const TYPES_EQUIPEMENT = [
  { value: 'tracteur', label: 'Tracteur' },
  { value: 'remorque', label: 'Remorque' },
  { value: 'autre', label: 'Autre équipement' },
];

export const STATUTS_EQUIPEMENT = [
  { value: 'operationnel', label: 'Disponible' },
  { value: 'en_maintenance', label: 'En maintenance' },
  { value: 'immobilise', label: 'Immobilisé' },
  { value: 'hors_service', label: 'Hors service' },
  { value: 'reforme', label: 'Réformé' },
];

export const TYPES_MAINTENANCE = [
  { value: 'correctif', label: 'Corrective' },
  { value: 'preventif', label: 'Préventive' },
  { value: 'ameliorative', label: 'Curative' },
];

export const STATUTS_OT = [
  { value: 'planifie', label: 'Planifiée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'attente_piece', label: 'En attente pièce' },
  { value: 'termine', label: 'Terminée' },
  { value: 'cloture', label: 'Validée / clôturée' },
];

export const PRIORITES = [
  { value: 'basse', label: 'Basse' },
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'urgente', label: 'Urgente' },
];

export const libelle = (liste: { value: string; label: string }[], v?: string | null) =>
  liste.find((x) => x.value === v)?.label || v || '—';

/* ---------- Badges ---------- */

const classeStatutEquipement = (statut?: string | null) => {
  switch (statut) {
    case 'operationnel':
      return 'bg-success text-success-foreground border-transparent';
    case 'en_maintenance':
      return 'bg-warning text-warning-foreground border-transparent';
    case 'immobilise':
      return 'bg-destructive text-destructive-foreground border-transparent';
    case 'preventif':
      return 'bg-info text-info-foreground border-transparent';
    case 'hors_service':
    case 'reforme':
      return 'bg-muted-foreground text-background border-transparent';
    default:
      return 'bg-secondary text-secondary-foreground border-transparent';
  }
};

export const BadgeStatutEquipement: React.FC<{ statut?: string | null; className?: string }> = ({ statut, className }) => (
  <Badge className={cn('whitespace-nowrap font-medium', classeStatutEquipement(statut), className)}>
    {libelle(STATUTS_EQUIPEMENT, statut) || 'Non défini'}
  </Badge>
);

export const BadgeTypeEquipement: React.FC<{ type?: string | null }> = ({ type }) => (
  <Badge
    variant="outline"
    className={cn(
      'whitespace-nowrap font-medium',
      type === 'tracteur'
        ? 'border-primary/40 bg-primary/10 text-primary'
        : type === 'remorque'
          ? 'border-info/40 bg-info/10 text-info'
          : 'border-border bg-muted text-muted-foreground'
    )}
  >
    {libelle(TYPES_EQUIPEMENT, type)}
  </Badge>
);

const classeStatutOt = (statut?: string | null, cloture?: boolean) => {
  if (cloture) return 'bg-success text-success-foreground border-transparent';
  switch (statut) {
    case 'en_cours':
      return 'bg-info text-info-foreground border-transparent';
    case 'attente_piece':
      return 'bg-warning text-warning-foreground border-transparent';
    case 'termine':
      return 'bg-primary text-primary-foreground border-transparent';
    default:
      return 'bg-secondary text-secondary-foreground border-transparent';
  }
};

export const BadgeStatutOt: React.FC<{ statut?: string | null; cloture?: boolean }> = ({ statut, cloture }) => (
  <Badge className={cn('whitespace-nowrap font-medium', classeStatutOt(statut, cloture))}>
    {cloture ? 'Validée' : libelle(STATUTS_OT, statut)}
  </Badge>
);

export const BadgePriorite: React.FC<{ priorite?: string | null }> = ({ priorite }) => (
  <Badge
    variant="outline"
    className={cn(
      'whitespace-nowrap font-medium',
      priorite === 'urgente'
        ? 'border-destructive/40 bg-destructive/10 text-destructive'
        : priorite === 'haute'
          ? 'border-warning/40 bg-warning/10 text-warning'
          : 'border-border bg-muted text-muted-foreground'
    )}
  >
    {libelle(PRIORITES, priorite)}
  </Badge>
);

/* ---------- Carte KPI ---------- */

type Ton = 'neutre' | 'succes' | 'alerte' | 'danger' | 'info';

const tons: Record<Ton, string> = {
  neutre: 'bg-primary/10 text-primary',
  succes: 'bg-success/10 text-success',
  alerte: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

export const KpiCard: React.FC<{
  label: string;
  valeur: React.ReactNode;
  icon: LucideIcon;
  ton?: Ton;
  detail?: string;
  onClick?: () => void;
}> = ({ label, valeur, icon: Icon, ton = 'neutre', detail, onClick }) => (
  <Card
    onClick={onClick}
    className={cn(
      'border-border/60 transition-all',
      onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-md'
    )}
  >
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-tight">{valeur}</p>
          {detail && <p className="mt-1 text-xs text-muted-foreground truncate">{detail}</p>}
        </div>
        <div className={cn('shrink-0 rounded-xl p-2.5', tons[ton])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ---------- Bloc vide ---------- */

export const EtatVide: React.FC<{ message: string; colSpan?: number }> = ({ message }) => (
  <div className="py-10 text-center text-sm text-muted-foreground">{message}</div>
);
