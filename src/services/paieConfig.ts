import { supabase } from '@/integrations/supabase/client';

export interface ParametresCnss {
  plafond: number;      // Plafond de la base CNSS (0 = pas de plafond)
  tauxSalarial: number; // Ex: 0.05
  tauxPatronal: number; // Ex: 0.18
}

export const PARAMETRES_CNSS_DEFAUT: ParametresCnss = {
  plafond: 2500000,
  tauxSalarial: 0.05,
  tauxPatronal: 0.18,
};

const toNumber = (v: any, fallback: number) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

/** Lit le paramétrage CNSS depuis config_paie (modifiable par l'administrateur). */
export const getParametresCnss = async (): Promise<ParametresCnss> => {
  const { data, error } = await supabase
    .from('config_paie')
    .select('cle, valeur')
    .in('cle', ['plafond_cnss', 'taux_cnss_salarial', 'taux_cnss_patronal']);

  if (error || !data) return PARAMETRES_CNSS_DEFAUT;

  const map: Record<string, string> = {};
  data.forEach((c: any) => { map[c.cle] = c.valeur; });

  return {
    plafond: toNumber(map['plafond_cnss'], PARAMETRES_CNSS_DEFAUT.plafond),
    tauxSalarial: toNumber(map['taux_cnss_salarial'], 5) / 100,
    tauxPatronal: toNumber(map['taux_cnss_patronal'], 18) / 100,
  };
};

export interface CalculCnss {
  baseCnss: number;
  cnssSalarie: number;
  cnssPatronal: number;
}

/** Base CNSS = MIN(brut, plafond) ; cotisations = base x taux. */
export const calculerCnss = (salaireBrut: number, params: ParametresCnss): CalculCnss => {
  const brut = Math.max(0, Number(salaireBrut) || 0);
  const baseCnss = params.plafond > 0 ? Math.min(brut, params.plafond) : brut;
  return {
    baseCnss,
    cnssSalarie: Math.round(baseCnss * params.tauxSalarial),
    cnssPatronal: Math.round(baseCnss * params.tauxPatronal),
  };
};
