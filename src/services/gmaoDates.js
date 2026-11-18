export function buildOtDatePayload(action, dates, validator = null) {
  const required = action === 'start' ? ['date_debut'] : action === 'finish' ? ['date_fin'] : ['date_fin', 'date_cloture'];
  const payload = {};
  for (const field of required) {
    if (!dates[field] || !Number.isFinite(new Date(dates[field]).getTime())) {
      throw new Error('Veuillez saisir les dates et heures obligatoires.');
    }
    payload[field] = new Date(dates[field]).toISOString();
  }
  return {
    ...payload,
    statut: action === 'start' ? 'en_cours' : action === 'finish' ? 'termine' : 'cloture',
    ...(action === 'close' ? { cloture: true, cloture_par: validator } : {}),
  };
}

export function toLocalDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}