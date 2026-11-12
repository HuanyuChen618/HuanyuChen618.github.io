// Core of the Gauss-Newton demo: fit y = a exp(b t) to a few data points by nonlinear least squares,
// f(a, b) = 1/2 sum_i r_i^2 with r_i = a exp(b t_i) - y_i, and compare four ways of stepping.

export const TS = [0, 0.25, 0.5, 0.75, 1];
const BASE = TS.map((t) => 1.5 * Math.exp(t)); // data on the curve a = 1.5, b = 1
const BUMP = [0.6, -0.9, 1.1, -0.9, 0.6]; // a wiggle the model cannot follow

// data for a given "misfit" level: 0 = points exactly on a curve of the model (zero residual)
export function data(misfit) { return BASE.map((y, i) => y + misfit * BUMP[i]); }

export function residuals(x, Y) { return TS.map((t, i) => x[0] * Math.exp(x[1] * t) - Y[i]); }
export function f(x, Y) { let s = 0; for (const r of residuals(x, Y)) s += r * r; return 0.5 * s; }

// J (rows: residuals), gradient g = J^T r, Gauss-Newton matrix J^T J, full Hessian J^T J + sum r_i Hess(r_i)
export function derivs(x, Y) {
  const [a, b] = x; const r = residuals(x, Y);
  let g0 = 0, g1 = 0, A = 0, B = 0, C = 0, S01 = 0, S11 = 0;
  TS.forEach((t, i) => {
    const e = Math.exp(b * t), ja = e, jb = a * t * e;
    g0 += ja * r[i]; g1 += jb * r[i];
    A += ja * ja; B += ja * jb; C += jb * jb;
    // second derivatives of r_i: d2/da2 = 0, d2/dadb = t e, d2/db2 = a t^2 e
    S01 += r[i] * t * e; S11 += r[i] * a * t * t * e;
  });
  return { g: [g0, g1], JTJ: [A, B, B, C], H: [A, B + S01, B + S01, C + S11] };
}

function solve2(M, v, mu = 0) {
  const a = M[0] + mu, b = M[1], c = M[2], d = M[3] + mu, det = a * d - b * c;
  if (Math.abs(det) < 1e-300) return null;
  return [(d * v[0] - b * v[1]) / det, (-c * v[0] + a * v[1]) / det];
}
const add = (x, d, s = 1) => [x[0] + s * d[0], x[1] + s * d[1]];

// The model is linear in a, so for a fixed b the best a is a 1D linear least-squares solve in closed form:
// minimize sum (a e_i - y_i)^2  =>  a = sum y_i e_i / sum e_i^2. This is the analogue of the "Fit E" step.
export function bestScale(b, Y) {
  let num = 0, den = 0;
  TS.forEach((t, i) => { const e = Math.exp(b * t); num += Y[i] * e; den += e * e; });
  return num / den;
}

// backtracking (Armijo) line search along d; returns the step length used, or 0 if d is not a descent direction
function backtrack(x, d, Y, g) {
  const f0 = f(x, Y), slope = g[0] * d[0] + g[1] * d[1];
  if (!(slope < 0)) return 0;
  let s = 1;
  for (let k = 0; k < 50; k++) { if (f(add(x, d, s), Y) <= f0 + 1e-4 * s * slope) return s; s *= 0.5; }
  return 0;
}

// Run one method from x0. Returns the path of iterates. opts: { lineSearch, mu0 }
export function run(method, x0, Y, opts = {}, maxIt = 200, tol = 1e-10) {
  let x = x0.slice(), mu = opts.mu0 ?? 1, nu = 2;
  const path = [x.slice()];
  for (let it = 0; it < maxIt; it++) {
    const D = derivs(x, Y), gn = Math.hypot(D.g[0], D.g[1]);
    if (gn < tol) break;
    let xn = null;
    if (method === 'gd') {
      const d = [-D.g[0], -D.g[1]], s = backtrack(x, d, Y, D.g);
      if (!s) break; xn = add(x, d, s);
    } else if (method === 'gn' || method === 'newton') {
      const d = solve2(method === 'gn' ? D.JTJ : D.H, [-D.g[0], -D.g[1]]);
      if (!d) break;
      if (opts.lineSearch) { const s = backtrack(x, d, Y, D.g); if (!s) break; xn = add(x, d, s); }
      else xn = add(x, d);
    } else if (method === 'lm') {
      // Levenberg-Marquardt with the usual gain-ratio update of the damping mu (Nielsen's rule)
      const f0 = f(x, Y);
      for (let k = 0; k < 60 && !xn; k++) {
        const d = solve2(D.JTJ, [-D.g[0], -D.g[1]], mu); if (!d) { mu *= nu; nu *= 2; continue; }
        const pred = -(D.g[0] * d[0] + D.g[1] * d[1]) - 0.5 * (d[0] * (D.JTJ[0] * d[0] + D.JTJ[1] * d[1]) + d[1] * (D.JTJ[2] * d[0] + D.JTJ[3] * d[1]));
        const xt = add(x, d), rho = (f0 - f(xt, Y)) / Math.max(pred, 1e-300);
        if (rho > 0) { xn = xt; mu *= Math.max(1 / 3, 1 - (2 * rho - 1) ** 3); nu = 2; }
        else { mu *= nu; nu *= 2; }
      }
      if (!xn) break;
    }
    if (!isFinite(xn[0]) || !isFinite(xn[1]) || Math.abs(xn[0]) > 1e3 || Math.abs(xn[1]) > 1e3) { path.push(xn); break; }
    if (opts.rescale) xn = [bestScale(xn[1], Y), xn[1]]; // exact 1D fit of the linear parameter (like "Fit E")
    const moved = Math.hypot(xn[0] - x[0], xn[1] - x[1]);
    x = xn; path.push(x.slice());
    if (moved < 1e-13 * (1 + Math.hypot(x[0], x[1]))) break; // no progress left at machine precision
  }
  return path;
}
