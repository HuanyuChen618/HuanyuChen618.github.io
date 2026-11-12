// Research notes. Each note's metadata lives in its own file in ./notes/<slug>.js (so notes can be written
// independently); this module collects them. slug never changes once published: it is the permanent, citable address.
// Set draft: true to keep a note out of the index and the RSS feed while it is being written.
import { series } from './series.js';

const mods = import.meta.glob('./notes/*.js', { eager: true });
export const allNotes = Object.values(mods).map((m) => m.default);
export const notes = allNotes.filter((n) => !n.draft).sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));

export const AUTHOR = 'Huanyu Chen';
export const SITE = 'https://huanyuchen.com';

// The series a note belongs to, and its neighbours in that series' reading order (published notes only).
export function seriesNav(slug) {
  for (const s of series) {
    const live = s.order.filter((x) => notes.some((n) => n.slug === x) || x === slug);
    const i = live.indexOf(slug);
    if (i < 0) continue;
    const get = (k) => allNotes.find((n) => n.slug === k);
    return { series: s, index: i + 1, count: live.length, prev: i > 0 ? get(live[i - 1]) : null, next: i < live.length - 1 ? get(live[i + 1]) : null };
  }
  return null;
}
