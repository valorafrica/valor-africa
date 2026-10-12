// ── Configuration centralisée des pays ──────────────────────────────────────
// Importe ce fichier dans tous tes composants pour éviter la duplication

export const PAYS = [
  { code: "MA",  label: "Maroc",              flag: "🇲🇦", bg: "#C1272D" },
  { code: "CG",  label: "Congo-Brazzaville",  flag: "🇨🇬", bg: "#009A44" },
  { code: "CD",  label: "Congo-Kinshasa",     flag: "🇨🇩", bg: "#007FFF" },
  { code: "GA",  label: "Gabon",              flag: "🇬🇦", bg: "#009E60" },
  { code: "TD",  label: "Tchad",              flag: "🇹🇩", bg: "#002664" },
  { code: "MG",  label: "Madagascar",         flag: "🇲🇬", bg: "#FC3D32" },
  { code: "TZ",  label: "Tanzanie",           flag: "🇹🇿", bg: "#1EB53A" },
  { code: "AO",  label: "Angola",             flag: "🇦🇴", bg: "#CC0000" },
  { code: "ML",  label: "Mali",               flag: "🇲🇱", bg: "#009A00" },
  { code: "GQ",  label: "Guinée Équatoriale", flag: "🇬🇶", bg: "#3E9A00" },
  { code: "NG",  label: "Nigeria",            flag: "🇳🇬", bg: "#008751" },
  { code: "KE",  label: "Kenya",              flag: "🇰🇪", bg: "#006600" },
  { code: "CI",  label: "Côte d'Ivoire",      flag: "🇨🇮", bg: "#F77F00" },
  { code: "TG",  label: "Togo",               flag: "🇹🇬", bg: "#006A4E" },
  { code: "BJ",  label: "Bénin",              flag: "🇧🇯", bg: "#008751" },
] as const;

export type PaysCode = typeof PAYS[number]["code"];

// Map code → infos
export const PAYS_MAP: Record<string, typeof PAYS[number]> = Object.fromEntries(
  PAYS.map(p => [p.code, p])
);

// Normalise n'importe quelle valeur saisie → code officiel
export const toPaysCode = (raw: string): string => {
  if (!raw) return "";
  const val = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    // Maroc
    "ma": "MA", "maroc": "MA", "morocco": "MA",
    // Congo-Brazzaville
    "cg": "CG", "congo": "CG", "congo-brazzaville": "CG", "republic of the congo": "CG",
    // Congo-Kinshasa
    "cd": "CD", "rdc": "CD", "congo-kinshasa": "CD", "drc": "CD", "democratic republic of the congo": "CD",
    // Gabon
    "ga": "GA", "gabon": "GA",
    // Tchad
    "td": "TD", "tchad": "TD", "chad": "TD",
    // Madagascar
    "mg": "MG", "madagascar": "MG",
    // Tanzanie
    "tz": "TZ", "tanzanie": "TZ", "tanzania": "TZ",
    // Angola
    "ao": "AO", "angola": "AO",
    // Mali
    "ml": "ML", "mali": "ML",
    // Guinée Équatoriale
    "gq": "GQ", "guinée équatoriale": "GQ", "guinee equatoriale": "GQ", "equatorial guinea": "GQ",
    // Nigeria
    "ng": "NG", "nigeria": "NG",
    // Kenya
    "ke": "KE", "kenya": "KE",
    // Côte d'Ivoire
    "ci": "CI", "côte d'ivoire": "CI", "cote d'ivoire": "CI", "civ": "CI", "ivory coast": "CI",
    // Togo
    "tg": "TG", "togo": "TG",
    // Bénin
    "bj": "BJ", "bénin": "BJ", "benin": "BJ",
  };
  return map[val] || raw.trim().toUpperCase();
};

export const nomPays = (code: string): string => {
  return PAYS_MAP[toPaysCode(code)]?.label || code;
};