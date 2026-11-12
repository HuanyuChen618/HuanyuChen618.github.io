// Core of the "three ways to write a material" demo (2D). A deformation gradient F is a 2x2 matrix stored
// row-major as [a, b, c, d] = [[a, b], [c, d]]. Each material is written three ways: in principal stretches;
// in the "lower" invariants i = tr S, ii = ||F||^2, iii = det F (the S-centric invariants of Smith et al. 2019, as in
// Chen & Barbič SCA 2026, Eq. 16); and in the "upper" invariants, the invariants of C = F^T F. The three agree whenever
// det F > 0; with a reflection (det F < 0), the invariants of C cannot tell the difference.

export const MU = 1, LAM = 1;

// Signed SVD of a 2x2 matrix: F = R(phi) diag(s1, s2) R(theta), with s1 >= |s2| and s2 < 0 exactly when det F < 0.
export function svd2(F) {
  const [a, b, c, d] = F;
  const E = (a + d) / 2, Fq = (a - d) / 2, G = (c + b) / 2, H = (c - b) / 2;
  const Q = Math.hypot(E, H), R = Math.hypot(Fq, G);
  const a1 = Math.atan2(G, Fq), a2 = Math.atan2(H, E);
  return { s1: Q + R, s2: Q - R, phi: (a2 + a1) / 2, theta: (a2 - a1) / 2 };
}

export const rot = (t) => [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)];
export const mul = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];

// The quantities each representation is built from.
export function quantities(F) {
  const [a, b, c, d] = F;
  const { s1, s2 } = svd2(F);
  const C = [a * a + c * c, a * b + c * d, a * b + c * d, b * b + d * d]; // F^T F
  const I1 = C[0] + C[3], I2 = C[0] * C[3] - C[1] * C[2]; // 2D: tr C and det C
  const J = a * d - b * c;
  const normF2 = a * a + b * b + c * c + d * d;
  const trS = Math.sqrt(Math.max(0, normF2 + 2 * J)); // (s1 + s2)^2 = ||F||^2 + 2 det F, and s1 + s2 >= 0
  return { s1, s2, I1, I2, J, normF2, trS };
}

const ln = Math.log;
// Each material: energy density written three ways. NaN means "undefined" (log of a non-positive J).
export const MATERIALS = {
  neohookean: {
    name: 'Neo-Hookean',
    stretch: ({ s1, s2 }) => { const J = s1 * s2; return J > 0 ? MU / 2 * (s1 * s1 + s2 * s2 - 2) - MU * ln(J) + LAM / 2 * ln(J) ** 2 : NaN; },
    invC: ({ I1, I2 }) => { const J = Math.sqrt(I2); return J > 0 ? MU / 2 * (I1 - 2) - MU * ln(J) + LAM / 2 * ln(J) ** 2 : NaN; },
    invS: ({ normF2, J }) => (J > 0 ? MU / 2 * (normF2 - 2) - MU * ln(J) + LAM / 2 * ln(J) ** 2 : NaN),
  },
  arap: {
    name: 'As-rigid-as-possible (co-rotational)',
    stretch: ({ s1, s2 }) => MU * ((s1 - 1) ** 2 + (s2 - 1) ** 2),
    invC: ({ I1, I2 }) => MU * (I1 - 2 * Math.sqrt(I1 + 2 * Math.sqrt(I2)) + 2), // tr S rebuilt from C: sign of J lost
    invS: ({ normF2, trS }) => MU * (normF2 - 2 * trS + 2),
  },
  stvk: {
    name: 'St. Venant–Kirchhoff',
    stretch: ({ s1, s2 }) => { const e1 = (s1 * s1 - 1) / 2, e2 = (s2 * s2 - 1) / 2; return MU * (e1 * e1 + e2 * e2) + LAM / 2 * (e1 + e2) ** 2; },
    invC: ({ I1, I2 }) => { const trE = (I1 - 2) / 2, trE2 = (I1 * I1 - 2 * I2 - 2 * I1 + 2) / 4; return MU * trE2 + LAM / 2 * trE * trE; },
    invS: ({ normF2, J }) => { const I1 = normF2, I2 = J * J, trE = (I1 - 2) / 2, trE2 = (I1 * I1 - 2 * I2 - 2 * I1 + 2) / 4; return MU * trE2 + LAM / 2 * trE * trE; },
  },
};
