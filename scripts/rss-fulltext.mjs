// Runs after `astro build`: puts each note's full text into dist/notes/rss.xml as <content:encoded>.
// Feed readers can't run the interactive demos, so each demo figure is replaced by a link to the page,
// equations keep only their MathML (KaTeX's HTML layer needs the site's CSS), and links are made absolute.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DIST = process.argv[2] || 'dist';
const SITE = 'https://huanyuchen.com';
const feedPath = `${DIST}/notes/rss.xml`;
if (!existsSync(feedPath)) { console.log('rss-fulltext: no feed, skipping'); process.exit(0); }

// remove every element that starts with `open` (e.g. '<span class="katex-html"'), balancing nested tags of `tag`
function removeBalanced(html, open, tag) {
  let out = '', i = 0;
  for (;;) {
    const s = html.indexOf(open, i);
    if (s < 0) return out + html.slice(i);
    out += html.slice(i, s);
    let depth = 0, j = s;
    const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
    re.lastIndex = s;
    let m;
    while ((m = re.exec(html))) {
      depth += m[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { j = re.lastIndex; break; }
    }
    if (depth !== 0) return out + html.slice(s); // unbalanced: leave the rest untouched
    i = j;
  }
}

function fullText(slug) {
  const p = `${DIST}/notes/${slug}/index.html`;
  if (!existsSync(p)) return null;
  const html = readFileSync(p, 'utf8');
  const a = html.indexOf('<article'), b = html.lastIndexOf('</article>');
  if (a < 0 || b < 0) return null;
  let body = html.slice(html.indexOf('>', a) + 1, b);
  const url = `${SITE}/notes/${slug}/`;
  body = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  // figures that contain a canvas are interactive demos
  body = body.replace(/<figure\b[^>]*>(?:(?!<\/figure>)[\s\S])*?<canvas[\s\S]*?<\/figure>/g,
    `<p><em>[Interactive demo — <a href="${url}">open the note</a> to try it.]</em></p>`);
  body = body.replace(/<canvas[\s\S]*?<\/canvas>/g, '');
  body = removeBalanced(body, '<span class="katex-html"', 'span');
  body = body.replace(/<button[\s\S]*?<\/button>/g, '');
  body = body.replace(/<section class="note-cite"[\s\S]*?<\/section>/, '');
  body = body.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE}/`);
  body = body.replace(/\s(data-astro-cid-[a-z0-9]+|data-[a-z-]+="[^"]*")/g, '');
  return body.replace(/]]>/g, ']]&gt;');
}

let xml = readFileSync(feedPath, 'utf8');
if (!xml.includes('xmlns:content=')) xml = xml.replace('<rss version="2.0"', '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"');
let n = 0;
xml = xml.replace(/<item>([\s\S]*?)<\/item>/g, (whole, inner) => {
  if (inner.includes('<content:encoded>')) return whole;
  const slug = (inner.match(/<link>https?:\/\/[^<]*\/notes\/([^/<]+)\/?<\/link>/) || [])[1];
  const body = slug && fullText(slug);
  if (!body) return whole;
  n++;
  return `<item>${inner.replace(/\s*$/, '')}\n      <content:encoded><![CDATA[${body}]]></content:encoded>\n    </item>`;
});
writeFileSync(feedPath, xml);
console.log(`rss-fulltext: full text added to ${n} items`);
