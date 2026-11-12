export default {
  slug: 'gauss-newton',
  title: 'Gauss-Newton and Its Variants',
  hook: 'Drop one Hessian term and converge in a handful of steps. Watch four methods race.',
  summary: 'Why dropping one term of the Hessian makes nonlinear least squares fast and safe when the fit is good, why it slows down when the fit is bad, and how line search and Levenberg-Marquardt damping fix the rest, with a demo that races four methods on a contour plot.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 1,
  tags: ['optimization', 'nonlinear least squares'],
  short: "Gauss-Newton",
  requires: ["adjoint-method"],
  tldr: "For a sum of squares, Gauss-Newton replaces the Hessian by J transpose J, which needs only first derivatives and always points downhill; it is as fast as Newton when the fit is good, slower when the residuals stay large, and Levenberg-Marquardt damping makes it robust far from the answer.",
  source: "The optimizer in my SIGGRAPH Asia 2023 paper with Danyong Zhao and Jernej Barbič, which fits nonlinear isotropic materials to poking force measurements, is a Gauss-Newton method with an exact scaling step (Section 7, Figure 10, Appendix E). This note explains the method in general and then shows how it was used there.",
};
