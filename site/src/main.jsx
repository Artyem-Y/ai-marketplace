import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { catalogHash, parseLocation, searchCatalog } from './catalog.js';
import { messages as m } from './messages.js';
import { instructionsFor } from './install-instructions.js';
import { sourceUrl } from './source-link.js';
import './style.css';
import './navigation.css';

function Installation({item}) {
  const instructions = instructionsFor(item);
  const [copyStatus, setCopyStatus] = useState('');
  async function copy(command) {
    try { await navigator.clipboard.writeText(command); setCopyStatus(m.copied); }
    catch { setCopyStatus(m.copyFailed); }
  }
  if (!instructions) return <><h2>{m.installation}</h2><p>{m.notSpecified}</p></>;
  return <section className="installation"><h2>{m.codexInstall}</h2>
    {item.type !== 'plugin' && <p>{m.componentInstall(instructions.plugin)}</p>}
    <p>{m.registerOnce}</p><ol>{instructions.commands.map((command, index) => <li key={command}>
      <div className="install-command"><code>{command}</code><button type="button" aria-label={m.copyCommand(index + 1)} onClick={() => copy(command)}>{m.copy}</button></div>
    </li>)}</ol><p aria-live="polite">{copyStatus}</p>
    {instructions.commands.length > 2 && <p>{m.dependencyHelp}</p>}
    {item.type === 'agent' && <p>{m.agentDiscovery}</p>}{item.type === 'skill' && <p>{m.skillDiscovery}</p>}
    <p>{m.startSession}</p>
  </section>;
}

function ArtifactDetail({item, items, build, navigate}) {
  const parent = item.plugin && items.find(candidate => candidate.id === `plugin:${item.plugin}`);
  const source = sourceUrl(item.path, build?.commit);
  return <section className="detail artifact-detail">
    <nav className="breadcrumbs" aria-label={m.breadcrumb}>
      <button onClick={() => navigate({selected:null})}>{m.catalog}</button>
      {parent && <><span aria-hidden="true">/</span><button onClick={() => navigate({selected:parent.id})}>{parent.name}</button></>}
      <span aria-hidden="true">/</span><span aria-current="page">{item.name}</span>
    </nav>
    <div className="artifact-meta"><span className={`artifact-badge ${item.type}`}>{m.types[item.type]}</span>{parent && <span>{m.partOf} <button className="inline-link" onClick={() => navigate({selected:parent.id})}>{parent.name}</button>{parent.version && ` v${parent.version}`}</span>}</div>
    <h1>{item.name}</h1><p className="artifact-summary">{item.description}</p>
    <Installation key={item.id} item={item} />
    <div className="detail-columns"><section className="source-panel"><div className="source-heading"><code>{item.path}</code>{source && <a href={source} target="_blank" rel="noreferrer">{m.viewSource} ↗</a>}</div>
      <div className="source-content"><h2>{m.documentation}</h2>{item.body ? <pre>{item.body}</pre> : <p>{m.noDescription}</p>}
      {item.type === 'plugin' && <><h2>{m.components}</h2>{item.children?.length ? <ul>{item.children.map(id => { const child = items.find(candidate => candidate.id === id); return <li key={id}>{child ? <button className="inline-link" onClick={() => navigate({selected:id})}>{m.types[child.type]}: {child.name}</button> : m.unavailable}</li>; })}</ul> : <p>{m.noComponents}</p>}<h2>{m.dependencies}</h2>{item.dependencies?.length ? <ul>{item.dependencies.map(name => { const dep = items.find(candidate => candidate.id === `plugin:${name}`); return <li key={name}>{dep ? <button className="inline-link" onClick={() => navigate({selected:dep.id})}>{name}</button> : m.dependencyUnavailable(name)}</li>; })}</ul> : <p>{m.none}</p>}</>}
      </div></section><aside className="detail-sidebar">{item.tools?.length > 0 && <section><h2>{m.declaredTools}</h2><div className="tool-tags">{item.tools.map(tool => <span key={tool}>{tool}</span>)}</div><p>{m.declaredToolsHelp}</p></section>}
      <section><h2>{m.details}</h2><dl>{item.model && <><dt>{m.model}</dt><dd>{item.model}</dd></>}{item.version && <><dt>{m.version}</dt><dd>{item.version}</dd></>}<dt>{m.identifier}</dt><dd>{item.id}</dd><dt>{m.source}</dt><dd>{item.path}</dd><dt>{m.compatibility}</dt><dd>{m.notVerified}</dd></dl>{!source && <p>{m.sourceUnavailable}</p>}</section>
    </aside></div>
  </section>;
}

function CommandPalette({ items, open, onClose, onSelect }) {
  const dialog = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchCatalog(items, query).slice(0, 12), [items, query]);
  useEffect(() => {
    if (open && !dialog.current.open) { setQuery(''); setActive(0); dialog.current.showModal(); }
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  return <dialog ref={dialog} className="palette" aria-labelledby="palette-title" onClose={onClose} onKeyDown={event => {
    if (event.target.id !== 'palette-search') return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(value => Math.max(0, Math.min(value + 1, results.length - 1))); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => Math.max(value - 1, 0)); }
    if (event.key === 'Enter' && results[active]) { event.preventDefault(); onSelect(results[active].item.id); }
  }}><div className="palette-heading"><h2 id="palette-title">{m.searchArtifacts}</h2><button onClick={onClose} aria-label={m.closeSearch}>×</button></div>
    <label className="sr-only" htmlFor="palette-search">{m.searchArtifacts}</label><input id="palette-search" autoFocus value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} placeholder={m.searchKeyword} />
    <p className="palette-hint">{m.paletteHint}</p>
    <div aria-live="polite">{results.length ? results.map(({item}, index) => <button className={`palette-result ${index === active ? 'active' : ''}`} key={item.id} onMouseEnter={() => setActive(index)} onClick={() => onSelect(item.id)}>{item.name}<small>{m.types[item.type]}{item.plugin ? ` · ${item.plugin}` : ''}</small></button>) : <p>{m.noMatching}</p>}</div>
  </dialog>;
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState(() => parseLocation(window.location.hash));
  const [catalog, setCatalog] = useState({ state: 'loading', items: [] });
  const [attempt, setAttempt] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchInput = useRef(null);

  useEffect(() => {
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', m.description);
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true); }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !paletteOpen && searchInput.current && !event.target.closest('input, textarea, select, [contenteditable="true"]')) { event.preventDefault(); searchInput.current.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen]);

  useEffect(() => {
    const onHashChange = () => setView(parseLocation(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(change, replace = false) {
    const next = { ...view, ...change };
    if (replace) window.history.replaceState(null, '', catalogHash(next));
    else window.history.pushState(null, '', catalogHash(next));
    setView(next);
    if (next.selected !== view.selected || next.page !== view.page) {
      requestAnimationFrame(() => {
        if (!next.selected && !next.page && searchInput.current) searchInput.current.focus();
        else document.getElementById('main-content')?.focus();
      });
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}search-index.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Index unavailable'); return response.json(); })
      .then(data => { if (!Array.isArray(data.items)) throw new Error('Invalid index'); setCatalog({ state: 'ready', items: data.items, build: data.build }); })
      .catch(error => { if (error.name !== 'AbortError') setCatalog({ state: 'error', items: [] }); });
    return () => controller.abort();
  }, [attempt]);

  const results = useMemo(() => searchCatalog(catalog.items, view.query, view.type), [catalog.items, view.query, view.type]);
  const selected = catalog.items.find(item => item.id === view.selected);

  return <div className="app" data-theme={theme}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>{m.skip}</a>
    <header><a className="brand" href="#" onClick={event => { event.preventDefault(); navigate({selected: null, page:undefined}); }}><span>◆</span> {m.catalog} <small>{m.marketplace}</small></a>
      <nav aria-label={m.mainNavigation}><button onClick={() => navigate({selected:null, page:undefined})}>{m.catalog}</button><button onClick={() => navigate({selected:null, page:'getting-started'})}>{m.gettingStarted}</button><button onClick={() => navigate({selected:null, page:'whats-new'})}>{m.whatsNew}</button></nav>
      <button className="palette-trigger" onClick={() => setPaletteOpen(true)}>{m.search} <kbd>⌘ K</kbd></button>
      <button className="theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={m.switchTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀' : '☾'}</button>
      <a href="https://github.com/Artyem-Y/ai-marketplace" target="_blank" rel="noreferrer">{m.github}</a>
    </header>
    <main id="main-content" tabIndex="-1">
      {view.page === 'getting-started' ? <section className="detail"><div className="eyebrow">{m.guide}</div><h1>{m.gettingStarted}</h1><div className="panel"><h2>{m.register}</h2><p>{m.registerHelp}</p><h2>{m.installPlugins}</h2><p>{m.installHelp}</p><h2>{m.update}</h2><p>{m.updateHelp}</p><p>{m.commandsHelp} <a className="source-link" href="https://github.com/Artyem-Y/ai-marketplace/blob/main/docs/RELEASES.md">{m.releaseGuide}</a> {m.commandsHelpEnd}</p></div></section> : view.page === 'whats-new' ? <section className="detail"><div className="eyebrow">{m.releases}</div><h1>{m.whatsNew}</h1><div className="panel empty"><h2>{m.noReleases}</h2><p>{m.noReleasesHelp}</p></div></section> : view.selected && catalog.state === 'ready' ? selected ? <ArtifactDetail item={selected} items={catalog.items} build={catalog.build} navigate={navigate} /> : <section className="detail panel"><h1>{m.notFound}</h1><p>{m.notFoundHelp}</p><button onClick={() => navigate({selected: null})}>{m.backButton}</button></section> : <>
        <section className="hero"><div className="eyebrow">{m.heroTag}</div><h1>{m.heroTitle1}<br />{m.heroTitle2}</h1><p>{m.heroHelp}</p><label className="search"><span aria-hidden="true">⌕</span><input ref={searchInput} value={view.query} onChange={event => navigate({query:event.target.value}, true)} placeholder={m.searchPlaceholder} aria-label={m.searchCatalog} /></label><p className="search-help">{m.searchHelp}</p></section>
        {catalog.state === 'ready' && catalog.items.length > 0 && !view.query && view.type === 'all' && <section className="stats" aria-label={m.overview}>{['plugin','skill','agent'].map(type => <button key={type} onClick={() => navigate({type})}><strong>{catalog.items.filter(item => item.type === type).length}</strong><span>{m.typePlural[type]}</span></button>)}</section>}
        <section className="catalog"><div className="heading"><div><div className="eyebrow">{m.collection}</div><h2>{m.explore}</h2></div><span aria-live="polite">{catalog.state === 'ready' ? m.resultCount(results.length) : catalog.state === 'loading' ? m.loadingResults : m.resultsUnavailable}</span></div>
          <div className="filters" aria-label={m.filterType}>{['all', 'plugin', 'skill', 'agent'].map(value => <button key={value} className={view.type === value ? 'active' : ''} aria-pressed={view.type === value} onClick={() => navigate({type:value})}>{value === 'all' ? m.types.all : m.typePlural[value]}</button>)}</div>
          {catalog.state === 'loading' ? <div className="panel" role="status">{m.loading}</div> : catalog.state === 'error' ? <div className="panel" role="alert"><h3>{m.catalogUnavailable}</h3><p>{m.catalogUnavailableHelp}</p><button onClick={() => { setCatalog({state:'loading',items:[]}); setAttempt(value => value + 1); }}>{m.retry}</button></div> : catalog.items.length === 0 ? <div className="panel empty"><span>◇</span><h3>{m.catalogEmpty}</h3><p>{m.catalogEmptyHelp}</p></div> : results.length === 0 ? <div className="panel empty"><h3>{m.noMatchingTitle}</h3><p>{m.noMatchingHelp}</p><button onClick={() => navigate({query:'', type:'all'})}>{m.clear}</button></div> : <div className="grid">{results.map(({item, match, matches}) => <button className="card" key={item.id} onClick={() => navigate({selected:item.id})}><span className="kind">{m.types[item.type]}</span><h3>{item.name}</h3><p>{item.description}</p>{match && <small>{m.match(m.matchFields[match.field], match.excerpt)}</small>}{matches?.map(found => <small key={found.path}>{m.matchFile(found.path)}</small>)}<small>{item.plugin || m.types.plugin} · {item.path}</small></button>)}</div>}
        </section>
      </>}
    </main><footer>{m.footer} · {m.buildCommit} {catalog.build?.commit || m.notAvailable}{catalog.build?.runId ? ` · ${m.ciRun(catalog.build.runId)}` : ''}</footer><CommandPalette items={catalog.items} open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={id => { setPaletteOpen(false); navigate({selected:id, page:undefined}); }} />
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
