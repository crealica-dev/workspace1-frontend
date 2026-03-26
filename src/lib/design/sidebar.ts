import { cn } from "$lib/utils.js";
import { surfaceVariants } from "./surfaces.js";

export const sidebarBrandExpandedClass =
	"flex flex-col items-center gap-3 px-3 py-2 text-center";

export const sidebarBrandLogoClass = "block h-12 w-auto object-contain";

export const sidebarBrandMetaClass = "grid text-center text-sm leading-tight";

export const sidebarBrandTitleClass = "truncate text-base font-semibold";

export const sidebarBrandTaglineClass = "truncate text-xs text-sidebar-foreground/65";

export const sidebarBrandCollapsedButtonClass = "mx-auto justify-center rounded-xl";

export const sidebarBrandCollapsedLogoClass = "block h-6 w-auto object-contain";

export const sidebarSupportCardClass = cn(
	"border-sidebar-border/75 bg-sidebar-accent/35",
	surfaceVariants({
		tone: "muted",
		radius: "panel",
		padding: "sm",
		emphasis: "flat",
	}),
);

export const sidebarStatusBadgeClass = "shrink-0 rounded-full px-2 py-0.5 text-[10px]";

export const sidebarSupportCopyClass = "mt-3 text-xs leading-5 text-sidebar-foreground/70";

export const sidebarActionButtonClass = "mt-3 w-full justify-center gap-2 rounded-xl";

export const sidebarUserButtonClass =
	"data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground";

export const sidebarUserAvatarClass = "size-8 rounded-lg";

export const sidebarUserMetaClass = "grid flex-1 text-start text-sm leading-tight";
