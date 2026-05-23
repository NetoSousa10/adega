import React from 'react';
// Stroked icons drawn from scratch — geometric, 1.6 stroke weight.
// Each takes { size, color, fill } props.

const Icon = ({ size = 22, color = 'currentColor', fill = 'none', sw = 1.7, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children}
  </svg>
);

const IcHome = (p) => <Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14V10.5"/></Icon>;
const IcBox = (p) => <Icon {...p}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5"/><path d="M12 12v9"/></Icon>;
const IcCart = (p) => <Icon {...p}><path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="9.5" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/></Icon>;
const IcReceipt = (p) => <Icon {...p}><path d="M6 3h12v18l-2.2-1.4L13.5 21l-2.5-1.5L8.5 21 6 19.5z"/><path d="M9 8h6M9 12h6M9 16h4"/></Icon>;
const IcChart = (p) => <Icon {...p}><path d="M4 20h16"/><path d="M7 16V11"/><path d="M12 16V7"/><path d="M17 16v-6"/></Icon>;
const IcSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></Icon>;
const IcPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IcMinus = (p) => <Icon {...p}><path d="M5 12h14"/></Icon>;
const IcGear = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.5 1.5 0 0 0 .3 1.6l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.5 1.5 0 0 0-1.6-.3 1.5 1.5 0 0 0-.9 1.4V21a2 2 0 1 1-4 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.6.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.5 1.5 0 0 0 .3-1.6 1.5 1.5 0 0 0-1.4-.9H3a2 2 0 1 1 0-4h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.5 1.5 0 0 0 1.6.3H9a1.5 1.5 0 0 0 .9-1.4V3a2 2 0 1 1 4 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.6-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.5 1.5 0 0 0-.3 1.6V9a1.5 1.5 0 0 0 1.4.9H21a2 2 0 1 1 0 4h-.1a1.5 1.5 0 0 0-1.4.9z"/></Icon>;
const IcChevR = (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
const IcChevL = (p) => <Icon {...p}><path d="m15 6-6 6 6 6"/></Icon>;
const IcX = (p) => <Icon {...p}><path d="M6 6l12 12M6 18 18 6"/></Icon>;
const IcCheck = (p) => <Icon {...p}><path d="m5 12 4.5 4.5L19 7"/></Icon>;
const IcTrend = (p) => <Icon {...p}><path d="m3 17 6-6 4 4 8-9"/><path d="M14 6h7v7"/></Icon>;
const IcWarn = (p) => <Icon {...p}><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17.5v.1"/></Icon>;
const IcFilter = (p) => <Icon {...p}><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></Icon>;
const IcTrash = (p) => <Icon {...p}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/><path d="M10 11v6M14 11v6"/></Icon>;
const IcArrowUp = (p) => <Icon {...p}><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></Icon>;
const IcPix = (p) => <Icon {...p}><path d="M12 3 21 12l-9 9-9-9z"/><path d="M8 8 12 12l-4 4M16 8l-4 4 4 4"/></Icon>;
const IcCard = (p) => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/></Icon>;
const IcCash = (p) => <Icon {...p}><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><circle cx="6" cy="12" r=".5"/><circle cx="18" cy="12" r=".5"/></Icon>;
const IcCalendar = (p) => <Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></Icon>;

Object.assign(window, {
  Icon, IcHome, IcBox, IcCart, IcReceipt, IcChart, IcSearch, IcPlus, IcMinus, IcGear,
  IcChevR, IcChevL, IcX, IcCheck, IcTrend, IcWarn, IcFilter, IcTrash,
  IcArrowUp, IcPix, IcCard, IcCash, IcCalendar,
});
