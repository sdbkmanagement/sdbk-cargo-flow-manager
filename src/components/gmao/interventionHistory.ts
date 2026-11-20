export function isInterventionInHistory(ordre: { statut?: string | null; cloture?: boolean | null }) {
  return ordre.cloture === true || ordre.statut === 'cloture';
}
