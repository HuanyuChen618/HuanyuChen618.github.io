export default {
  slug: 'material-zoo',
  title: 'A Field Guide to Isotropic Materials',
  hook: 'Twenty common materials side by side, tuned to the same stiffness.',
  summary: 'Twenty common isotropic materials, from St. Venant–Kirchhoff and Neo-Hookean to ARAP and Mooney–Rivlin, in one table: each written in principal stretches, with its Lamé parameters and two numbers for its weak nonlinearity. With a demo that equalizes them and lets you see where they part ways.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['nonlinear elasticity', 'constitutive models'],
  short: "Material field guide",
  requires: ["three-ways-to-write-a-material"],
  tldr: "Read the Lamé parameters of any isotropic material off the quadratic Taylor expansion of ψ(λ₁, λ₂, λ₃) at rest, and its weak nonlinearity off the cubic terms: then twenty familiar materials fit in one table, any two can be matched in small deformations, and what is left to tell them apart is a single number (SCIEN) plus a residual.",
  source: "This note is Table 1 of my SCA 2026 paper with Jernej Barbič, 'Weak Nonlinearity and Linear Equalization for Isotropic Hyperelastic Materials' (Computer Graphics Forum 45(8)), made interactive. The stretch-based viewpoint comes from our SIGGRAPH Asia 2023 paper on capturing materials by poking.",
};
