export default {
  slug: 'autodiff-removable-singularities',
  title: 'Why Removable Singularities Are Bad for Autodiff',
  hook: 'Autodiff differentiates your program, not your function. Here is how that bites.',
  summary: 'Automatic differentiation differentiates your program, not your function. On a real case from my elastic-rod paper: a guarded branch gives zero derivatives, a second-order switch formula gives a second derivative that is 20% off at rest, and a masked branch can poison a gradient with NaN. Two tiny AD engines you can poke at.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['automatic differentiation', 'numerics', 'isotropic materials'],
  short: "Singularities vs autodiff",
  requires: ["removable-singularities"],
  tldr: "Autodiff differentiates the program you wrote, branch by branch, so a fix for a removable singularity must be right for the derivatives too: a constant branch has zero derivative, a series that is second-order accurate in value is only first-order in the gradient and wrong in the Hessian, and a masked branch still runs backward.",
  source: "The running example is the rod stiffness K₂ from my elastic-rod paper (SIGGRAPH 2025, Section 4 and Appendix G), whose energy Hessian needs second derivatives of K₁ and K₂. The measurements of what automatic differentiation makes of it are new for this note.",
};
