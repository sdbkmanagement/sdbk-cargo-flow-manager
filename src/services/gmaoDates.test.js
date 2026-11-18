import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOtDatePayload, toLocalDateInput } from './gmaoDates.js';

test('Démarrer exige une date manuelle et conserve la date choisie', () => {
  assert.throws(() => buildOtDatePayload('start', {}));
  assert.equal(buildOtDatePayload('start', { date_debut: '2026-11-16T08:00:00Z' }).date_debut, '2026-11-16T08:00:00.000Z');
});
test('Terminer exige la date de fin saisie, sans utiliser la date actuelle', () => {
  assert.throws(() => buildOtDatePayload('finish', { date_fin: '' }));
  const payload = buildOtDatePayload('finish', { date_fin: '2026-11-17T14:30:00Z' });
  assert.equal(payload.date_fin, '2026-11-17T14:30:00.000Z');
  assert.equal(payload.statut, 'termine');
});
test('Valider et clôturer exige les deux dates manuelles', () => {
  assert.throws(() => buildOtDatePayload('close', { date_fin: '2026-11-17T14:30:00Z' }));
  assert.throws(() => buildOtDatePayload('close', { date_cloture: '2026-11-18T10:00:00Z' }));
  assert.deepEqual(buildOtDatePayload('close', {
    date_fin: '2026-11-17T14:30:00Z', date_cloture: '2026-11-18T10:00:00Z',
  }, 'Moniteur test'), {
    date_fin: '2026-11-17T14:30:00.000Z', date_cloture: '2026-11-18T10:00:00.000Z',
    statut: 'cloture', cloture: true, cloture_par: 'Moniteur test',
  });
});
test('Les dates invalides sont refusées et les dates absentes ne sont pas préremplies', () => {
  assert.throws(() => buildOtDatePayload('finish', { date_fin: 'invalide' }));
  assert.equal(toLocalDateInput(null), '');
  assert.equal(toLocalDateInput('invalide'), '');
});