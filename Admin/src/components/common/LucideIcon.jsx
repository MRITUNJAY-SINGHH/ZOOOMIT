import React from 'react';
import * as Icons from 'lucide-react';

const resolveIcon = (name) => {
  const normalized = String(name || 'circle')
    .replace(/^lucide:/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return Icons[normalized] || Icons.Circle;
};

export function Icon({ icon, width, height, size, ...props }) {
  const Lucide = resolveIcon(icon);
  return <Lucide size={20} {...props} />;
}
