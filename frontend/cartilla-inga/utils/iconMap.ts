import {
  Heart, Leaf, Mountain, Book, Star, Globe,
  Users, Home, Music, Palette, Hash, Sprout,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Leaf,
  Mountain,
  Book,
  Star,
  Globe,
  Users,
  Home,
  Music,
  Palette,
  Hash,
  Sprout,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || Book;
};
