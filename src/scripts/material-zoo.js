// Core of the "material zoo" note: the materials of Table 1 in
//   H. Chen and J. Barbič, "Weak Nonlinearity and Linear Equalization for Isotropic Hyperelastic Materials",
//   Computer Graphics Forum 45(8) (Proc. SCA 2026),
// written as functions of the (signed) principal stretches l1, l2, l3, exactly as in the table.
// Each material is "equalized" (Section 3.1 of the paper): its native parameters are chosen so that its Lamé parameters
// (read off the quadratic truncation, Eqs. 5-6) equal the requested (lamL, muL). Materials whose λ_Lamé is fixed by
// construction (no volume term) only match μ_Lamé, and report their own λ_Lamé.

const ln = Math.log;
const J3 = (a, b, c) => a * b * c;
const S = (f, a, b, c) => f(a) + f(b) + f(c);
const nanIfNonPos = (x, v) => (x > 0 ? v : NaN);

// Seth-Hill(alpha) with Lamé (lam, mu); alpha = 0 is the Hencky limit.
export function sethHill(alpha, lam, mu) {
  if (Math.abs(alpha) < 1e-12) return (a, b, c) => nanIfNonPos(Math.min(a, b, c), mu * S((x) => ln(x) ** 2, a, b, c) + lam / 2 * ln(J3(a, b, c)) ** 2);
  // integer alpha: the formula is a polynomial and also defined for negative (inverted) stretches
  const pw = Number.isInteger(alpha) ? (x) => x ** alpha : (x) => (x > 0 ? x ** alpha : NaN);
  return (a, b, c) => mu / alpha ** 2 * S((x) => (pw(x) - 1) ** 2, a, b, c) + lam / (2 * alpha ** 2) * (-3 + S(pw, a, b, c)) ** 2;
}

const DEN = (nu) => 11 * nu * nu - 18 * nu + 15; // Δ(ν) in the table caption

// Each entry: id, name, group, cite, make(lamL, muL) -> { psi, lamL, muL, note? }, scien(nu), ri(nu)
// (scien/ri: the table's closed forms, in terms of the material's own Poisson ratio ν).
export const MATERIALS = [
  {
    id: 'sh3', name: 'Seth-Hill, α = 3', group: 'Seth-Hill family', cite: 'Set64',
    make: (l, m) => ({ psi: sethHill(3, l, m), lamL: l, muL: m }), scien: () => 3, ri: () => 0,
  },
  {
    id: 'lc', name: 'Linear Corotational (S.H. α = 1)', group: 'Seth-Hill family', cite: '',
    make: (l, m) => ({ psi: (a, b, c) => m * S((x) => (x - 1) ** 2, a, b, c) + l / 2 * (-3 + a + b + c) ** 2, lamL: l, muL: m }),
    scien: () => 1, ri: () => 0,
  },
  {
    id: 'stvk', name: 'St. Venant-Kirchhoff (S.H. α = 2)', group: 'Seth-Hill family', cite: '',
    make: (l, m) => ({ psi: (a, b, c) => m / 4 * S((x) => (x * x - 1) ** 2, a, b, c) + l / 8 * (-3 + a * a + b * b + c * c) ** 2, lamL: l, muL: m }),
    scien: () => 2, ri: () => 0,
  },
  {
    id: 'hencky', name: 'Hencky (S.H. α = 0)', group: 'Seth-Hill family', cite: '',
    make: (l, m) => ({ psi: sethHill(0, l, m), lamL: l, muL: m }), scien: () => 0, ri: () => 0,
  },
  {
    id: 'symsh1', name: 'Symmetric Seth-Hill, α = 1', group: 'Seth-Hill family', cite: 'Baz98',
    make: (l, m) => ({
      psi: (a, b, c) => { const g = (x) => x - 1 / x; return m / 4 * S((x) => g(x) ** 2, a, b, c) + l / 8 * (g(a) + g(b) + g(c)) ** 2; },
      lamL: l, muL: m,
    }),
    scien: () => 0, ri: () => 0,
  },
  {
    id: 'vclc', name: 'Volume-corrected Linear Corot.', group: 'Seth-Hill family', cite: '',
    make: (l, m) => ({ psi: (a, b, c) => { const J = J3(a, b, c); return nanIfNonPos(J, m * S((x) => (x - 1) ** 2, a, b, c) + l / 2 * ln(J) ** 2); }, lamL: l, muL: m }),
    scien: (nu) => 3 * (1 - 2 * nu) * (5 - 3 * nu) / DEN(nu), ri: (nu) => 2 * Math.sqrt(21) * nu * (1 - 2 * nu) / DEN(nu),
  },
  {
    id: 'vcstvk', name: 'Volume-corrected StVK', group: 'Seth-Hill family', cite: '',
    make: (l, m) => ({ psi: (a, b, c) => { const J = J3(a, b, c); return nanIfNonPos(J, m / 4 * S((x) => (x * x - 1) ** 2, a, b, c) + l / 2 * ln(J) ** 2); }, lamL: l, muL: m }),
    scien: (nu) => 6 * (1 - 2 * nu) * (5 - 3 * nu) / DEN(nu), ri: (nu) => 4 * Math.sqrt(21) * nu * (1 - 2 * nu) / DEN(nu),
  },
  {
    id: 'nh', name: 'Neo-Hookean (standard)', group: 'Neo-Hookean family', cite: '',
    make: (l, m) => ({ psi: (a, b, c) => { const J = J3(a, b, c); return nanIfNonPos(J, m / 2 * (-3 + a * a + b * b + c * c) - m * ln(J) + l / 2 * ln(J) ** 2); }, lamL: l, muL: m }),
    scien: (nu) => 2 * (6 * nu * nu - 13 * nu + 5) / DEN(nu), ri: (nu) => 4 * Math.sqrt(21) * Math.abs(nu * (1 - 2 * nu)) / (3 * DEN(nu)),
  },
  {
    id: 'nhogden', name: 'Neo-Hookean (Ogden)', group: 'Neo-Hookean family', cite: '',
    make: (l, m) => ({ psi: (a, b, c) => { const J = J3(a, b, c); return nanIfNonPos(J, m / 2 * (-3 + a * a + b * b + c * c) - m * ln(J) + l / 2 * (J - 1) ** 2); }, lamL: l, muL: m }),
    scien: (nu) => (9 * nu * nu + 7 * nu + 10) / DEN(nu), ri: (nu) => 2 * Math.abs(nu) * Math.sqrt(1641 * nu * nu - 2838 * nu + 1434) / (3 * DEN(nu)),
  },
  {
    id: 'snh', name: 'Stable Neo-Hookean', group: 'Neo-Hookean family', cite: 'SGK18',
    // native λ = λ_Lamé + μ_Lamé, since the table gives λ_Lamé = λ − μ
    make: (l, m) => { const lam = l + m; return { psi: (a, b, c) => { const J = J3(a, b, c); return m / 2 * (-3 + a * a + b * b + c * c) - m * (J - 1) + lam / 2 * (J - 1) ** 2; }, lamL: l, muL: m, native: `λ = ${(lam).toFixed(3)}` }; },
    scien: (nu) => (11 * nu * nu - 16 * nu + 21) / DEN(nu), ri: (nu) => 2 * Math.sqrt(3) * Math.sqrt(11 * nu ** 4 + 4 * nu ** 3 + 53 * nu ** 2 - 114 * nu + 78) / (3 * DEN(nu)),
  },
  {
    id: 'sts', name: 'STS (μ₄ = μ)', group: 'Neo-Hookean family', cite: 'PRWH*18',
    make: (l, m) => ({ psi: (a, b, c) => { const J = J3(a, b, c); return nanIfNonPos(J, m / 2 * (-3 + a * a + b * b + c * c) - m * ln(J) + l / 2 * ln(J) ** 2 + m / 8 * S((x) => (x * x - 1) ** 4, a, b, c)); }, lamL: l, muL: m }),
    scien: (nu) => 2 * (6 * nu * nu - 13 * nu + 5) / DEN(nu), ri: (nu) => 4 * Math.sqrt(21) * Math.abs(nu * (1 - 2 * nu)) / (3 * DEN(nu)),
  },
  {
    id: 'vl', name: 'Valanis-Landel (original)', group: 'Valanis-Landel family', cite: 'VL67',
    make: (l, m) => ({ psi: (a, b, c) => { const J = J3(a, b, c); return nanIfNonPos(Math.min(a, b, c), 2 * m * S((x) => x * (ln(x) - 1) + 1, a, b, c) + l / 2 * ln(J) ** 2); }, lamL: l, muL: m }),
    scien: (nu) => 2 * (6 * nu * nu - 13 * nu + 5) / DEN(nu), ri: (nu) => 4 * Math.sqrt(21) * Math.abs(nu * (1 - 2 * nu)) / (3 * DEN(nu)),
  },
  {
    id: 'pl', name: 'Peng-Landel', group: 'Valanis-Landel family', cite: 'PL72', fixedLam: 0,
    make: (l, m) => { const E = 3 * m; return { psi: (a, b, c) => nanIfNonPos(Math.min(a, b, c), E * S((x) => { const L = ln(x); return x - 1 - L - L * L / 6 + L ** 3 / 18 - L ** 4 / 216; }, a, b, c)), lamL: 0, muL: m, native: `E = ${E.toFixed(3)}` }; },
    scien: () => 2 / 3, ri: () => 0,
  },
  {
    id: 'arap', name: 'ARAP (scaled by μ)', group: 'Geometric models', cite: 'SA07', fixedLam: 0,
    make: (l, m) => ({ psi: (a, b, c) => m * S((x) => (x - 1) ** 2, a, b, c), lamL: 0, muL: m }), scien: () => 1, ri: () => 0,
  },
  {
    id: 'symarap', name: 'Symmetric ARAP', group: 'Geometric models', cite: 'SPSH*17', fixedLam: 0,
    make: (l, m) => ({ psi: (a, b, c) => m / 2 * S((x) => (x - 1) ** 2 + (1 - 1 / x) ** 2, a, b, c), lamL: 0, muL: m }), scien: () => 0, ri: () => 0,
  },
  {
    id: 'symdir', name: 'Symmetric Dirichlet (scaled by μ/2)', group: 'Geometric models', cite: 'SS15', fixedLam: 0,
    make: (l, m) => ({ psi: (a, b, c) => m / 2 * 0.5 * S((x) => (x - 1 / x) ** 2, a, b, c), lamL: 0, muL: m }), scien: () => 0, ri: () => 0,
  },
  {
    id: 'ogden', name: 'Ogden, two terms (α = 2, −2; Σμₚ = 0)', group: 'Series models', cite: 'Ogd72', fixedLam: 0,
    // mu_p = (c, -c), alpha_p = (2, -2): μ_Lamé = Σ μp(αp−1)/2 = 2c, so c = μ/2. Σ μp = 0 keeps the rest state stress-free.
    make: (l, m) => { const c = m / 2; return { psi: (a, b, c3) => nanIfNonPos(Math.min(a, b, c3), c / 2 * (-3 + a * a + b * b + c3 * c3) + c / 2 * (-3 + a ** -2 + b ** -2 + c3 ** -2)), lamL: 0, muL: m, native: `μ₁ = −μ₂ = ${c.toFixed(3)}` }; },
    scien: () => 1 + (1 * 0 * 0.5 + (-1) * (-3) * (-4) * 0.5) / (3 * (1 * 1 * 0.5 + (-1) * (-3) * 0.5)), ri: () => 0,
  },
  {
    id: 'mr', name: 'Mooney-Rivlin (C₂ = C₁/3)', group: 'Series models', cite: 'RWLC24', fixedLam: 'mr',
    // μ_Lamé = 2(C1 + C2); λ_Lamé = −4(C1 + C2)/3 (no volume term: zero bulk modulus)
    make: (l, m) => {
      const s = m / 2, C1 = 0.75 * s, C2 = 0.25 * s;
      return {
        psi: (a, b, c) => { const J = J3(a, b, c); if (!(J > 0)) return NaN; return C1 * (-3 + J ** (-2 / 3) * (a * a + b * b + c * c)) + C2 * (-3 + J ** (-4 / 3) * (a * a * b * b + b * b * c * c + c * c * a * a)); },
        lamL: -2 * m / 3, muL: m, native: `C₁ = ${C1.toFixed(3)}, C₂ = ${C2.toFixed(3)}`,
      };
    },
    scien: () => 2 * (0.75 - 0.25) / (11 * 1), ri: () => 4 * Math.sqrt(6) / 33 * 0.5,
  },
];

// ---- derivatives at the rest shape by finite differences (accurate to ~1e-6 relative for these smooth energies) ----
export function restDerivs(psi, h = 2e-3) {
  const f = (x, y, z) => psi(1 + x, 1 + y, 1 + z);
  const d1 = (f(h, 0, 0) - f(-h, 0, 0)) / (2 * h);
  const d11 = (f(h, 0, 0) - 2 * f(0, 0, 0) + f(-h, 0, 0)) / (h * h);
  const d12 = (f(h, h, 0) - f(h, -h, 0) - f(-h, h, 0) + f(-h, -h, 0)) / (4 * h * h);
  const d111 = (f(2 * h, 0, 0) - 2 * f(h, 0, 0) + 2 * f(-h, 0, 0) - f(-2 * h, 0, 0)) / (2 * h ** 3);
  // ψ112 = ∂_1 ∂_2² ψ
  const g = (x) => (f(x, h, 0) - 2 * f(x, 0, 0) + f(x, -h, 0)) / (h * h);
  const d112 = (g(h) - g(-h)) / (2 * h);
  let d123 = 0;
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) d123 += sx * sy * sz * f(sx * h, sy * h, sz * h);
  d123 /= 8 * h ** 3;
  return { psi0: f(0, 0, 0), d1, d11, d12, d111, d112, d123 };
}

export const lameFromDerivs = (d) => ({ lamL: d.d12, muL: (d.d11 - d.d12) / 2 }); // Eqs. 5-6
export const nuOf = (l, m) => l / (2 * (l + m)); // Eq. 14

// Eq. 36: SCIEN from rest derivatives
export function scien(d) {
  const a = d.d11, b = d.d12;
  return 1 + ((15 * a + 6 * b) * d.d111 + (18 * a + 24 * b) * d.d112) / (45 * a * a + 24 * b * b + 36 * a * b);
}
// Eq. 24 / 26 / 27: distance between two linearization-matched materials, from their third derivatives
export const Dthird = (h111, h112, h123) => 1.25 * h111 * h111 + 6 * h112 * h112 + h123 * h123 + 3 * h111 * h112;
export const Dref = (a, b) => 45 / 4 * a * a + 6 * b * b + 9 * a * b; // Eq. 26: D(LC, StVK)
export function distance(d1, d2) {
  return Math.sqrt(Dthird(d1.d111 - d2.d111, d1.d112 - d2.d112, d1.d123 - d2.d123) / Dref(d1.d11, d1.d12));
}
// Eq. 40: Residual Index = distance to the Seth-Hill material with alpha = SCIEN and the same Lamé parameters
export function residualIndex(d) {
  const { lamL, muL } = lameFromDerivs(d);
  return distance(d, restDerivs(sethHill(scien(d), lamL, muL)));
}

// Lamé parameters from Young's modulus and Poisson ratio (Eq. 15)
export const lameFromENu = (E, nu) => ({ lamL: E * nu / ((1 + nu) * (1 - 2 * nu)), muL: E / (2 * (1 + nu)) });

// Deformation paths through stretch space, parameterized by s (s = 1 is the rest shape)
export const PATHS = {
  uniaxial: { name: 'uniaxial stretch (s, 1, 1)', f: (s) => [s, 1, 1], lo: -0.6, hi: 2.4 },
  uniform: { name: 'uniform scaling (s, s, s)', f: (s) => [s, s, s], lo: 0.05, hi: 1.8 },
  isochoric: { name: 'volume-preserving stretch (s, 1/s, 1)', f: (s) => [s, 1 / s, 1], lo: 0.25, hi: 2.4 },
};
