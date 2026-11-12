// Core of the distortion-vs-material demo. Every energy is a function of the two singular values (s1, s2) of a
// 2D deformation gradient / Jacobian. Materials use mu = lambda = 1. Normalizations of ARAP, symmetric ARAP and
// symmetric Dirichlet follow Table 1 of Chen & Barbic (SCA 2026).

const MU = 1, LAM = 1;
const INF = Infinity;
const lg = Math.log;

export const ENERGIES = [
  { id: 'dirichlet', name: 'Dirichlet', kind: 'distortion', f: (a, b) => (a * a + b * b) / 2 },
  { id: 'symdir', name: 'Symmetric Dirichlet', kind: 'distortion', f: (a, b) => (a <= 0 || b <= 0 ? INF : 0.5 * (a * a + 1 / (a * a) + b * b + 1 / (b * b))) },
  { id: 'arap', name: 'ARAP', kind: 'distortion', f: (a, b) => (a - 1) ** 2 + (b - 1) ** 2 },
  { id: 'symarap', name: 'Symmetric ARAP', kind: 'distortion', f: (a, b) => (a <= 0 || b <= 0 ? INF : 0.5 * ((a - 1) ** 2 + (1 - 1 / a) ** 2 + (b - 1) ** 2 + (1 - 1 / b) ** 2)) },
  { id: 'mips', name: 'MIPS (conformal)', kind: 'distortion', f: (a, b) => (a <= 0 || b <= 0 ? INF : a / b + b / a) },
  { id: 'nh', name: 'Neo-Hookean', kind: 'material', f: (a, b) => (a <= 0 || b <= 0 ? INF : (MU / 2) * (a * a + b * b - 2) - MU * lg(a * b) + (LAM / 2) * (a * b - 1) ** 2) },
  { id: 'stvk', name: 'St. Venant–Kirchhoff', kind: 'material', f: (a, b) => { const e1 = (a * a - 1) / 2, e2 = (b * b - 1) / 2; return MU * (e1 * e1 + e2 * e2) + (LAM / 2) * (e1 + e2) ** 2; } },
  { id: 'corot', name: 'Linear Corotational', kind: 'material', f: (a, b) => MU * ((a - 1) ** 2 + (b - 1) ** 2) + (LAM / 2) * (a + b - 2) ** 2 },
  { id: 'hencky', name: 'Hencky', kind: 'material', f: (a, b) => (a <= 0 || b <= 0 ? INF : MU * (lg(a) ** 2 + lg(b) ** 2) + (LAM / 2) * lg(a * b) ** 2) },
];

// The volume term of SCA 2026, Section 5 ("mix and match"): add lambda_v/2 (J - 1)^2 to a distortion measure.
// It has lambda_Lame = lambda_v and mu_Lame = 0, so it adds volume stiffness without touching the shear stiffness.
export const withVolume = (E, lamV = 1) =>
  E.kind === 'distortion' ? { ...E, f: (a, b) => E.f(a, b) + (lamV / 2) * (a * b - 1) ** 2 } : E;

// one-parameter slices through singular-value space
export const SLICES = {
  uniaxial: (s) => [s, 1], // stretch one direction, keep the other
  uniform: (s) => [s, s], // scale both directions equally
};

// Properties at the identity and near zero, by finite differences.
// For a symmetric function psi(s1, s2) that is stress-free at the identity, the small-strain energy is
// mu (e1^2 + e2^2) + lambda/2 (e1 + e2)^2 with psi_11 = 2 mu + lambda and psi_12 = lambda
// (the 2D version of SCA 2026, Eqs. 5-6: lambda = psi_12, mu = (psi_11 - psi_12)/2).
export function properties(E) {
  const f = E.f, h = 1e-4;
  const p0 = f(1, 1);
  const g1 = (f(1 + h, 1) - f(1 - h, 1)) / (2 * h);
  const p11 = (f(1 + h, 1) - 2 * p0 + f(1 - h, 1)) / (h * h);
  const p12 = (f(1 + h, 1 + h) - f(1 + h, 1 - h) - f(1 - h, 1 + h) + f(1 - h, 1 - h)) / (4 * h * h);
  const lam = p12, mu = (p11 - p12) / 2;
  const nu = lam / (lam + 2 * mu); // 2D Poisson ratio
  const stressFree = Math.abs(g1) < 1e-6;
  // symmetric under s -> 1/s (both singular values inverted)?
  const sym = [[2, 1], [3, 0.7], [0.4, 1.5], [1.3, 1.3]].every(([a, b]) => Math.abs(f(a, b) - f(1 / a, 1 / b)) < 1e-9 * Math.max(1, Math.abs(f(a, b))));
  const barrier = !isFinite(f(0, 1)); // infinite when one direction is crushed to zero
  const scaleFree = [0.5, 2, 3].every((s) => Math.abs(f(s, s) - p0) < 1e-12 && Math.abs(f(1.7 * s, s) - f(1.7, 1)) < 1e-12);
  return { p0, g1, p11, p12, mu, lam, nu, stressFree, sym, barrier, scaleFree };
}
