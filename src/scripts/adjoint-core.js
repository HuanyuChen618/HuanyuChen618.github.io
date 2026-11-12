// Core of the adjoint demo: a 2D particle with gravity and quadratic air drag, pushed by a control force u_t at
// every step. Loss: half the squared distance from the final position to the target, plus a small control cost.
// grad() returns dL/du for all controls from one forward pass and one backward (adjoint) pass.

export const G = [0, -9.8];
export const K = 0.12; // quadratic drag coefficient
export const ALPHA = 0.002; // control cost weight
export const TOTAL = 1.6; // simulated seconds, split into T steps

// one step: v' = v + dt (u + g - K|v| v), p' = p + dt v'
export function simulate(p0, v0, u, T) {
  const dt = TOTAL / T;
  const P = [p0.slice()], V = [v0.slice()];
  for (let t = 0; t < T; t++) {
    const v = V[t], s = Math.hypot(v[0], v[1]);
    const vn = [v[0] + dt * (u[2 * t] + G[0] - K * s * v[0]), v[1] + dt * (u[2 * t + 1] + G[1] - K * s * v[1])];
    V.push(vn);
    P.push([P[t][0] + dt * vn[0], P[t][1] + dt * vn[1]]);
  }
  return { P, V, dt };
}

export function loss(sim, u, target) {
  const pT = sim.P[sim.P.length - 1];
  let r = 0;
  for (let i = 0; i < u.length; i++) r += u[i] * u[i];
  return 0.5 * ((pT[0] - target[0]) ** 2 + (pT[1] - target[1]) ** 2) + 0.5 * ALPHA * sim.dt * r;
}

// d(|v| v)/dv = |v| I + v v^T / |v|  (zero at v = 0)
function dragJac(v) {
  const s = Math.hypot(v[0], v[1]);
  if (s < 1e-12) return [0, 0, 0, 0];
  return [s + v[0] * v[0] / s, v[0] * v[1] / s, v[1] * v[0] / s, s + v[1] * v[1] / s];
}

// Adjoint pass. State x_t = (p_t, v_t). Returns gradient wrt u and the adjoints (lp, lv) at every step.
export function grad(sim, u, target) {
  const { P, V, dt } = sim, T = P.length - 1;
  const g = new Float64Array(u.length);
  const LP = new Array(T + 1), LV = new Array(T + 1);
  // lambda_T = dL/dx_T
  let lp = [P[T][0] - target[0], P[T][1] - target[1]], lv = [0, 0];
  LP[T] = lp; LV[T] = lv;
  for (let t = T - 1; t >= 0; t--) {
    // step t -> t+1:  v' = v + dt(u + g - K D(v)),  p' = p + dt v'
    // so dv'/dv = I - dt K J,  dp'/dv = dt (I - dt K J),  dp'/dp = I,  dv'/du = dt I,  dp'/du = dt^2 I
    // first collect the adjoint of v' (direct plus through p')
    const av = [lv[0] + dt * lp[0], lv[1] + dt * lp[1]];
    g[2 * t] = dt * av[0] + ALPHA * dt * u[2 * t];
    g[2 * t + 1] = dt * av[1] + ALPHA * dt * u[2 * t + 1];
    const J = dragJac(V[t]);
    // lambda_v(t) = (I - dt K J)^T av ;  lambda_p(t) = lambda_p(t+1)
    const nlv = [av[0] - dt * K * (J[0] * av[0] + J[2] * av[1]), av[1] - dt * K * (J[1] * av[0] + J[3] * av[1])];
    lv = nlv; // lp unchanged: dp'/dp = I and dv'/dp = 0
    LP[t] = lp; LV[t] = lv;
  }
  return { g, LP, LV };
}
