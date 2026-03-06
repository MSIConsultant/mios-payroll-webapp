"use client"
import { useCompanies, useEmployees } from "@/lib/hooks/useApi"
import { PageHeader } from "@/components/layout/PageHeader"
import { CardSkeleton } from "@/components/ui/skeleton"
import { Building2, Users, PlayCircle, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

function StatCard({
  label, value, sub, icon: Icon, href, color = "amber",
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; href: string
  color?: "amber" | "violet" | "blue" | "emerald"
}) {
  const colors = {
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  }
  return (
    <Link href={href} className="block group">
      <div className="glass-card-hover p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm font-medium text-slate-300 mt-1">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: rawCompanies, isLoading: loadingCompanies } = useCompanies()
  const { data: rawEmployees, isLoading: loadingEmployees } = useEmployees()

  // Defensive normalization — guard against API returning null or a non-array
  // shape before the backend pagination layer is finalized.
  const companies = Array.isArray(rawCompanies) ? rawCompanies : []
  const employees = Array.isArray(rawEmployees) ? rawEmployees : []
  const totalPayroll = employees.reduce((sum, e) => sum + (e.base_salary ?? 0), 0)

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="MIOS Payroll — Indonesian SaaS Payroll Management" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingCompanies ? <CardSkeleton /> : (
          <StatCard label="Registered Companies" value={companies.length} sub="Active entities"
            icon={Building2} href="/companies" color="amber" />
        )}
        {loadingEmployees ? <CardSkeleton /> : (
          <StatCard label="Enrolled Employees" value={employees.length} sub="Across all companies"
            icon={Users} href="/employees" color="violet" />
        )}
        <StatCard label="Payroll Runs" value="—" sub="Create a new run below"
          icon={PlayCircle} href="/payroll" color="blue" />
        {loadingEmployees ? <CardSkeleton /> : (
          <StatCard
            label="Total Monthly Payroll"
            value={employees.length > 0 ? `IDR ${(totalPayroll / 1_000_000).toFixed(1)}M` : "—"}
            sub="Base salary sum" icon={TrendingUp} href="/employees" color="emerald" />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Register a Company", desc: "Add a new legal entity", href: "/companies", icon: Building2 },
            { label: "Enroll an Employee", desc: "Add employee with tax config", href: "/employees", icon: Users },
            { label: "Run Payroll", desc: "Create & process a payroll cycle", href: "/payroll", icon: PlayCircle },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block group">
              <div className="glass-card-hover flex items-center gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <item.icon className="h-4 w-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
