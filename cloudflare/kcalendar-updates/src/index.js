/**
 * kcalendar-updates — serves the KCalendar installer zip from Cloudflare R2.
 *
 *   /KCalendar-Install.zip            the current installer (follows latest.json);
 *                                     this is the link on the download page
 *   /latest.json                      {"version": "..."} — never cached
 *   /v<ver>/KCalendar-Install.zip     one version's installer; never changes, so
 *                                     version.json's "download" points here
 *
 * Read-only: no listing, no uploads. publish.ps1 uploads the zip first and
 * latest.json last, so the stable link never points at a file that isn't there.
 */

const ZIP = 'KCalendar-Install.zip';
// yyyy.mm.dd exactly, the only form installed KCalendar accepts ("####.##.##")
const VERSIONED = /^v(\d{4}\.\d{2}\.\d{2})\/KCalendar-Install\.zip$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, ETag',
};

function notFound() {
  return new Response('Not found', { status: 404, headers: CORS });
}

async function currentVersion(env) {
  const obj = await env.RELEASES.get('latest.json');
  if (!obj) return null;
  try {
    const v = String((await obj.json()).version || '');
    return /^\d{4}\.\d{2}\.\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { ...CORS, Allow: 'GET, HEAD, OPTIONS' } });
    }

    let path;
    try { path = decodeURIComponent(new URL(request.url).pathname.replace(/^\/+/, '')); }
    catch { return notFound(); }

    let key;
    let cache;
    if (path === 'latest.json') {
      key = path;
      cache = 'no-cache, no-store, must-revalidate';
    } else if (path === ZIP) {
      const v = await currentVersion(env);
      if (!v) return notFound();
      key = `v${v}/${ZIP}`;
      cache = 'no-cache, must-revalidate';          // follows each new release
    } else if (VERSIONED.test(path)) {
      key = path;
      cache = 'public, max-age=86400, immutable';   // a version's zip never changes
    } else {
      return notFound();
    }

    const headers = new Headers(CORS);
    headers.set('Cache-Control', cache);

    const object = request.method === 'HEAD' ? await env.RELEASES.head(key) : await env.RELEASES.get(key);
    if (object === null) return notFound();
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Content-Length', String(object.size));
    if (key.endsWith('.zip')) headers.set('Content-Disposition', `attachment; filename="${ZIP}"`);
    return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
  },
};
