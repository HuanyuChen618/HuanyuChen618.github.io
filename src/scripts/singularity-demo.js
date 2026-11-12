// Interactive error plot for removable singularities, shared by several cards. mount(prefix, cases, defaults) wires up
// the elements with ids `${prefix}-case`, `-n`, `-nv`, `-tau`, `-tv`, `-paper`, `-best`, `-canvas`, `-legend`, `-read`.
import { taylor, reference, switched, relerr, samples } from './removable-singularities.js';

export function mount(prefix, ALL, DEFAULT_N = {}) {
  const $ = (s) => document.getElementById(`${prefix}-${s}`);
  const cv = $('canvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height, L = 70, R = 20, Tm = 16, B = 46;
  const sel = $('case'), nS = $('n'), tS = $('tau'), paperBtn = $('paper');
  ALL.forEach((c, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = c.label; sel.appendChild(o); });
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#000';
  const EMIN = -17, EMAX = 1;
  const sup = (k) => String(k).split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch]).join('');

  function worst(c, n, tau, xs) {
    let w = 0; for (const x of xs) w = Math.max(w, relerr(switched(c, x, n, tau), reference(c, x))); return w;
  }
  function bestTau(c, n, xs) {
    let best = [Infinity, 0];
    for (let e = Math.log10(c.xmin); e <= Math.log10(c.xmax); e += 0.05) { const t = Math.pow(10, e), w = worst(c, n, t, xs); if (w < best[0]) best = [w, t]; }
    return best;
  }
  function setCase() {
    const c = ALL[+sel.value];
    const nmax = c.nmax ?? 6; nS.max = String(nmax); nS.disabled = nmax === 0;
    nS.value = String(DEFAULT_N[c.id] ?? Math.min(2, nmax));
    tS.min = String(Math.floor(Math.log10(c.xmin)));
    tS.value = String(c.paperTau ? Math.log10(c.paperTau) : -3);
    if (paperBtn) paperBtn.hidden = !c.paperTau;
    draw();
  }

  function draw() {
    const c = ALL[+sel.value], n = +nS.value, tau = Math.pow(10, +tS.value);
    $('nv').textContent = c.termsLabel ? c.termsLabel(n) : `${n + 1} (through ${c.var ?? 'x'}${sup(c.step * n)})`;
    $('tv').textContent = tau.toExponential(1);
    const ink = css('--ink'), muted = css('--muted'), link = css('--link'), line = css('--line'), bg = css('--bg');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const a = Math.log10(c.xmin), b = Math.log10(c.xmax);
    const px = (x) => L + ((Math.log10(x) - a) / (b - a)) * (W - L - R);
    const py = (e) => { const l = Math.log10(Math.max(e, 1e-17)); const k = Number.isFinite(l) ? Math.min(Math.max(l, EMIN), EMAX) : EMAX; return Tm + ((EMAX - k) / (EMAX - EMIN)) * (H - Tm - B); };
    ctx.strokeStyle = line; ctx.fillStyle = muted; ctx.lineWidth = 1; ctx.font = '13px system-ui, sans-serif';
    for (let e = EMIN + 1; e <= EMAX; e += 2) { const y = py(Math.pow(10, e)); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(W - R, y); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(`1e${e}`, L - 6, y + 4); }
    for (let e = Math.ceil(a); e <= Math.floor(b); e += (b - a > 8 ? 2 : 1)) { const x = px(Math.pow(10, e)); ctx.beginPath(); ctx.moveTo(x, Tm); ctx.lineTo(x, H - B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(`1e${e}`, x, H - B + 18); }
    ctx.textAlign = 'center'; ctx.fillText(c.xlabel ?? 'x', (L + W - R) / 2, H - 8);
    ctx.save(); ctx.translate(16, (Tm + H - B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('relative error', 0, 0); ctx.restore();
    const xs = samples(c, 360);
    const curve = (f, col, w, dash = []) => {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath();
      xs.forEach((x, i) => { const e = relerr(f(x), reference(c, x)); const X = px(x), Y = py(e); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke(); ctx.setLineDash([]);
    };
    curve((x) => c.naive(x), muted, 2);
    curve((x) => taylor(c, x, n), muted, 1.5, [6, 5]);
    if (c.stable) curve((x) => c.stable(x), ink, 1.5);
    curve((x) => switched(c, x, n, tau), link, 3);
    if (tau >= c.xmin && tau <= c.xmax) { ctx.strokeStyle = link; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(px(tau), Tm); ctx.lineTo(px(tau), H - B); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = link; ctx.textAlign = 'left'; ctx.fillText('τ', px(tau) + 5, Tm + 14); }
    $('legend').innerHTML = `<span style="--c:${muted}">naive formula</span><span class="dash" style="--c:${muted}">${c.taylorFn ? 'small-d formula only' : 'Taylor series only'}</span>` +
      (c.stable ? `<span style="--c:${ink}">rewrite: ${c.stableLabel}</span>` : '') + `<span style="--c:${link}"><strong>switched</strong> (small-d formula below τ)</span>`;
    const w = worst(c, n, tau, xs), bt = bestTau(c, n, xs);
    $('read').innerHTML =
      `Worst relative error of the switched version over this range: <strong>${w.toExponential(1)}</strong>` +
      ` (about ${Math.max(0, Math.floor(-Math.log10(Math.max(w, 1e-17))))} correct digits). Best τ for this setting: ${bt[1].toExponential(1)}, giving ${bt[0].toExponential(1)}.` +
      ` Exactly at the singular point, the naive formula returns ${String(c.naive(0))}${c.stable ? ' and so does the rewrite' : ''}.`;
  }
  $('best').addEventListener('click', () => {
    const c = ALL[+sel.value]; const bt = bestTau(c, +nS.value, samples(c, 360)); tS.value = String(Math.log10(bt[1])); draw();
  });
  if (paperBtn) paperBtn.addEventListener('click', () => { const c = ALL[+sel.value]; if (c.paperTau) { tS.value = String(Math.log10(c.paperTau)); draw(); } });
  sel.addEventListener('input', setCase);
  [nS, tS].forEach((e) => e.addEventListener('input', draw));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  setCase();
}
