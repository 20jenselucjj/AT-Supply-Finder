import * as React from "react"
import { cn } from "@/lib/utils/utils"
import { SidebarMenuItemProps } from "./types"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
)
SidebarMenuItem.displayName = "SidebarMenuItem"