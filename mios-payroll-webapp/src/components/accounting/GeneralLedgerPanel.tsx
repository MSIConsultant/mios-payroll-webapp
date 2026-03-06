"use client"
import { useState } from "react"
import { useJournal } from "@/lib/hooks/useApi"
import { useCompanies } from "@/lib/hooks/useApi"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ApiErrorDisplay } from "@/components/shared/ErrorDisplay"
import { TableSkeleton } from "@/components/ui/skeleton"
import { formatIDR, MONTHS } from "@/lib/utils"
import { BookOpen, TrendingUp, TrendingDown } from "lucide-react"
import type { JournalEntryOut } from "@/lib/api/types"

function JournalEntry({ entry }: { entry: JournalEntryOut }) {
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="bg-white/[0.03] border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm">{entry.reference}</p>
          <p className="text-xs text-slate-400 mt-0.5">{entry.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{entry.entry_date}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Total: <span className="text-amber-300 font-mono">{formatIDR(entry.total_debit)}</span>
          </p>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.05]">
            <th className="px-4 py-2 text-left text-slate-500 font-medium">Account Code</th>
            <th className="px-4 py-2 text-left text-slate-500 font-medium">Account Name</th>
            <th className="px-4 py-2 text-left text-slate-500 font-medium">Description</th>
            <th className="px-4 py-2 text-right text-slate-500 font-medium">Debit</th>
            <th className="px-4 py-2 text-right text-slate-500 font-medium">Credit</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((line, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-4 py-2">
                <code className="text-slate-400">{line.account_code}</code>
              </td>
              <td className="px-4 py-2 text-slate-200">{line.account_name}</td>
              <td className="px-4 py-2 text-slate-500">{line.description ?? "—"}</td>
              <td className="px-4 py-2 text-right font-mono">
                {line.debit > 0 ? (
                  <span className="text-blue-300">{formatIDR(line.debit)}</span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-right font-mono">
                {line.credit > 0 ? (
                  <span className="text-emerald-300">{formatIDR(line.credit)}</span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10 bg-white/[0.03]">
            <td colSpan={3} className="px-4 py-2 text-right text-slate-400 font-semibold text-xs">Totals</td>
            <td className="px-4 py-2 text-right font-mono font-semibold text-blue-300">{formatIDR(entry.total_debit)}</td>
            <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-300">{formatIDR(entry.total_credit)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function GeneralLedgerPanel() {
  const { data: companies = [] } = useCompanies()
  const [companyId, setCompanyId] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [query, setQuery] = useState<{ companyId: string; year: number; month: number } | null>(null)

  const { data: entries = [], isLoading, error, refetch } = useJournal(
    query?.companyId ?? "",
    query?.year ?? 0,
    query?.month ?? 0
  )

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 min-w-[200px]">
            <Label>Company</Label>
            <Select onValueChange={setCompanyId} value={companyId}>
              <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-28">
            <Label>Year</Label>
            <Select onValueChange={(v) => setYear(Number(v))} value={String(year)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-36">
            <Label>Month</Label>
            <Select onValueChange={(v) => setMonth(Number(v))} value={String(month)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setQuery({ companyId, year, month })}
            disabled={!companyId}
          >
            <BookOpen className="h-4 w-4" />
            Generate Journal
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="rounded-xl border border-white/[0.08] p-6">
          <TableSkeleton rows={8} cols={5} />
        </div>
      )}

      {error && <ApiErrorDisplay error={error} onRetry={() => refetch()} title="Failed to load journal entries" />}

      {!isLoading && !error && entries.length === 0 && query && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-600" />
          <p className="text-slate-400">No journal entries found for this period.</p>
        </div>
      )}

      {entries.map((entry) => <JournalEntry key={entry.id} entry={entry} />)}
    </div>
  )
}
