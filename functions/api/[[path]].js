import stats from '../../api/index.js';
import languages from '../../api/top-langs.js';
import pin from '../../api/pin.js';
import gist from '../../api/gist.js';
import wakatime from '../../api/wakatime.js';
import up from '../../api/status/up.js';
import patInfo from '../../api/status/pat-info.js';

const handlers = { '': stats, index: stats, 'top-langs': languages, pin, gist, wakatime, 'status/up': up, 'status/pat-info': patInfo };

export async function onRequest({ request, params }) {
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path ?? '');
  const handler = Object.hasOwn(handlers, path) ? handlers[path] : null;
  if (!handler) return new Response('Not found', { status: 404 });
  const url = new URL(request.url);
  const query = Object.create(null);
  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length === 1 ? values[0] : values;
  }
  const headers = new Headers();
  let body = null;
  const res = {
    statusCode: 200,
    setHeader(name, value) { headers.set(name, value); },
    status(code) { this.statusCode = code; return this; },
    send(value) {
      if (typeof value === 'object' || typeof value === 'boolean') {
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        body = JSON.stringify(value);
      } else { body = value; }
      return this;
    },
    end(value) { return this.send(value); }
  };
  await handler({ query, method: request.method, headers: Object.fromEntries(request.headers) }, res);
  return new Response(request.method === 'HEAD' ? null : body, { status: res.statusCode, headers });
}
