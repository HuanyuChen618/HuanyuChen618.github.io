export default {
  slug: 'distortion-vs-material',
  title: 'Distortion Measures vs Material Energies',
  hook: 'Distortion energies from geometry processing vs materials from mechanics: same math, different rules.',
  summary: 'Geometry processing and mechanics both write energies as functions of singular values, often the very same functions. What they share, where they differ (symmetry under inversion, scale, rest state, small-strain limit, barriers), and a plot that puts both families side by side.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['geometry processing', 'materials', 'nonlinear elasticity'],
  short: "Distortion vs material",
  requires: ["material-zoo"],
  tldr: "Distortion measures in geometry processing and hyperelastic energies in mechanics are the same kind of object, a rotation-invariant function of singular values, and can be read with the same tools (Lamé parameters at rest, a nonlinearity index beyond it), which shows exactly where they differ: the rest state, the missing volume stiffness, the symmetry between shrinking and stretching, and the barrier at zero.",
  source: "This translation table grew out of my SCA 2026 paper, whose Table 1 lists geometry-processing energies (ARAP, symmetric ARAP, symmetric Dirichlet) next to the materials of mechanics and reads all of them through the same linear and weakly nonlinear lenses. Before that, my bachelor thesis was on bijective spherical parameterization, where distortion measures rule.",
};
