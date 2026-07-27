// Lucide-style inline icons. Stroke 1.75 for data-tool register.
const Icon = ({ d, size = 16, stroke = 1.75, className = "", style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {d}
  </svg>
);

const I = {
  layout: (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>} />,
  building: (p) => <Icon {...p} d={<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></>} />,
  layers: (p) => <Icon {...p} d={<><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></>} />,
  flask: (p) => <Icon {...p} d={<><path d="M10 2v7.31" /><path d="M14 9.3V1.99" /><path d="M8.5 2h7" /><path d="M14 9.3a6.5 6.5 0 1 1-4 0" /></>} />,
  bar: (p) => <Icon {...p} d={<><path d="M3 3v18h18" /><rect x="7" y="13" width="3" height="5" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="6" width="3" height="12" /></>} />,
  alert: (p) => <Icon {...p} d={<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>} />,
  scale: (p) => <Icon {...p} d={<><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>} />,
  search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>} />,
  download: (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>} />,
  check: (p) => <Icon {...p} d={<><polyline points="20 6 9 17 4 12" /></>} />,
  checkCircle: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>} />,
  x: (p) => <Icon {...p} d={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />,
  arrowRight: (p) => <Icon {...p} d={<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>} />,
  arrowLeft: (p) => <Icon {...p} d={<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>} />,
  external: (p) => <Icon {...p} d={<><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>} />,
  filter: (p) => <Icon {...p} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></>} />,
  more: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>} />,
  chevronDown: (p) => <Icon {...p} d={<><path d="m6 9 6 6 6-6" /></>} />,
  chevronRight: (p) => <Icon {...p} d={<><path d="m9 18 6-6-6-6" /></>} />,
  bell: (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
  trendUp: (p) => <Icon {...p} d={<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>} />,
  trendDown: (p) => <Icon {...p} d={<><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></>} />,
  minus: (p) => <Icon {...p} d={<><path d="M5 12h14" /></>} />,
  plus: (p) => <Icon {...p} d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />,
  flag: (p) => <Icon {...p} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></>} />,
  shield: (p) => <Icon {...p} d={<><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></>} />,
  refresh: (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>} />,
};

window.I = I;
