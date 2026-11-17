import { beforeEach, expect, mock, test } from 'bun:test';

const calls = [];
const result = { data: [], error: null };
const query = {};
for (const method of ['select', 'eq', 'order', 'range', 'insert', 'upsert', 'update', 'delete']) {
  query[method] = (...args) => { calls.push({ method, args }); return query; };
}
query.then = (resolve) => resolve(result);
mock.module('@/integrations/supabase/client', () => ({ supabase: { from: () => query } }));
const { matriceFormationService } = await import('./matriceFormationService');
beforeEach(() => { calls.length = 0; });

test('2027 tracking is read independently from 2026', async () => {
  await matriceFormationService.getByCategorie('administration', 2027);
  expect(calls).toContainEqual({ method: 'eq', args: ['annee', 2027] });
});

test('completion upsert includes the selected annual plan', async () => {
  await matriceFormationService.toggleModule('employe', 'person-1', 'administration', 'Power BI', true, 2027);
  const call = calls.find(c => c.method === 'upsert');
  expect(call?.args[0]).toMatchObject({ annee: 2027, module_nom: 'Power BI', completed: true });
  expect(call?.args[1]).toEqual({ onConflict: 'person_id,categorie,module_nom,annee' });
});

test('unchecking a 2027 formation does not remove the 2026 record', async () => {
  await matriceFormationService.toggleModule('employe', 'person-1', 'administration', 'Power BI', false, 2027);
  expect(calls).toContainEqual({ method: 'eq', args: ['annee', 2027] });
});

test('direct creation assigns the formation to the selected year and categories', async () => {
  await matriceFormationService.createModule(2027, ['administration', 'conducteurs'], 'Power BI', 1);
  expect(calls.find(c => c.method === 'insert')?.args[0]).toEqual([
    { annee: 2027, categorie: 'administration', module_nom: 'Power BI', position: 1 },
    { annee: 2027, categorie: 'conducteurs', module_nom: 'Power BI', position: 1 },
  ]);
});

test('removing a column archives it without deleting completion history', async () => {
  await matriceFormationService.setModuleActive('module-1', false);
  expect(calls).toContainEqual({ method: 'update', args: [{ actif: false }] });
  expect(calls.some(c => c.method === 'delete')).toBe(false);
});