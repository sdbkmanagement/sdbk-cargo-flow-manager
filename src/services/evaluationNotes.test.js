import { expect, test } from 'bun:test';
import { evaluationNotes } from './evaluationNotes';

test('initial and final evaluation notes are stored separately', () => {
  expect(evaluationNotes('40', '85')).toEqual({ note_initiale: 40, note_obtenue: 85 });
});
test('optional notes retain zero and leave empty values unset', () => {
  expect(evaluationNotes('0', '')).toEqual({ note_initiale: 0, note_obtenue: null });
});
test('percentage notes reject out of range input before upload', () => {
  expect(() => evaluationNotes('101', '80')).toThrow();
  expect(() => evaluationNotes('40', '-1')).toThrow();
});