export default {
  slug: 'adjoint-method',
  title: 'The Adjoint Method, Explained',
  hook: 'One backward pass gives every derivative at once. Steer a ball to see it.',
  summary: 'Why one backward solve gives the gradient with respect to every parameter at once, for equilibrium problems and for time-stepping simulations, with an interactive demo you can optimize by hand.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['differentiable simulation', 'optimization'],
  short: "The adjoint method",
  requires: [],
  tldr: "If a simulation depends on many parameters and you only need the gradient of one number, solve one extra linear system with the transposed Jacobian (or run time backward once), and you get the derivative with respect to every parameter at once.",
  source: "The equilibrium case is the one I needed in my SIGGRAPH Asia 2023 paper with Danyong Zhao and Jernej Barbič, where we fit nonlinear materials to poking measurements by differentiating a quasi-static FEM simulation (Sections 4.4 and 7, Equation 16, Appendix E). The section on poking below walks through it.",
};
