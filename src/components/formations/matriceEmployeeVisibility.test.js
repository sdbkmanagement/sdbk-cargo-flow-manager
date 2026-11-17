import { expect, test } from 'bun:test';
import { isEmployeeVisibleInMatrix } from './matriceEmployeeVisibility';

test('BAH El Hadj Oumar, chauffeur, is excluded from the employee matrix only', () => {
  expect(isEmployeeVisibleInMatrix({ id: '8bc75965-38fd-48bc-a0b8-5c08749afcbb', nom: 'BAH', prenom: 'El Hadj Oumar', poste: 'CHAUFFEUR' })).toBe(false);
  expect(isEmployeeVisibleInMatrix({ id: 'ef13a02e-9161-459f-9417-cdc471d48106', nom: 'BAH', prenom: 'Oumar Sadjo' })).toBe(true);
  expect(isEmployeeVisibleInMatrix({ id: 'befd47bc-bbef-4793-959b-1734140a1307', nom: 'BAH', prenom: 'Alpha Oumar' })).toBe(true);
});