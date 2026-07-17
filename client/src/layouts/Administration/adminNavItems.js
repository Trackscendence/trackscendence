import {
  BarChart3,
  DoorOpen,
  Flag,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'

// The console's section map (#496). MVP ships Dashboard and Players; the
// other four sections are phased (P2 Rooms/Analytics, P3 Reports/Settings)
// and render as visibly disabled entries so the information architecture is
// on screen before the sections exist.
export const ADMIN_SECTIONS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/players', label: 'Players', icon: Users, end: false },
]

export const ADMIN_UPCOMING_SECTIONS = [
  { label: 'Rooms', icon: DoorOpen },
  { label: 'Reports', icon: Flag },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
]
