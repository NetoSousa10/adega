import React from 'react';
// Constants and helpers used across screens.
// CATEGORIES, CAT_TONE, CAT_LABEL are filled at runtime from user state — see main.jsx.

const DEFAULT_CATEGORIES = [
  { id: 'cerv', label: 'Cervejas',           labelSingular: 'Cerveja',     tone: '#9C7B1A' },
  { id: 'refr', label: 'Refrigerantes',      labelSingular: 'Refrigerante',tone: '#A23D2C' },
  { id: 'ener', label: 'Energéticos',        labelSingular: 'Energético',  tone: '#2B3D7A' },
  { id: 'agua', label: 'Águas',              labelSingular: 'Água',        tone: '#2E6E96' },
  { id: 'dest', label: 'Destilados',         labelSingular: 'Destilado',   tone: '#5A3320' },
  { id: 'vinh', label: 'Vinhos',             labelSingular: 'Vinho',       tone: '#7A3A6D' },
  { id: 'espu', label: 'Espumantes',         labelSingular: 'Espumante',   tone: '#B89B5C' },
  { id: 'gelo', label: 'Gelo e acessórios',  labelSingular: 'Gelo',        tone: '#6B8FA8' },
  { id: 'salg', label: 'Salgadinhos',        labelSingular: 'Salgadinho',  tone: '#C28B4F' },
  { id: 'dive', label: 'Diversos',           labelSingular: 'Diverso',     tone: '#555555' },
];

const PAYMENT_LABELS = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
};

const brl = (n) => 'R$ ' + (n).toFixed(2).replace('.', ',');
const pct = (n) => n.toFixed(1).replace('.', ',') + '%';
const initialsFrom = (name) => {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 1) return words[0].slice(0,2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};
const margin = (p) => p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
const profit = (p) => p.price - p.cost;

Object.assign(window, {
  DEFAULT_CATEGORIES, PAYMENT_LABELS,
  brl, pct, initialsFrom, margin, profit,
});
