// Hash routing. Every page has its own address, so links, reloads and the back button all work.
import React, { useEffect, useState } from 'react';

export const CLIENT_TABS = [['overview', 'Client Overview'], ['services', 'Services'], ['program-info', 'Program Info'], ['providers', 'Providers'], ['benefits', 'Benefits']];
export const HUB_PAGES = { home: 'CoLab Home', 'my-action-items': 'My Action Items', 'my-case-notes': 'My Case Notes', 'starred-clients': 'Starred Clients' };

export function parse(hash) {
  const parts = decodeURIComponent((hash || '').replace(/^#\/?/, '')).split('/').filter(Boolean);
  if (!parts.length || parts[0] === 'home') return { page: 'home' };
  if (HUB_PAGES[parts[0]]) return { page: parts[0] };
  if (CLIENT_TABS.some((t) => t[0] === parts[0])) return { page: 'client', id: 'c1', sub: 'tab', tab: parts[0] };
  if (parts[0] === 'client') {
    const id = parts[1] || 'c1';
    const sub = parts[2] || 'overview';
    if (sub === 'case-notes') return { page: 'client', id, sub: 'notes' };
    if (sub === 'action-items') return { page: 'client', id, sub: 'actions' };
    if (sub === 'address-history') return { page: 'client', id, sub: 'addresses' };
    if (sub === 'service' && parts[3]) return { page: 'client', id, sub: 'service', key: parts[3] };
    if (sub === 'provider' && parts[3]) return { page: 'client', id, sub: 'provider', key: parts.slice(3).join('/') };
    return { page: 'client', id, sub: 'tab', tab: CLIENT_TABS.some((t) => t[0] === sub) ? sub : 'overview' };
  }
  return { page: 'home' };
}

export function href(r) {
  if (r.page !== 'client') return '#' + r.page;
  const base = '#client/' + r.id + '/';
  if (r.sub === 'notes') return base + 'case-notes';
  if (r.sub === 'actions') return base + 'action-items';
  if (r.sub === 'addresses') return base + 'address-history';
  if (r.sub === 'service') return base + 'service/' + r.key;
  if (r.sub === 'provider') return base + 'provider/' + encodeURIComponent(r.key);
  return base + (r.tab || 'overview');
}

const listeners = new Set();
export function navigate(to, opts) {
  const target = typeof to === 'string' ? to : href(to);
  if (location.hash !== target) history.pushState(null, '', target);
  listeners.forEach((fn) => fn(opts || {}));
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const onChange = (opts) => {
      setRoute(parse(location.hash));
      if (!opts.keepScroll) {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => {
          const m = document.getElementById('main');
          if (m) { m.scrollTop = 0; if (opts.focus !== false) m.focus({ preventScroll: true }); }
        });
      }
    };
    const onPop = () => onChange({ focus: false });
    listeners.add(onChange);
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    if (!location.hash) history.replaceState(null, '', '#home');
    return () => { listeners.delete(onChange); window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onPop); };
  }, []);
  return route;
}

// An in-app link: a real <a href> (so open-in-new-tab works) that routes without a page load.
export function Link({ to, children, focus, ...rest }) {
  const target = typeof to === 'string' ? to : href(to);
  const onClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    if (rest.onClick) rest.onClick(e);
    navigate(target, { focus });
  };
  return <a {...rest} href={target} onClick={onClick}>{children}</a>;
}
