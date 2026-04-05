// Generates the full ordered pledge class sequence.
// 24 single-letter (Alpha–Omega) + 576 double-letter (Alpha Alpha → Omega Omega) = 600 total.
// Used in signup form dropdowns and profile editing.

const GREEK_LETTERS = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Epsilon",
  "Zeta",
  "Eta",
  "Theta",
  "Iota",
  "Kappa",
  "Lambda",
  "Mu",
  "Nu",
  "Xi",
  "Omicron",
  "Pi",
  "Rho",
  "Sigma",
  "Tau",
  "Upsilon",
  "Phi",
  "Chi",
  "Psi",
  "Omega",
] as const;

export type GreekLetter = (typeof GREEK_LETTERS)[number];

export function generatePledgeClasses(): string[] {
  const classes: string[] = [];

  // Single-letter classes: Alpha through Omega (24)
  for (const letter of GREEK_LETTERS) {
    classes.push(letter);
  }

  // Double-letter classes: Alpha Alpha through Omega Omega (24 × 24 = 576)
  for (const prefix of GREEK_LETTERS) {
    for (const suffix of GREEK_LETTERS) {
      classes.push(`${prefix} ${suffix}`);
    }
  }

  return classes;
}

// Pre-computed at module load — import this constant, don't call the function repeatedly.
export const PLEDGE_CLASSES: readonly string[] = generatePledgeClasses();
