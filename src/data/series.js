// A series is a reading order over cards. Cards are reusable: the same slug may appear in several series.
// order: the recommended order (unpublished cards are skipped). reps: the cover images shown on the Notes index
// (defaults to the first three cards). optional: cards shown collapsed, off the main path. Dependencies between cards live on the cards themselves (requires: [...]).
export const series = [
  {
    id: 'differentiating-physics',
    title: 'Differentiating Physics',
    blurb: 'How to get derivatives out of simulations and geometry, and the places where it quietly goes wrong.',
    order: ['adjoint-method', 'gauss-newton', 'axis-angle-derivatives', 'removable-singularities', 'autodiff-removable-singularities'],
    reps: ['gauss-newton', 'adjoint-method', 'axis-angle-derivatives'],
  },
  {
    id: 'isotropic-materials',
    title: 'Isotropic Materials',
    blurb: 'What an isotropic elastic energy is, the three ways to write one down, how the familiar materials compare, and what keeps them well behaved.',
    order: ['three-ways-to-write-a-material', 'isotropic-gradient-hessian', 'removable-singularities', 'stretch-hessian-singularities',
      'material-zoo', 'polyconvexity', 'distortion-vs-material'],
    optional: ['isotropic-gradient-hessian', 'removable-singularities', 'stretch-hessian-singularities'],
    reps: ['polyconvexity', 'material-zoo', 'three-ways-to-write-a-material'],
  },
];
