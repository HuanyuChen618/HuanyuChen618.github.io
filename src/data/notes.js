// Research notes ("cards"). Each card's metadata lives in its own file in ./notes/<slug>.js and its body in
// src/cards/<slug>.astro, so one card can be reused by several series. slug never changes once published: it is the
// permanent, citable address (/notes/<slug>). Set draft: true to keep a card out of the index, series and RSS feed.
import { series } from './series.js';

const mods = import.meta.glob('./notes/*.js', { eager: true });
export const allNotes = Object.values(mods).map((m) => m.default);
export const notes = allNotes.filter((n) => !n.draft).sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));
const bySlug = new Map(allNotes.map((n) => [n.slug, n]));
export const getNote = (slug) => bySlug.get(slug);

export const AUTHOR = 'Huanyu Chen';
export const SITE = 'https://huanyuchen.com';

// Series with their published cards, in reading order.
export const seriesList = series
  .map((s) => ({ ...s, cards: s.order.map(getNote).filter((n) => n && !n.draft) }))
  .filter((s) => s.cards.length);
export const isOptional = (s, slug) => (s.optional || []).includes(slug);
export const getSeries = (id) => seriesList.find((s) => s.id === id);
export const seriesUrl = (id, slug) => `/notes/series/${id}/${slug ? `#card-${slug}` : ''}`;
// Representative images for a series tile: the covers it names, or its first three cards.
export const seriesReps = (s) => (s.reps || s.cards.slice(0, 3).map((n) => n.slug)).map((k) => `/notes/thumbs/${k}.webp`);

// Every series a card appears in, with its place and neighbours there.
export function seriesOf(slug) {
  return seriesList.flatMap((s) => {
    const i = s.cards.findIndex((n) => n.slug === slug);
    if (i < 0) return [];
    return [{ series: s, index: i + 1, count: s.cards.length, prev: s.cards[i - 1] || null, next: s.cards[i + 1] || null }];
  });
}

// Other series, most related first: shared cards count most, then "builds on" links between the two, then shared tags.
export function relatedSeries(id) {
  const s = getSeries(id);
  const mine = new Set(s.cards.map((n) => n.slug));
  const tags = new Set(s.cards.flatMap((n) => n.tags));
  return seriesList
    .filter((o) => o.id !== id)
    .map((o) => {
      const theirs = new Set(o.cards.map((n) => n.slug));
      const shared = o.cards.filter((n) => mine.has(n.slug)).length;
      const links = o.cards.filter((n) => (n.requires || []).some((r) => mine.has(r))).length
        + s.cards.filter((n) => (n.requires || []).some((r) => theirs.has(r))).length;
      const tagHits = new Set(o.cards.flatMap((n) => n.tags).filter((t) => tags.has(t))).size;
      return { series: o, shared, score: 3 * shared + 2 * links + tagHits };
    })
    .sort((a, b) => b.score - a.score);
}

// Layout of a series' "builds on" graph. Cards that are not connected to each other form separate threads, and each
// thread gets its own band of rows; inside a thread, column = longest chain of prerequisites, and a column with fewer
// cards than the thread is tall is centred. row may be fractional; nrows is the total height in rows.
export function cardGraph(s) {
  const inS = new Set(s.cards.map((n) => n.slug));
  const reqs = (n) => (n.requires || []).filter((r) => inS.has(r));
  const depth = new Map();
  const d = (n) => {
    if (!depth.has(n.slug)) depth.set(n.slug, 1 + Math.max(-1, ...reqs(n).map((r) => d(getNote(r)))));
    return depth.get(n.slug);
  };
  s.cards.forEach(d);
  // a card with no prerequisites sits just left of the first card that uses it, not at the far left
  const kids = (slug) => s.cards.filter((n) => reqs(n).includes(slug));
  for (const n of [...s.cards].reverse()) {
    const k = kids(n.slug);
    if (!reqs(n).length && k.length) depth.set(n.slug, Math.min(...k.map((c) => depth.get(c.slug))) - 1);
  }
  // threads = connected components, ordered by their first card in reading order
  const parent = new Map(s.cards.map((n) => [n.slug, n.slug]));
  const find = (x) => (parent.get(x) === x ? x : find(parent.get(x)));
  s.cards.forEach((n) => reqs(n).forEach((r) => parent.set(find(r), find(n.slug))));
  const threads = [];
  s.cards.forEach((n, i) => {
    const root = find(n.slug);
    let t = threads.find((x) => x.root === root);
    if (!t) threads.push((t = { root, cols: [] }));
    (t.cols[depth.get(n.slug)] ||= []).push({ n, i });
  });
  // order each column to reduce crossings: a few sweeps that sort cards by the mean row of their neighbours
  const rowOf = new Map();
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const sortCol = (col, nb) => {
    const key = new Map(col.map((x) => [x, mean(nb(x.n).map((m) => rowOf.get(m)).filter((v) => v !== undefined)) ?? rowOf.get(x.n.slug)]));
    col.sort((a, b) => key.get(a) - key.get(b) || a.i - b.i);
    col.forEach((x, r) => rowOf.set(x.n.slug, r));
  };
  for (const t of threads) {
    t.cols.forEach((col) => col && col.forEach((x, r) => rowOf.set(x.n.slug, r)));
    for (let sweep = 0; sweep < 3; sweep++) {
      t.cols.forEach((col) => col && sortCol(col, (n) => reqs(n)));
      [...t.cols].reverse().forEach((col) => col && sortCol(col, (n) => kids(n.slug).map((k) => k.slug)));
    }
  }
  const nodes = [];
  let top = 0;
  for (const t of threads) {
    const h = Math.max(...t.cols.filter(Boolean).map((c) => c.length));
    t.cols.forEach((col, c) => col && col.forEach((x, r) => nodes.push({ ...x, col: c, row: top + r + (h - col.length) / 2 })));
    top += h;
  }
  const edges = s.cards.flatMap((n) => reqs(n).map((r) => [r, n.slug]));
  return { nodes, edges, ncols: 1 + Math.max(...depth.values()), nrows: top };
}
