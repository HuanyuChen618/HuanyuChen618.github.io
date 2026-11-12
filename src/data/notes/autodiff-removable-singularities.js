export default {
  slug: 'autodiff-removable-singularities',
  title: 'Why Removable Singularities Are Bad for Autodiff',
  summary: 'Automatic differentiation differentiates your program, not your function. On a real case from my elastic-rod paper: a guarded branch gives zero derivatives, a second-order switch formula gives a second derivative that is 20% off at rest, and a masked branch can poison a gradient with NaN. Two tiny AD engines you can poke at.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['automatic differentiation', 'numerics', 'isotropic materials'],
  series: 'differentiating-physics',
};
