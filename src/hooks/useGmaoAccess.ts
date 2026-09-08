import { useAuth } from '@/contexts/AuthContext';

// Comptes limités à la seule création de demandes d'intervention dans la GMAO
const DEMANDEURS_SEULS = [
  'amadoutidiane.barry@societedbk.com',
  'mamadoumalal.diallo@societedbk.com',
];

export const useGmaoAccess = () => {
  const { user } = useAuth();
  const email = (user?.email || '').trim().toLowerCase();
  const demandeurSeul = DEMANDEURS_SEULS.includes(email);

  return {
    demandeurSeul,
    // Peut effectuer les actions de gestion (OT, stock, plans, équipements…)
    peutGerer: !demandeurSeul,
  };
};
