import * as React from "react"

export interface SidebarContextProps {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SidebarProviderProps {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export interface SidebarProps {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
  className?: string
  children: React.ReactNode
}

export interface SidebarTriggerProps {
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  children?: React.ReactNode
}

export interface SidebarRailProps {
  className?: string
  children?: React.ReactNode
}

export interface SidebarInsetProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarInputProps {
  className?: string
  children?: React.ReactNode
}

export interface SidebarHeaderProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarFooterProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarSeparatorProps {
  className?: string
  children?: React.ReactNode
}

export interface SidebarContentProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarGroupProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarGroupLabelProps {
  className?: string
  asChild?: boolean
  children: React.ReactNode
}

export interface SidebarGroupActionProps {
  className?: string
  asChild?: boolean
  children: React.ReactNode
}

export interface SidebarGroupContentProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuItemProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuButtonProps {
  asChild?: boolean
  isActive?: boolean
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuActionProps {
  className?: string
  asChild?: boolean
  showOnHover?: boolean
  children: React.ReactNode
}

export interface SidebarMenuBadgeProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuSkeletonProps {
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export interface SidebarMenuSubProps {
  className?: string
  children: React.ReactNode
}

export interface SidebarMenuSubItemProps {
  children?: React.ReactNode
}

export interface SidebarMenuSubButtonProps {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
  className?: string
  children: React.ReactNode
}