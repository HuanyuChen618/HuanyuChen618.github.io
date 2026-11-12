// Core of the polyconvexity demo. Energies are 3D isotropic materials from Table 1 of Chen & Barbic (SCA 2026),
// written as functions of the principal stretches l = [l1, l2, l3], with mu = lambda_Lame = 1 (Poisson ratio 0.25).
// The demo moves along straight lines in matrix space that live in the upper-left 2x2 block of a 3x3 F:
//   rank-one:  F(t) = blockdiag(s I + t a (x) b, s), a squeeze s in every direction, then a rank-one change
//   rotation:  F(t) = blockdiag((1 - t) I + t R(theta), 1), a straight line from the identity to a rotation
// Both are lines in 3x3 matrix space, and the first is a rank-one line, so convexity along it is a real 3D test.

const MU = 1, LAM = 1;
const sum = (l, g) => g(l[0]) + g(l[1]) + g(l[2]);
const vol = (l) => l[0] * l[1] * l[2];
const pos = (l) => l[0] > 0 && l[1] > 0 && l[2] > 0;
const lg = Math.log;

export const MATERIALS = [
  { id: 'nho', name: 'Neo-Hookean (Ogden form)', on: true,
    W: (l) => (pos(l) ? (MU / 2) * (sum(l, (x) => x * x) - 3) - MU * lg(vol(l)) + (LAM / 2) * (vol(l) - 1) ** 2 : Infinity) },
  { id: 'snh', name: 'Stable Neo-Hookean', on: false,
    W: (l) => (MU / 2) * (sum(l, (x) => x * x) - 3) - MU * (vol(l) - 1) + ((LAM + MU) / 2) * (vol(l) - 1) ** 2 },
  { id: 'lc', name: 'Linear Corotational', on: true,
    W: (l) => MU * sum(l, (x) => (x - 1) ** 2) + (LAM / 2) * (l[0] + l[1] + l[2] - 3) ** 2 },
  { id: 'stvk', name: 'St. Venant–Kirchhoff', on: true,
    W: (l) => (MU / 4) * sum(l, (x) => (x * x - 1) ** 2) + (LAM / 8) * (l[0] ** 2 + l[1] ** 2 + l[2] ** 2 - 3) ** 2 },
  { id: 'hencky', name: 'Hencky', on: false,
    W: (l) => (pos(l) ? MU * sum(l, (x) => lg(x) ** 2) + (LAM / 2) * lg(vol(l)) ** 2 : Infinity) },
  { id: 'vl', name: 'Valanis–Landel (original)', on: false,
    W: (l) => (pos(l) ? 2 * MU * sum(l, (x) => x * (lg(x) - 1) + 1) + (LAM / 2) * lg(vol(l)) ** 2 : Infinity) },
  { id: 'arap', name: 'ARAP', on: false, W: (l) => sum(l, (x) => (x - 1) ** 2) },
  { id: 'sd', name: 'Symmetric Dirichlet', on: false,
    W: (l) => (pos(l) ? 0.5 * sum(l, (x) => x * x + 1 / (x * x)) - 3 : Infinity) },
];

// exact singular values of a 2x2 matrix [[a, b], [c, d]]; the second is negative when det < 0 (signed SVD)
export function sv2(a, b, c, d) {
  const p = Math.hypot(a + d, b - c), q = Math.hypot(a - d, b + c);
  return [(p + q) / 2, (p - q) / 2];
}

const dir = (ang) => [Math.cos(ang), Math.sin(ang)];

// a path returns { l: principal stretches of the 3x3 F(t), j: det F(t) }
export function rankOnePath(alpha, beta, s) {
  const a = dir(alpha), b = dir(beta);
  return (t) => {
    const M = [s + t * a[0] * b[0], t * a[0] * b[1], t * a[1] * b[0], s + t * a[1] * b[1]];
    const [s1, s2] = sv2(M[0], M[1], M[2], M[3]);
    return { l: [s1, s2, s], j: s * (M[0] * M[3] - M[1] * M[2]) };
  };
}

export function rotationPath(theta) {
  const c = Math.cos(theta), sn = Math.sin(theta);
  return (t) => {
    const M = [1 - t + t * c, -t * sn, t * sn, 1 - t + t * c];
    const [s1, s2] = sv2(M[0], M[1], M[2], M[3]);
    return { l: [s1, s2, 1], j: M[0] * M[3] - M[1] * M[2] };
  };
}

const at = (W, path, t) => W(path(t).l);

// second derivative of an energy along a path, by central differences
export function d2(W, path, t, h = 1e-4) {
  return (at(W, path, t + h) - 2 * at(W, path, t) + at(W, path, t - h)) / (h * h);
}

// sample W and det along a path
export function sample(W, path, t0, t1, n = 400) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n, p = path(t);
    out.push({ t, w: W(p.l), j: p.j, k: d2(W, path, t) });
  }
  return out;
}
