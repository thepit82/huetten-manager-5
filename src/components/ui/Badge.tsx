import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-50 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    planning: 'warning',
    active: 'success',
    completed: 'gray',
    archived: 'gray',
  }
  const labels: Record<string, string> = {
    planning: 'Planung',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    archived: 'Archiviert',
  }
  return <Badge variant={map[status] ?? 'gray'}>{labels[status] ?? status}</Badge>
}
