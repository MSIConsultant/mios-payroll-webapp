"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  PlayCircle,
  BookOpen,
  Settings,
  BarChart3,
  ChevronRight,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: BarChart3 },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Payroll Runs", href: "/payroll", icon: PlayCircle },
  { label: "General Ledger", href: "/accounting", icon: BookOpen },
  { label: "Tax Regulations", href: "/regulations", icon: Layers },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/[0.06] bg-slate-900/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-white/[0.06]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 shadow-lg shadow-amber-500/30">
          <span className="text-sm font-black text-slate-900">M</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">MIOS</p>
          <p className="text-[10px] text-amber-400/80 font-medium tracking-widest uppercase leading-none mt-0.5">Payroll</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-amber-400/60" />}
              {item.badge && (
                <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs font-medium text-slate-300">API Connected</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">railway.app</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400">Live</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
