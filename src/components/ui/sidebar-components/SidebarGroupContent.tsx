import * as React from "react"
import { cn } from "@/lib/utils/utils"
import { SidebarGroupContentProps } from "./types"

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, SidebarGroupContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
)
SidebarGroupContent.displayName = "SidebarGroupContent"