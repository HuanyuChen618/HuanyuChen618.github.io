// Rotation-vector derivatives written with one family of functions (from the author's derivation notes).
//   f_0 = cos t, f_1 = sin t / t, f_2 = (1 - cos t)/t^2, f_3 = (t - sin t)/t^3, ...
//   f_{k+2} = (1/k! - f_k)/t^2,   f_k'(t)/t = k f_{k+2} - f_{k+1}   (no division by t anywhere)
//   R = f0 I + f1 [g]x + f2 g g^T,   G = f1 I + f2 [g]x + f3 g g^T,   dR/dg_i = [G e_i]x R
//   d2R/dg_i dg_j = ([dg_i/dg_j]x + [g_i]x [g_j]x) R

const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
const fact = (n) => { while (FACT.length <= n) FACT.push(FACT[FACT.length - 1] * FACT.length); return FACT[n]; };

// f_k(t), accurate for all t >= 0: Taylor series below 1, closed form + recursion above.
export function fk(k, t) {
  if (t < 1) {
    let s = 0, p = 1; const t2 = t * t;
    for (let m = 0; m < 18; m++) { s += ((m & 1 ? -1 : 1) * p) / fact(k + 2 * m); p *= t2; }
    return s;
  }
  let a = Math.cos(t), b = Math.sin(t) / t; // f0, f1
  if (k === 0) return a;
  if (k === 1) return b;
  // upward recursion f_{j+2} = (1/j! - f_j)/t^2 is well conditioned for t >= 1 and small k
  const f = [a, b];
  for (let j = 0; f.length <= k; j++) f.push((1 / fact(j) - f[j]) / (t * t));
  return f[k];
}
// f_k'(t)/t, division-free
export const fkpt = (k, t) => k * fk(k + 2, t) - fk(k + 1, t);

// naive versions (direct formulas, as one would first write them)
export function fkNaive(k, t) {
  if (k === 0) return Math.cos(t);
  if (k === 1) return Math.sin(t) / t;
  if (k === 2) return (1 - Math.cos(t)) / (t * t);
  if (k === 3) return (t - Math.sin(t)) / (t * t * t);
  if (k === 4) return (Math.cos(t) - 1 + t * t / 2) / t ** 4;
  if (k === 5) return (Math.sin(t) - t + t ** 3 / 6) / t ** 5;
  throw new Error('k');
}
export const fkptNaive = (k, t) => (fkNaive(k - 1, t) - k * fkNaive(k, t)) / (t * t); // f_k'/t = (f_{k-1} - k f_k)/t^2

// 3x3 helpers (row-major arrays of 9)
export const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const hat = (w) => [0, -w[2], w[1], w[2], 0, -w[0], -w[1], w[0], 0];
export const outer = (a, b) => [a[0] * b[0], a[0] * b[1], a[0] * b[2], a[1] * b[0], a[1] * b[1], a[1] * b[2], a[2] * b[0], a[2] * b[1], a[2] * b[2]];
export function mul(P, Q) { const R = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[3 * i + j] += P[3 * i + k] * Q[3 * k + j]; return R; }
export const lin = (...pairs) => { const R = new Array(9).fill(0); for (const [s, M] of pairs) for (let i = 0; i < 9; i++) R[i] += s * M[i]; return R; };
export const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const norm = (g) => Math.hypot(g[0], g[1], g[2]);

// A_g(x0, x1, x2) = x0 I + x1 [g]x + x2 [g]x^2
export const A = (g, x0, x1, x2) => { const K = hat(g); return lin([x0, I3], [x1, K], [x2, mul(K, K)]); };

export function R(g, f = fk) { const t = norm(g); return lin([f(0, t), I3], [f(1, t), hat(g)], [f(2, t), outer(g, g)]); }
export function G(g, f = fk) { const t = norm(g); return lin([f(1, t), I3], [f(2, t), hat(g)], [f(3, t), outer(g, g)]); }
export const gcol = (g, i, f = fk) => { const M = G(g, f); return [M[i], M[3 + i], M[6 + i]]; };

// first derivative: dR/dg_i = [g_i]x R
export const dR = (g, i, f = fk) => mul(hat(gcol(g, i, f)), R(g, f));

// dg_i/dg_j = (f1'/t) g_j e_i - (f2'/t) g_j (e_i x g) + (f3'/t) g_i g_j g - f2 (e_i x e_j) + f3 (g_i e_j + delta_ij g)
export function dg(g, i, j, f = fk, fp = fkpt) {
  const t = norm(g), ei = E[i], ej = E[j], exg = cross(ei, g), eij = cross(ei, ej), d = i === j ? 1 : 0;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++)
    out[c] = fp(1, t) * g[j] * ei[c] - fp(2, t) * g[j] * exg[c] + fp(3, t) * g[i] * g[j] * g[c]
      - f(2, t) * eij[c] + f(3, t) * (g[i] * ej[c] + d * g[c]);
  return out;
}

// second derivative
export function d2R(g, i, j, f = fk, fp = fkpt) {
  const gi = gcol(g, i, f), gj = gcol(g, j, f);
  return mul(lin([1, hat(dg(g, i, j, f, fp))], [1, mul(hat(gi), hat(gj))]), R(g, f));
}

// Gallego & Yezzi (2015): dR/dg_i = (g_i [g]x + [g x (I - R) e_i]x) R / |g|^2
export function dR_GY(g, i) {
  const t2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2], Rm = R(g), v = mv(lin([1, I3], [-1, Rm]), E[i]);
  return mul(lin([g[i] / t2, hat(g)], [1 / t2, hat(cross(g, v))]), Rm);
}
