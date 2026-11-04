import React from 'react';

const P = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  inbox: <><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3H3z" /><path d="M10 13h4" /></>,
  star: <path d="M12 3l2.8 5.8 6.2.8-4.5 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.8z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  userSolid: <><circle cx="12" cy="8" r="4" fill="currentColor" stroke="none" /><path d="M4 21c1.5-4.5 4.5-6.5 8-6.5s6.5 2 8 6.5z" fill="currentColor" stroke="none" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.5 0 4 1.5 4.8 4" /></>,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  phone: <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  layers: <><path d="M12 2 2 7l10 5 10-5z" /><path d="M2 12l10 5 10-5M2 17l10 5 10-5" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M14.8 9.2l3.6-3.6M5.6 18.4l3.6-3.6" /></>,
  building: <path d="M3 21V9l5-3v15M8 21V4h9v17M17 10h4v11M2 21h20M11 8h3M11 12h3M11 16h3" />,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  landmark: <path d="M3 10h18M12 3l9 5H3zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v2H6" />,
  userCircle: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.5c1.3-2 3.2-3 5.5-3s4.2 1 5.5 3" /></>,
  gridPlus: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14v7M14 17.5h7" /></>,
  columns: <><rect x="3" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="9.5" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="16" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  funnel: <path d="M3 4h18l-7 9v6l-4 2v-8z" fill="currentColor" stroke="none" />,
  rows: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M4 15h16" /></>,
  download: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></>,
  more: <><circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none" /></>,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  notes: <><path d="M4 4h13v16H6a2 2 0 0 1-2-2z" /><path d="M17 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4" /></>,
  plusCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></>,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 9v5M12 17h.01" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  bug: <><path d="M8 8a4 4 0 0 1 8 0v1H8z" /><path d="M6 10h12v4a6 6 0 0 1-12 0z" /><path d="M12 10v10M3 13h3M18 13h3M4 8l2 2M20 8l-2 2M4 19l2-2M20 19l-2-2" /></>,
  sortLines: <path d="M4 6h10M4 12h7M4 18h4M17 5v14M14 16l3 3 3-3" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 1.3-1.3a4 4 0 0 0-5-5L5 13l-2-2 8-8 2 2z" transform="scale(.92) translate(1 1)" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  unlock: <><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
  database: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3M19 6v6M5 12c0 1.7 3.1 3 7 3" /><path d="M18 14l-3.5 6h7z" /><path d="M18 16.5v1.5" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5M12 16.5h.01" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  homeSolid: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" fill="currentColor" stroke="none" />,
  bed: <><path d="M3 20V6M21 20v-6a3 3 0 0 0-3-3h-8v6M3 17h18" /><circle cx="6.5" cy="11.5" r="1.8" /></>,
  apartment: <><rect x="5" y="3" width="10" height="18" rx="1" /><path d="M15 9h4v12h-4M8 7h1M11 7h1M8 11h1M11 11h1M8 15h1M11 15h1M3 21h18" /></>,
  bars: <path d="M5 4v16M10 4v16M15 4v16M20 4v16M3 4h19M3 20h19" />,
  timeline: <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />
};

export function Icon({ name, size = 16, className = '', label }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
  return (
    <svg className={'icon ' + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...a11y}>
      {P[name]}
    </svg>
  );
}

export function BrandMark() {
  return (
    <svg className="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" strokeDasharray="3 2.4" />
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
