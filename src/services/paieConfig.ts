import { supabase } from '@/integrations/supabase/client';

export interface ParametresCnss {
  plafond: number;      // Plafond de la base CNSS (0 = pas de plafond)
  tauxSalarial: number; // Ex: 0.05
  tauxPatronal: number; // Ex: 0.18
}

export interface TrancheRts {
  plafond: number | null; // Limite haute de la tranche (null = illimitée)
  taux: number;           // Taux en % (ex: 5)
}

export interface ParametresPaie {
  cnss: ParametresCnss;
  baremeRts: TrancheRts[];
  tauxOnfpp: number;    // Ex: 0.015
  tauxVf: number;       // Ex: 0.06
  abattementVf: number; // Ex: 150000
}

export const PARAMETRES_CNSS_DEFAUT: ParametresCnss = {
  plafond: 2500000,
  tauxSalarial: 0.05,
  tauxPatronal: 0.18,
};

export const BAREME_RTS_DEFAUT: TrancheRts[] = [
  { plafond: 1000000, taux: 0 },
  { plafond: 3000000, taux: 5 },
  { plafond: 5000000, taux: 8 },
  { plafond: 10000000, taux: 10 },
  { plafond: 20000000, taux: 15 },
  { plafond: null, taux: 20 },
];

export const PARAMETRES_PAIE_DEFAUT: ParametresPaie = {
  cnss: PARAMETRES_CNSS_DEFAUT,
  baremeRts: BAREME_RTS_DEFAUT,
  tauxOnfpp: 0.015,
  tauxVf: 0.06,
  abattementVf: 150000,
};

const toNumber = (v: any, fallback: number) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

const lireConfig = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from('config_paie')
    .select('cle, valeur')
    .in('cle', ['plafond_cnss', 'taux_cnss_salarial', 'taux_cnss_patronal', 'taux_onfpp', 'taux_vf', 'abattement_vf', 'bareme_rts']);

  const map: Record<string, string> = {};
  if (!error && data) data.forEach((c: any) => { map[c.cle] = c.valeur; });
  return map;
};

/** Lit le paramétrage CNSS depuis config_paie (modifiable par l'administrateur). */
export const getParametresCnss = async (): Promise<ParametresCnss> => {
  const map = await lireConfig();
  if (!Object.keys(map).length) return PARAMETRES_CNSS_DEFAUT;
  return {
    plafond: toNumber(map['plafond_cnss'], PARAMETRES_CNSS_DEFAUT.plafond),
    tauxSalarial: toNumber(map['taux_cnss_salarial'], 5) / 100,
    tauxPatronal: toNumber(map['taux_cnss_patronal'], 18) / 100,
  };
};

/** Lit l'ensemble du paramétrage de paie (CNSS, barème RTS, ONFPP, versement forfaitaire). */
export const getParametresPaie = async (): Promise<ParametresPaie> => {
  const map = await lireConfig();

  let bareme = BAREME_RTS_DEFAUT;
  if (map['bareme_rts']) {
    try {
      const parsed = JSON.parse(map['bareme_rts']);
      if (Array.isArray(parsed) && parsed.length) {
        bareme = parsed.map((t: any) => ({
          plafond: t.plafond === null || t.plafond === undefined ? null : Number(t.plafond),
          taux: Number(t.taux) || 0,
        }));
      }
    } catch { /* barème par défaut */ }
  }

  return {
    cnss: {
      plafond: toNumber(map['plafond_cnss'], PARAMETRES_CNSS_DEFAUT.plafond),
      tauxSalarial: toNumber(map['taux_cnss_salarial'], 5) / 100,
      tauxPatronal: toNumber(map['taux_cnss_patronal'], 18) / 100,
    },
    baremeRts: bareme,
    tauxOnfpp: toNumber(map['taux_onfpp'], 1.5) / 100,
    tauxVf: toNumber(map['taux_vf'], 6) / 100,
    abattementVf: toNumber(map['abattement_vf'], 150000),
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

/** RTS progressif par tranches sur la base imposable. */
export const calculerRts = (baseImposable: number, bareme: TrancheRts[] = BAREME_RTS_DEFAUT): number => {
  let reste = Math.max(0, Number(baseImposable) || 0);
  let precedent = 0;
  let total = 0;
  for (const tranche of bareme) {
    const plafond = tranche.plafond ?? Infinity;
    const largeur = plafond - precedent;
    const montant = Math.min(reste, largeur);
    if (montant <= 0) break;
    total += montant * (tranche.taux / 100);
    reste -= montant;
    precedent = plafond;
  }
  return Math.round(total);
};

export interface EntreeBulletin {
  salaireBase: number;
  primeTransport?: number;
  primeLogement?: number;
  primeChereteVie?: number;
  autresPrimes?: number;
  avanceSalaire?: number;
  manquant?: number;
  complementMoisPrecedent?: number;
  retenuePret?: number;
}

export interface ResultatBulletin {
  salaireBase: number;
  totalPrimes: number;
  salaireBrut: number;
  baseCnss: number;
  cnssSalarie: number;
  cnssPatronal: number;
  baseRts: number;
  rts: number;
  onfpp: number;
  versementForfaitaire: number;
  totalChargesPatronales: number;
  totalRetenues: number;
  netAPayer: number;
}

/**
 * Calcul complet d'un bulletin selon les règles guinéennes :
 * CNSS plafonnée, RTS progressif sur (salaire de base − CNSS salarié),
 * ONFPP et versement forfaitaire à la charge de l'employeur.
 */
export const calculerBulletin = (entree: EntreeBulletin, params: ParametresPaie): ResultatBulletin => {
  const salaireBase = Math.max(0, Number(entree.salaireBase) || 0);
  const totalPrimes =
    (Number(entree.primeTransport) || 0) +
    (Number(entree.primeLogement) || 0) +
    (Number(entree.primeChereteVie) || 0) +
    (Number(entree.autresPrimes) || 0);
  const salaireBrut = salaireBase + totalPrimes;

  const { baseCnss, cnssSalarie, cnssPatronal } = calculerCnss(salaireBrut, params.cnss);
  const baseRts = Math.max(0, salaireBase - cnssSalarie);
  const rts = calculerRts(baseRts, params.baremeRts);

  const onfpp = Math.round(salaireBrut * params.tauxOnfpp);
  const versementForfaitaire = Math.round(Math.max(0, salaireBrut - params.abattementVf) * params.tauxVf);

  const avance = Number(entree.avanceSalaire) || 0;
  const manquant = Number(entree.manquant) || 0;
  const complement = Number(entree.complementMoisPrecedent) || 0;
  const retenuePret = Number(entree.retenuePret) || 0;

  const totalRetenues = cnssSalarie + rts + avance + manquant + retenuePret;
  const netAPayer = salaireBrut - totalRetenues + complement;

  return {
    salaireBase,
    totalPrimes,
    salaireBrut,
    baseCnss,
    cnssSalarie,
    cnssPatronal,
    baseRts,
    rts,
    onfpp,
    versementForfaitaire,
    totalChargesPatronales: cnssPatronal + onfpp + versementForfaitaire,
    totalRetenues,
    netAPayer,
  };
};
