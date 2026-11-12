export default {
  slug: 'polyconvexity',
  title: 'Polyconvexity, and Why It Is Defined That Way',
  hook: 'Why an elastic energy cannot be convex, and what to ask for instead.',
  summary: 'Why an elastic energy cannot simply be convex, what rank-one convexity and quasiconvexity ask for, and why "convex in the minors of F" is the condition you can actually check, with an interactive plot of energies along straight lines in matrix space.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['nonlinear elasticity', 'materials', 'convexity'],
  short: "Polyconvexity",
  requires: ["material-zoo"],
  tldr: "An elastic energy cannot be convex in the deformation gradient, so polyconvexity asks instead for convexity in its minors (entries, cofactors and determinant), a condition you can check by hand that keeps what convexity was needed for; tested on the common materials of my SCA 2026 table, only the Neo-Hookean variants survive, because being convex in the principal stretches is not enough.",
  source: "This note grows out of two of my papers. My SIGGRAPH Asia 2023 paper fits stretch-based (Valanis–Landel) materials to measured data and enforces their stability through convexity in the stretches; my SCA 2026 paper tabulates the common isotropic materials of graphics and mechanics. Re-checking those materials against the conditions below is what this note adds.",
};
