export default {
  slug: 'axis-angle-derivatives',
  title: 'Axis-Angle Rotations and Their Derivatives',
  hook: 'First and second derivatives of a rotation vector that never divide by θ.',
  summary: "Rodrigues' formula rewritten with one family of functions f_k(θ): the first derivative [g_i]× R and a closed-form second derivative, neither of which ever divides by θ, plus what goes wrong near a full turn, with an error plot and an interactive frame.",
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['rotations', 'derivatives', 'numerics'],
  short: "Axis-angle derivatives",
  requires: [],
  tldr: "Write every coefficient of Rodrigues' formula as a member of one family of functions f_k(θ); then the first derivative of a rotation with respect to its rotation vector is [g_i]× R, the full second derivative has a closed form too, and nothing in either ever divides by θ, so both are exact and finite at zero.",
  source: "The formulas in this note come from my own derivation notes on Rodrigues derivatives, worked out for differentiable simulation with rotation vectors; they are not published elsewhere. Everything below was checked numerically against finite differences and a matrix-exponential reference.",
};
