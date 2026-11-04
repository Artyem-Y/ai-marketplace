const STOP_WORDS = new Set(['i', 'me', 'my', 'a', 'an', 'the', 'for', 'to', 'of', 'in', 'on', 'with', 'need', 'want', 'find', 'show', 'please', 'skill', 'plugin', 'agent']);
const TYPES = new Set(['all', 'plugin', 'skill', 'agent']);
const PAGES = new Set(['getting-started', 'whats-new']);

export function searchCatalog(items, query, type = 'all') {
  const terms = [...new Set((query.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(term => !STOP_WORDS.has(term)))];
  return items.flatMap(item => {
    if (type !== 'all' && item.type !== type) return [];
    const fields = [['name', item.name, 8, item.path], ['description', item.description, 4, item.path], ['plugin', item.plugin, 2, item.path], ['body', item.body, 1, item.path], ...(item.documents ?? []).map(document => ['supporting document', document.body, 1, document.path])];
    let score = 0;
    let match = null;
    const matches = new Map();
    for (const term of terms) {
      let found = false;
      for (const [field, value, weight, path] of fields) {
        const text = String(value ?? '');
        const index = text.toLocaleLowerCase().indexOf(term);
        if (index < 0) continue;
        found = true;
        score += weight;
        const foundMatch = { path, excerpt: text.slice(Math.max(0, index - 40), index + term.length + 80), field };
        if (!match) match = foundMatch;
        if (!matches.has(path)) matches.set(path, foundMatch);
      }
      if (!found) return [];
    }
    return [{ item, score, match, matches:[...matches.values()] }];
  }).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name) || a.item.id.localeCompare(b.item.id));
}

export function parseLocation(hash) {
  const params = new URLSearchParams(hash.replace(/^#\??/, ''));
  const type = params.get('type');
  const page = params.get('page');
  return { query: params.get('q') ?? '', type: TYPES.has(type) ? type : 'all', selected: params.get('artifact') || null, ...(PAGES.has(page) ? {page} : {}) };
}

export function catalogHash({ query, type, selected, page }) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (type && type !== 'all') params.set('type', type);
  if (selected) params.set('artifact', selected);
  if (PAGES.has(page)) params.set('page', page);
  return params.toString() ? `#?${params}` : '#';
}
