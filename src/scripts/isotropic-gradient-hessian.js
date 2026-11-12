// Core of the "gradient and Hessian of an isotropic energy" demo (2D). F is 2x2, row-major [a, b, c, d].
// An isotropic energy Psi(F) = psi(s1, s2) of the signed singular values. Its first Piola-Kirchhoff stress is
// P = U diag(psi_1, psi_2) V^T, and its 4x4 Hessian has a closed-form eigensystem:
//   two "scaling" modes U diag(w) V^T, with (eigenvalue, w) from the 2x2 Hessian of psi in (s1, s2);
//   "twist"  U [[0,-1],[1,0]] V^T / sqrt2, eigenvalue (psi_1 + psi_2) / (s1 + s2);
//   "flip"   U [[0, 1],[1,0]] V^T / sqrt2, eigenvalue (psi_1 - psi_2) / (s1 - s2)  (limit psi_11 - psi_12 at s1 = s2).
import { svd2, rot, mul } from './three-ways-to-write-a-material.js';
export { svd2, rot, mul };

export const MU = 1, LAM = 2;

export const MATS = {
  arap: {
    name: 'As-rigid-as-possible',
    psi: (s1, s2) => MU * ((s1 - 1) ** 2 + (s2 - 1) ** 2),
    grad: (s1, s2) => [2 * MU * (s1 - 1), 2 * MU * (s2 - 1)],
    hess: () => [2 * MU, 0, 0, 2 * MU],
  },
  neohookean: {
    name: 'Neo-Hookean',
    psi: (s1, s2) => { const J = s1 * s2; return J > 0 ? MU / 2 * (s1 * s1 + s2 * s2 - 2) - MU * Math.log(J) + LAM / 2 * Math.log(J) ** 2 : NaN; },
    grad: (s1, s2) => { const L = Math.log(s1 * s2); return [MU * s1 - MU / s1 + LAM * L / s1, MU * s2 - MU / s2 + LAM * L / s2]; },
    hess: (s1, s2) => {
      const L = Math.log(s1 * s2);
      return [MU + (MU + LAM - LAM * L) / (s1 * s1), LAM / (s1 * s2), LAM / (s1 * s2), MU + (MU + LAM - LAM * L) / (s2 * s2)];
    },
  },
};

export const energyF = (m, F) => { const { s1, s2 } = svd2(F); return m.psi(s1, s2); };

// U and V^T of the signed SVD, as matrices: F = U diag(s1, s2) Vt
export function factors(F) {
  const { s1, s2, phi, theta } = svd2(F);
  return { s1, s2, U: rot(phi), Vt: rot(theta) };
}

// P = U diag(psi_1, psi_2) V^T
export function stress(m, F) {
  const { s1, s2, U, Vt } = factors(F); const g = m.grad(s1, s2);
  return mul(mul(U, [g[0], 0, 0, g[1]]), Vt);
}

// Symmetric eigen-decomposition by cyclic Jacobi (small n). A is n*n row-major; returns ascending values.
export function symEig(A, n) {
  const a = A.slice(), V = Array.from({ length: n * n }, (_, i) => (i % (n + 1) === 0 ? 1 : 0));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const tau = (a[q * n + q] - a[p * n + p]) / (2 * apq);
      const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau)), c = 1 / Math.sqrt(1 + t * t), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k * n + p], akq = a[k * n + q]; a[k * n + p] = c * akp - s * akq; a[k * n + q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p * n + k], aqk = a[q * n + k]; a[p * n + k] = c * apk - s * aqk; a[q * n + k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k * n + p], vkq = V[k * n + q]; V[k * n + p] = c * vkp - s * vkq; V[k * n + q] = s * vkp + c * vkq; }
    }
  }
  const idx = [...Array(n).keys()].sort((i, j) => a[i * n + i] - a[j * n + j]);
  return { values: idx.map((i) => a[i * n + i]), vectors: idx.map((i) => Array.from({ length: n }, (_, k) => V[k * n + i])) };
}

// Analytic eigensystem: [{ name, value, mode }] where mode is the 2x2 deformation direction (unit Frobenius norm).
export function analyticEigen(m, F) {
  const { s1, s2, U, Vt } = factors(F);
  const [g1, g2] = m.grad(s1, s2), H = m.hess(s1, s2);
  const sc = symEig(H, 2);
  const out = sc.vectors.map((w, i) => ({ name: `scaling ${i + 1}`, value: sc.values[i], mode: mul(mul(U, [w[0], 0, 0, w[1]]), Vt) }));
  const r = Math.SQRT1_2;
  const twist = (g1 + g2) / (s1 + s2);
  const flip = Math.abs(s1 - s2) > 1e-6 ? (g1 - g2) / (s1 - s2) : H[0] - H[1]; // removable singularity at s1 = s2
  out.push({ name: 'twist', value: twist, mode: mul(mul(U, [0, -r, r, 0]), Vt) });
  out.push({ name: 'flip', value: flip, mode: mul(mul(U, [0, r, r, 0]), Vt) });
  return out;
}

// Finite-difference Hessian of Psi(F) (4x4, central differences on the energy).
export function fdHessian(m, F, h = 1e-4) {
  const H = new Array(16).fill(0), E = (G) => energyF(m, G);
  for (let i = 0; i < 4; i++) for (let j = i; j < 4; j++) {
    const f = (di, dj) => { const G = F.slice(); G[i] += di; G[j] += dj; return E(G); };
    const v = i === j ? (f(h, 0) - 2 * E(F) + f(-h, 0)) / (h * h) : (f(h, h) - f(h, -h) - f(-h, h) + f(-h, -h)) / (4 * h * h);
    H[i * 4 + j] = v; H[j * 4 + i] = v;
  }
  return H;
}
