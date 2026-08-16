import React from 'react';

interface UserAvatarProps {
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colorPalettes = [
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-teal-500/20 text-teal-300 border-teal-500/30',
];

function hashNameToColor(name: string): string {
  if (!name) return colorPalettes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalettes.length;
  return colorPalettes[index];
}

const getInitials = (name?: string) => {
  if (!name) return 'TM';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ name = 'Team Member', className = '', size = 'md' }) => {
  const initials = getInitials(name);
  const colorClass = hashNameToColor(name);

  const sizeClasses =
    size === 'sm'
      ? 'w-6 h-6 text-[10px]'
      : size === 'lg'
      ? 'w-12 h-12 text-sm font-bold'
      : 'w-8 h-8 text-xs font-semibold';

  return (
    <div
      className={`${sizeClasses} rounded-xl border flex items-center justify-center font-mono font-semibold flex-shrink-0 ${colorClass} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};
