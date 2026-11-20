import { describe, expect, test } from 'bun:test';
import { isInterventionInHistory } from './interventionHistory';

describe('Historique des interventions', () => {
  test('les interventions terminées sont dans l’historique avant validation', () => {
    expect(isInterventionInHistory({ statut: 'termine', cloture: false })).toBe(true);
  });
  test('les interventions validées et clôturées restent dans l’historique', () => {
    expect(isInterventionInHistory({ statut: 'termine', cloture: true })).toBe(true);
    expect(isInterventionInHistory({ statut: 'cloture', cloture: false })).toBe(true);
  });
  test('les interventions non terminées restent dans les ordres de travail', () => {
    for (const statut of ['a_planifier', 'planifie', 'en_cours', 'attente_piece', 'annule']) {
      expect(isInterventionInHistory({ statut, cloture: false })).toBe(false);
    }
  });
});