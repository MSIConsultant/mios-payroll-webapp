import { PageHeader } from "@/components/layout/PageHeader"

export const metadata = { title: "Settings — MIOS Payroll" }

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Application configuration and system preferences." />
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <p className="text-slate-400">Settings panel — coming soon.</p>
      </div>
    </div>
  )
}
