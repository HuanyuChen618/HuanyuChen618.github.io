// Removable singularities, numerically. Each case has: a naive formula, its Taylor series (as coefficients in
// the variable that goes to zero), and, where one exists, an algebraically stable rewrite.
// The reference value is the Taylor series summed to many terms, which is accurate for the plotted range.

const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

// coef(k): coefficient of the k-th kept term; pow: the power of h in that term is step*k.
export const CASES = [
  {
    id: 'cosine',
    label: '(1 − cos x) / x²',
    limit: '1/2',
    naive: (x) => (1 - Math.cos(x)) / (x * x),
    stable: (x) => { const s = Math.sin(x / 2) / (x / 2); return 0.5 * s * s; },
    stableLabel: '½ (sin(x/2) / (x/2))²',
    coef: (k) => ((k % 2 ? -1 : 1)) / fact(2 * k + 2),
    step: 2,
    h: (x) => x,
    xmin: 1e-9, xmax: 1,
  },
  {
    id: 'sine3',
    label: '(x − sin x) / x³',
    limit: '1/6',
    naive: (x) => (x - Math.sin(x)) / (x * x * x),
    stable: null,
    coef: (k) => ((k % 2 ? -1 : 1)) / fact(2 * k + 3),
    step: 2,
    h: (x) => x,
    xmin: 1e-6, xmax: 1,
  },
  {
    id: 'expm1',
    label: '(eˣ − 1) / x',
    limit: '1',
    naive: (x) => (Math.exp(x) - 1) / x,
    stable: (x) => Math.expm1(x) / x,
    stableLabel: 'expm1(x) / x',
    coef: (k) => 1 / fact(k + 1),
    step: 1,
    h: (x) => x,
    xmin: 1e-12, xmax: 1,
  },
  {
    id: 'logratio',
    label: 'log(x) / (x − 1),  near x = 1',
    limit: '1',
    // plotted against y = x − 1
    naive: (y) => { const x = 1 + y; return Math.log(x) / (x - 1); },
    stable: (y) => Math.log1p(y) / y,
    stableLabel: 'log1p(y) / y,  y = x − 1',
    coef: (k) => ((k % 2 ? -1 : 1)) / (k + 1),
    step: 1,
    h: (y) => y,
    xmin: 1e-12, xmax: 0.5,
  },
];

// ---- Cases from my papers: divided differences of an isotropic energy's derivatives at equal stretches. ----
// x is d = lambda1 - lambda2 (lambda2 = 1.1, rho = 0.9 fixed), for a test material whose derivatives and
// 50-digit reference values are generated in removable-singularities-papers.js.
import { d as D, L2, RHO, XMIN, XMAX, M, REF_DD, REF_KP, REF_C7 } from './removable-singularities-papers.js';
const lam = (x) => L2 + x; // lambda1 as a double; lambda1 - lambda2 is then exact
const g = (k, a) => D[k](a, L2, RHO); // derivative at (lambda1, lambda2, rho)
const gs = (k) => D[k](L2, L2, RHO); // derivative at the equal-stretch point (lambda2, lambda2, rho)
const table = (T) => (x) => T[Math.min(M - 1, Math.max(0, Math.round(((Math.log10(x) - Math.log10(XMIN)) / (Math.log10(XMAX) - Math.log10(XMIN))) * (M - 1))))];
const ones = (k) => '1'.repeat(k);
export const PAPER_CASES = [
  {
    id: 'poking',
    label: '(∂₁ψ − ∂₂ψ)/(λ₁ − λ₂): isotropic Hessian, SIGGRAPH Asia 2023',
    naive: (x) => { const a = lam(x); return (g('1', a) - g('2', a)) / (a - L2); },
    // App. D.1: sum_k d^k/(k+1)! d1^{k+1}(d1 - d2) psi at (lambda2, lambda2, rho)
    taylorFn: (x, n) => { const h = lam(x) - L2; let s = 0, f = 1; for (let k = 0; k <= n; k++) { f *= k + 1; s += Math.pow(h, k) / f * (gs(ones(k + 2)) - gs(ones(k + 1) + '2')); } return s; },
    nmax: 4,
    termsLabel: (n) => (n === 0 ? '1 (the limit ∂₁₁ψ − ∂₁₂ψ only)' : `${n + 1} (through d${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]})`),
    refFn: table(REF_DD),
    xlabel: 'd = λ₁ − λ₂',
    xmin: XMIN, xmax: XMAX, paperTau: 1e-4,
  },
  {
    id: 'kplus',
    label: 'K⁺ = (λ₁∂₁ψ − λ₂∂₂ψ)/(λ₁² − λ₂²): rods and shells, SIGGRAPH 2025 / SIGGRAPH Asia 2026',
    naive: (x) => { const a = lam(x); return (a * g('1', a) - L2 * g('2', a)) / (a * a - L2 * L2); },
    // rods App. G Eq. 87; shells App. E Eqs. 90-91: second-order formula, derivatives at the actual point
    taylorFn: (x) => { const a = lam(x); return 0.5 * (0.5 * (g('11', a) + g('22', a)) - g('12', a) + (g('1', a) + g('2', a)) / (a + L2)); },
    nmax: 0,
    termsLabel: () => 'the papers’ second-order formula',
    refFn: table(REF_KP),
    xlabel: 'd = λ₁ − λ₂',
    xmin: XMIN, xmax: XMAX, paperTau: 1e-3,
  },
  {
    id: 'c7',
    label: 'C₇ˢⁱⁿᵍ = ½(∂₁ψ − ∂₂ψ)/(λ₁ − λ₂): shell bending, SIGGRAPH Asia 2026',
    naive: (x) => { const a = lam(x); return 0.5 * (g('1', a) - g('2', a)) / (a - L2); },
    // shells App. F: 1/4(p11 + p22 - 2 p12) - d/24 (p111 - 3 p112 + 3 p122 - p222), derivatives at the actual point
    taylorFn: (x, n) => { const a = lam(x), h = a - L2;
      const lead = 0.25 * (g('11', a) + g('22', a) - 2 * g('12', a));
      return n === 0 ? lead : lead - h / 24 * (g('111', a) - 3 * g('112', a) + 3 * g('122', a) - g('222', a)); },
    nmax: 1,
    termsLabel: (n) => (n === 0 ? 'leading term only' : 'with the paper’s correction term'),
    refFn: table(REF_C7),
    xlabel: 'd = λ₁ − λ₂',
    xmin: XMIN, xmax: XMAX, paperTau: 1e-3,
  },
];

// Taylor polynomial with terms k = 0..n (Horner in h^step), or the case's own small-argument formula.
export function taylor(c, x, n) {
  if (c.taylorFn) return c.taylorFn(x, n);
  const z = Math.pow(c.h(x), c.step);
  let s = 0;
  for (let k = n; k >= 0; k--) s = s * z + c.coef(k);
  return s;
}

export function reference(c, x) { return c.refFn ? c.refFn(x) : taylor(c, x, 160); }

export function switched(c, x, n, tau) { return Math.abs(c.h ? c.h(x) : x) < tau ? taylor(c, x, n) : c.naive(x); }

export function relerr(v, ref) {
  if (!Number.isFinite(v)) return Infinity;
  return Math.abs(v - ref) / Math.abs(ref);
}

// Log-spaced sample points.
export function samples(c, m = 400) {
  const a = Math.log10(c.xmin), b = Math.log10(c.xmax), xs = [];
  for (let i = 0; i < m; i++) xs.push(Math.pow(10, a + (b - a) * (i / (m - 1))));
  return xs;
}
