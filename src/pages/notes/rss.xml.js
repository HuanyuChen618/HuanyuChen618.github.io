// RSS feed for the research notes (used by feed readers and by Rogue Scholar to assign DOIs).
import { notes, AUTHOR, SITE } from '../../data/notes.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function GET() {
  const items = notes.map((n) => {
    const url = `${SITE}/notes/${n.slug}/`;
    return `    <item>
      <title>${esc(n.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(n.published + 'T12:00:00Z').toUTCString()}</pubDate>
      <dc:creator>${esc(AUTHOR)}</dc:creator>
      <description>${esc(n.summary)}</description>
${n.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
    </item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Huanyu Chen — Notes</title>
    <link>${SITE}/notes/</link>
    <atom:link href="${SITE}/notes/rss.xml" rel="self" type="application/rss+xml" />
    <description>Short research notes on simulation, mechanics and optimization.</description>
    <language>en</language>
    <copyright>CC BY 4.0</copyright>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
