import { describe, expect, test } from 'bun:test';
import { isInterventionInHistory } from './interventionHistory';

describe('Historique des interventions', () => {
  test('les interventions validées sont dans l’historique', () => {
    expect(isInterventionInHistory({ statut: 'cloture', cloture: true })).toBe(true);
    expect(isInterventionInHistory({ statut: 'cloture', cloture: false })).toBe(true);
    expect(isInterventionInHistory({ statut: 'termine', cloture: true })).toBe(true);
  });
  test('les interventions terminées mais pas encore validées restent dans les ordres de travail', () => {
    expect(isInterventionInHistory({ statut: 'termine', cloture: false })).toBe(false);
  });
  test('les interventions non terminées restent dans les ordres de travail', () => {
    for (const statut of ['a_planifier', 'planifie', 'en_cours', 'attente_piece', 'annule']) {
      expect(isInterventionInHistory({ statut, cloture: false })).toBe(false);
    }
  });
});
