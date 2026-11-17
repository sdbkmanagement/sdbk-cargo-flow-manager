export function evaluationNotes(initiale, finale) {
  const parse = (value) => {
    if (value.trim() === '') return null;
    const note = Number(value);
    if (!Number.isFinite(note) || note < 0 || note > 100) {
      throw new Error('Les notes doivent être comprises entre 0 et 100 %.');
    }
    return note;
  };
  return { note_initiale: parse(initiale), note_obtenue: parse(finale) };
}