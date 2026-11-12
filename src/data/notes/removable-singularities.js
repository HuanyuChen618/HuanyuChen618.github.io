export default {
  slug: 'removable-singularities',
  title: 'Removable Singularities, Numerically',
  hook: 'Fill the 0/0 hole in a formula, and pick where to switch, with nothing but Taylor series.',
  summary: 'Why formulas like (f(a) − f(b))/(a − b) are undefined at one point and inaccurate near it, three ways to fill the hole (the limit, the average of two slopes, more Taylor terms), and a simple rule for where to switch, checked in 50-digit arithmetic with an interactive error plot.',
  published: '2026-11-12',
  updated: '2026-11-12',
  version: 2,
  tags: ['numerics', 'floating point'],
  short: "Removable singularities",
  requires: [],
  tldr: "A formula with a removable singularity, such as the divided difference (f(a) − f(b))/(a − b), is undefined at the bad point and quietly inaccurate near it; the fix is a short Taylor formula switched in below a threshold of roughly ε^(1/(1+p)), where p is the formula's order, and averaging the two endpoint slopes instead of taking the limit gains an order for free.",
  source: "The examples are classical. The threshold rule and the error measurements (against 50-digit reference values) were made for this note. Version 1 also covered the isotropic-material cases from my papers; they now have their own card, Singularities in Stretch-Based Hessians.",
};
