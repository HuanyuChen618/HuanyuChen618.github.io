// Series group notes into a reading order. A note joins a series by listing its slug in `order`
// (and setting `series` in its metadata). Notes that are not published yet are skipped automatically.
export const series = [
  {
    id: 'differentiating-physics',
    title: 'Differentiating Physics',
    blurb: 'How to get derivatives out of simulations and geometry, and the places where it quietly goes wrong.',
    order: ['adjoint-method', 'gauss-newton', 'axis-angle-derivatives', 'removable-singularities', 'autodiff-removable-singularities'],
  },
  {
    id: 'isotropic-materials',
    title: 'Isotropic Materials',
    blurb: 'What an isotropic elastic energy is, the three ways to write one down, how to differentiate it, and what keeps it well behaved.',
    order: ['three-ways-to-write-a-material', 'isotropic-gradient-hessian', 'material-zoo', 'polyconvexity', 'distortion-vs-material'],
  },
];
