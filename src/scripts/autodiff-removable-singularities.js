// Two tiny autodiff engines for the "removable singularities vs autodiff" note.
// 1) Forward mode with truncated Taylor arithmetic ("jets"): a jet holds [f, f', f''/2] and every operation
//    propagates all three, so the program's first and second derivatives come out exactly as an AD tool computes them.
// 2) Reverse mode with a tape, including a vectorized-style `where` whose masked branch receives a zero cotangent.

export const K = 2; // jet order: value, first and second derivative

const jet = (c) => c;
export const cst = (v) => jet([v, 0, 0]);
export const variable = (x) => jet([x, 1, 0]);
export const add = (a, b) => a.map((ai, k) => ai + b[k]);
export const sub = (a, b) => a.map((ai, k) => ai - b[k]);
export const mul = (a, b) => a.map((_, k) => { let s = 0; for (let j = 0; j <= k; j++) s += a[j] * b[k - j]; return s; });
export const div = (a, b) => {
  const q = [];
  for (let k = 0; k <= K; k++) { let s = a[k]; for (let j = 1; j <= k; j++) s -= b[j] * q[k - j]; q.push(s / b[0]); }
  return q;
};
export const exp = (a) => {
  const e = [Math.exp(a[0])];
  for (let k = 1; k <= K; k++) { let s = 0; for (let j = 1; j <= k; j++) s += j * a[j] * e[k - j]; e.push(s / k); }
  return e;
};
// expm1 shares exp's derivatives; only the value differs (computed without cancellation).
export const expm1 = (a) => { const e = exp(a); e[0] = Math.expm1(a[0]); return e; };
export const sincos = (a) => {
  const s = [Math.sin(a[0])], c = [Math.cos(a[0])];
  for (let k = 1; k <= K; k++) {
    let ss = 0, cc = 0;
    for (let j = 1; j <= k; j++) { ss += j * a[j] * c[k - j]; cc -= j * a[j] * s[k - j]; }
    s.push(ss / k); c.push(cc / k);
  }
  return [s, c];
};
export const sin = (a) => sincos(a)[0];
export const log = (a) => { // k a0 L_k = k a_k - sum_{j=1}^{k-1} j L_j a_{k-j}
  const L = [Math.log(a[0])];
  for (let k = 1; k <= K; k++) { let s = k * a[k]; for (let j = 1; j < k; j++) s -= j * L[j] * a[k - j]; L.push(s / (k * a[0])); }
  return L;
};
export const d1 = (j) => j[1];
export const d2 = (j) => 2 * j[2];

// The function f(x) = (e^x - 1)/x, written as different programs. All are "the same function" for x != 0.
// Its true derivatives at 0: f = 1, f' = 1/2, f'' = 1/3.
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
export const exact = (x) => { // reference [f, f', f''] from the series sum_k x^k/(k+1)!
  let f = 0, f1 = 0, f2 = 0;
  for (let k = 0; k < 60; k++) {
    const c = 1 / fact(k + 1);
    f += c * x ** k; if (k >= 1) f1 += c * k * x ** (k - 1); if (k >= 2) f2 += c * k * (k - 1) * x ** (k - 2);
  }
  return [f, f1, f2];
};
export const TAU = 1e-3;
const taylorJet = (X, n) => { // 1 + x/2 + x^2/6 + ... through x^n, built from jet operations
  let s = cst(1 / fact(n + 1));
  for (let k = n - 1; k >= 0; k--) s = add(mul(s, X), cst(1 / fact(k + 1)));
  return s;
};
export const PROGRAMS = [
  { id: 'naive', label: '(exp(x) − 1) / x', f: (X) => div(sub(exp(X), cst(1)), X) },
  { id: 'branch', label: 'x == 0 ? 1 : (exp(x) − 1) / x', f: (X) => (X[0] === 0 ? cst(1) : div(sub(exp(X), cst(1)), X)) },
  { id: 'rewrite', label: 'x == 0 ? 1 : expm1(x) / x', f: (X) => (X[0] === 0 ? cst(1) : div(expm1(X), X)) },
  { id: 'taylor2', label: '|x| < τ ? 1 + x/2 + x²/6 : expm1(x) / x', f: (X) => (Math.abs(X[0]) < TAU ? taylorJet(X, 2) : div(expm1(X), X)) },
  { id: 'taylor1', label: '|x| < τ ? 1 + x/2 : expm1(x) / x', f: (X) => (Math.abs(X[0]) < TAU ? taylorJet(X, 1) : div(expm1(X), X)) },
  { id: 'custom', label: 'custom rule (own series for f, f′, f″ near 0)', f: (X) => {
    if (Math.abs(X[0]) < 0.5) { const e = exact(X[0]); return [e[0], e[1] * X[1], 0.5 * (e[2] * X[1] * X[1] + e[1] * 2 * X[2])]; }
    return div(expm1(X), X);
  } },
];

// ---------- a real case: K2 from the elastic-rod energy (Chen, Wen, Barbic 2025, ANIME-Rod, Sec. 4.3 and App. G) ----------
// Rod material psi(lambda, rho, rho) for a compressible Neo-Hookean solid, psi(s) = mu/2 (sum s_i^2 - 3) - mu log J + lam/2 log^2 J.
// K2 = (rho d1psi - lambda d2psi) / (lambda^2 - rho^2) has a removable singularity at lambda = rho. For this material the
// closed form is K2 = (mu - lam log J)/(lambda rho), J = lambda rho^2, which gives exact derivatives in lambda.
// The variable is d = lambda - rho with rho = 1 (the cross-section at rest).
export const ROD = { mu: 1, lam: 1.5, rho: 1, tau: 1e-3 };
const rodPartials = (Lm) => { // jets of d1psi, d2psi, d11psi, d22psi, d12psi at (lambda, rho, rho); Lm is a jet in lambda
  const { mu, lam, rho } = ROD, R = cst(rho);
  const lnJ = log(mul(Lm, cst(rho * rho)));
  const p1 = add(sub(mul(cst(mu), Lm), div(cst(mu), Lm)), div(mul(cst(lam), lnJ), Lm));
  const p2 = add(sub(cst(mu * rho), cst(mu / rho)), div(mul(cst(lam), lnJ), R));
  const p11 = add(add(cst(mu), div(cst(mu), mul(Lm, Lm))), div(mul(cst(lam), sub(cst(1), lnJ)), mul(Lm, Lm)));
  const p22 = add(cst(mu + mu / (rho * rho)), div(mul(cst(lam), sub(cst(1), lnJ)), cst(rho * rho)));
  const p12 = div(cst(lam / rho), Lm);
  return { p1, p2, p11, p22, p12 };
};
export const rodExact = (x) => { // [K2, dK2/dlambda, d2K2/dlambda2] at lambda = rho + x
  const { mu, lam, rho } = ROD, l = rho + x, L = Math.log(l * rho * rho);
  return [(mu - lam * L) / (l * rho), -(mu + lam - lam * L) / (l * l * rho), (2 * mu + 3 * lam - 2 * lam * L) / (l * l * l * rho)];
};
const rodNaive = (Lm) => { const { rho } = ROD, q = rodPartials(Lm);
  return div(sub(mul(cst(rho), q.p1), mul(Lm, q.p2)), sub(mul(Lm, Lm), cst(rho * rho))); };
const rodPaper = (Lm) => { const { rho } = ROD, q = rodPartials(Lm); // ANIME-Rod Eq. 88
  const half = mul(cst(0.5), add(q.p11, q.p22));
  return mul(cst(0.5), sub(sub(half, q.p12), div(add(q.p1, q.p2), add(Lm, cst(rho))))); };
export const ROD_PROGRAMS = [
  { id: 'naive', label: 'K₂ = (ρ∂₁ψ − λ∂₂ψ)/(λ² − ρ²)', f: (X) => rodNaive(add(X, cst(ROD.rho))) },
  { id: 'branch', label: 'λ == ρ ? K₂(ρ, ρ) as a constant : formula', f: (X) => (X[0] === 0 ? cst(rodExact(0)[0]) : rodNaive(add(X, cst(ROD.rho)))) },
  { id: 'taylor2', label: '|λ − ρ| < 10⁻³ ? Eq. 88 : formula (the paper’s switch)', f: (X) => { const Lm = add(X, cst(ROD.rho)); return Math.abs(X[0]) < ROD.tau ? rodPaper(Lm) : rodNaive(Lm); } },
  { id: 'custom', label: 'custom rule (derivatives of K₂ supplied by hand)', f: (X) => { const e = rodExact(X[0]); return [e[0], e[1] * X[1], 0.5 * (e[2] * X[1] * X[1] + e[1] * 2 * X[2])]; } },
];

// ---------- reverse mode with a tape ----------
// Each node: { op, args, val, label }. backward() returns the list of nodes with their adjoints.
export function runTape(build, x) {
  const nodes = [];
  const push = (n) => { nodes.push(n); return nodes.length - 1; };
  const v = (i) => nodes[i].val;
  const T = {
    input: (label) => push({ op: 'input', args: [], val: x, label }),
    const: (c) => push({ op: 'const', args: [], val: c, label: String(c) }),
    exp: (a) => push({ op: 'exp', args: [a], val: Math.exp(v(a)) }),
    sin: (a) => push({ op: 'sin', args: [a], val: Math.sin(v(a)) }),
    add: (a, b) => push({ op: 'add', args: [a, b], val: v(a) + v(b) }),
    sub: (a, b) => push({ op: 'sub', args: [a, b], val: v(a) - v(b) }),
    mul: (a, b) => push({ op: 'mul', args: [a, b], val: v(a) * v(b) }),
    div: (a, b) => push({ op: 'div', args: [a, b], val: v(a) / v(b) }),
    // where(cond, a, b): both branches already computed; cond is a plain boolean
    where: (cond, a, b) => push({ op: 'where', args: [a, b], cond, val: cond ? v(a) : v(b) }),
  };
  const out = build(T, x);
  nodes.forEach((n) => (n.adj = 0));
  nodes[out].adj = 1;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i], g = n.adj, [a, b] = n.args;
    switch (n.op) {
      case 'exp': nodes[a].adj += g * n.val; break;
      case 'sin': nodes[a].adj += g * Math.cos(v(a)); break;
      case 'add': nodes[a].adj += g; nodes[b].adj += g; break;
      case 'sub': nodes[a].adj += g; nodes[b].adj -= g; break;
      case 'mul': nodes[a].adj += g * v(b); nodes[b].adj += g * v(a); break;
      case 'div': nodes[a].adj += g * (1 / v(b)); nodes[b].adj += g * (-v(a) / (v(b) * v(b))); break;
      case 'where': nodes[a].adj += n.cond ? g : 0; nodes[b].adj += n.cond ? 0 : g; break;
    }
  }
  return { nodes, out, grad: nodes[0].adj };
}

export const TAPES = {
  single: {
    label: 'one where',
    code: 'y = where(x == 0, 1, (exp(x) - 1) / x)',
    build: (T, x) => {
      const X = T.input('x'), q = T.div(T.sub(T.exp(X), T.const(1)), X);
      return T.where(x === 0, T.const(1), q);
    },
  },
  double: {
    label: 'double where',
    code: 'xs = where(x == 0, 1, x)\ny  = where(x == 0, 1, (exp(xs) - 1) / xs)',
    build: (T, x) => {
      const X = T.input('x'), xs = T.where(x === 0, T.const(1), X);
      const q = T.div(T.sub(T.exp(xs), T.const(1)), xs);
      return T.where(x === 0, T.const(1), q);
    },
  },
  taylor: {
    label: 'double where + Taylor branch',
    code: 'xs = where(|x| < τ, 1, x)\ny  = where(|x| < τ, 1 + x/2, (exp(xs) - 1) / xs)',
    build: (T, x) => {
      const small = Math.abs(x) < TAU;
      const X = T.input('x'), xs = T.where(small, T.const(1), X);
      const q = T.div(T.sub(T.exp(xs), T.const(1)), xs);
      const t = T.add(T.const(1), T.mul(T.const(0.5), X));
      return T.where(small, t, q);
    },
  },
};
