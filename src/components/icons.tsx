import {
  Activity,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCw,
  Send,
  Settings,
  Sun,
  MessageSquare,
  MessagesSquare,
  Users,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

function icon(Icon: ComponentType<LucideProps>, defaultSize = 16, defaultStroke = 2) {
  return function IconWrapper({
    size = defaultSize,
    strokeWidth = defaultStroke,
    ...props
  }: LucideProps) {
    return <Icon size={size} strokeWidth={strokeWidth} stroke="currentColor" {...props} />
  }
}

const navIcon = (I: ComponentType<LucideProps>) => icon(I, 15, 1.75)

export const Icons = {
  Brand: icon(LayoutDashboard, 18),
  Moon: icon(Moon, 16),
  Sun: icon(Sun, 16),
  Eye: icon(Eye, 16),
  EyeOff: icon(EyeOff, 16),
  Dashboard: navIcon(LayoutDashboard),
  Documents: navIcon(FileText),
  Health: navIcon(Activity),
  Refresh: icon(RefreshCw, 16),
  Settings: navIcon(Settings),
  Chat: navIcon(MessageSquare),
  Conversations: navIcon(MessagesSquare),
  Send: icon(Send, 16),
  LogOut: icon(LogOut, 16),
  Users: navIcon(Users),
}
