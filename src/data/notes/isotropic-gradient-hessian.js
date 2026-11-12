export default {
  slug: 'isotropic-gradient-hessian',
  title: 'The Gradient and Hessian of an Isotropic Energy',
  hook: 'Stress and Hessian of an isotropic energy in closed form, checked live.',
  summary: 'The stress and Hessian of a stretch-based material in closed form: a 3×3 block plus six numbers in a fixed SVD basis, the removable 0/0 at equal stretches, independence from the SVD choice, and the rest-shape spectrum that is just the Lamé parameters. With a live check against finite differences.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['nonlinear elasticity', 'Newton methods'],
  short: "Gradient and Hessian",
  requires: ["three-ways-to-write-a-material"],
  tldr: "For an isotropic energy ψ(λ₁, λ₂, λ₃) of the principal stretches, the stress is U diag(∂ψ/∂λᵢ) Vᵀ and the Hessian is block-diagonal in a fixed basis built from U and V: one 3×3 block plus six numbers, two of which are 0/0 at equal stretches; the singularity is removable, the formulas do not depend on which SVD you picked, and at rest the whole spectrum is just the Lamé parameters.",
  source: "This is the stretch-based machinery of Section 5 and Appendices C and D of my SIGGRAPH Asia 2023 paper with Danyong Zhao and Jernej Barbič, which made stretch-based materials stable enough to fit to measurements; the rest-shape spectrum ties it to the Lamé parameters of my SCA 2026 paper.",
};
