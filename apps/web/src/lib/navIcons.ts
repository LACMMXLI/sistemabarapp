import {
  Home,
  Zap,
  UtensilsCrossed,
  CircleDot,
  Package,
  ShoppingCart,
  Tag,
  Wallet,
  BarChart3,
  ClipboardList,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

/** Iconos de navegación centralizados (lucide-react) para mantener consistencia visual. */
export const NAV_ICONS = {
  home: Home,
  quickSale: Zap,
  tables: UtensilsCrossed,
  billiard: CircleDot,
  inventory: Package,
  products: ShoppingCart,
  promotions: Tag,
  cash: Wallet,
  reports: BarChart3,
  audit: ClipboardList,
  users: Users,
  settings: Settings,
} satisfies Record<string, LucideIcon>;
