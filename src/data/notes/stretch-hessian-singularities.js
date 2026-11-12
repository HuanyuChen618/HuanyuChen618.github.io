export default {
  slug: 'stretch-hessian-singularities',
  title: 'Singularities in Stretch-Based Hessians',
  hook: 'The 0/0 that every isotropic material hits at rest, and how three of my papers handle it.',
  summary: 'The flip quotient in the Hessian of a stretch-based energy is 0/0 whenever two stretches are equal, including the rest shape. How my material-capture, elastic-rod and thin-shell papers evaluate it, each formula re-measured in 50-digit arithmetic, with an interactive error plot.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['numerics', 'isotropic materials', 'hessian'],
  short: "Stretch-Hessian singularities",
  requires: ["isotropic-gradient-hessian", "removable-singularities"],
  tldr: "The Hessian of an isotropic energy in principal stretches contains the divided difference (ψᵢ − ψⱼ)/(λᵢ − λⱼ), which is 0/0 whenever two stretches meet, including at rest; my 2023, 2025 and 2026 papers replace it near the singular point by formulas of first, second and fourth order, and measured in high precision at the thresholds the papers use, they keep about 3, 6 and 12 correct digits.",
  source: "The three cases come from my papers on isotropic materials: the material-capture paper (SIGGRAPH Asia 2023, Appendices C–D), the elastic-rod paper (SIGGRAPH 2025, Section 4 and Appendix G) and the thin-shell paper (SIGGRAPH Asia 2026, Section 9 and Appendices C, E, F). The error measurements are new: I re-ran each paper's formula on a test material in high precision for this note. This material was part of version 1 of Removable Singularities, Numerically.",
};
