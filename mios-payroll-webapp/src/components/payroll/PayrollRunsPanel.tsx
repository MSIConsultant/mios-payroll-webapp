"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Lock, Zap, CheckCircle2, Clock, FileText } from "lucide-react"
import { useCreatePayrollRun, useLockPayrollRun, useProcessBulkPayroll, useCompanies, useEmployees } from "@/lib/hooks/useApi"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { formatIDR, formatDate, formatPeriod, MONTHS, getApiErrorMessage } from "@/lib/utils"
import type { PayrollRunOut, PayrollRecordOut } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const createSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  period_year: z.coerce.number().min(2020).max(2099),
  period_month: z.coerce.number().min(1).max(12),
  description: z.string().optional(),
})
type CreateFormValues = z.infer<typeof createSchema>

function CreateRunDialog({ open, onOpenChange, onCreated }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (run: PayrollRunOut) => void
}) {
  const { mutateAsync, isPending } = useCreatePayrollRun()
  const { data: companies = [] } = useCompanies()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      period_year: new Date().getFullYear(),
      period_month: new Date().getMonth() + 1,
    },
  })

  const onSubmit = async (data: CreateFormValues) => {
    try {
      const run = await mutateAsync(data)
      toast.success("Payroll run created", `Run for ${formatPeriod(data.period_year, data.period_month)} created in Draft status.`)
      reset()
      onOpenChange(false)
      onCreated(run)
    } catch (err) {
      toast.error("Failed to create run", getApiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payroll Run</DialogTitle>
          <DialogDescription>Initialize a new payroll processing cycle for a company and period.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Company <span className="text-red-400">*</span></Label>
            <Select onValueChange={(v) => setValue("company_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.company_id && <p className="text-xs text-red-400">{errors.company_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fiscal Year <span className="text-red-400">*</span></Label>
              <Select onValueChange={(v) => setValue("period_year", Number(v))} defaultValue={String(new Date().getFullYear())}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Period Month <span className="text-red-400">*</span></Label>
              <Select onValueChange={(v) => setValue("period_month", Number(v))} defaultValue={String(new Date().getMonth() + 1)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Run"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Run Card ──────────────────────────────────────────────────────────────────
const statusConfig = {
  draft: { label: "Draft", icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
  locked: { label: "Locked", icon: Lock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  processed: { label: "Processed", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  finalized: { label: "Finalized", icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
}

function RunCard({ run, companyName }: { run: PayrollRunOut; companyName?: string }) {
  const { mutateAsync: lockRun, isPending: isLocking } = useLockPayrollRun()
  const { mutateAsync: processRun, isPending: isProcessing } = useProcessBulkPayroll()
  const { data: employees = [] } = useEmployees()
  const [results, setResults] = useState<PayrollRecordOut[]>([])

  const cfg = statusConfig[run.status] ?? statusConfig.draft
  const Icon = cfg.icon

  const handleLock = async () => {
    try {
      await lockRun(run.id)
      toast.success("Run locked", "The payroll run has been locked and is ready for processing.")
    } catch (err) {
      toast.error("Lock failed", getApiErrorMessage(err))
    }
  }

  const handleProcess = async () => {
    if (!confirm("Process payroll for all employees in this run?")) return
    const companyEmployees = employees.filter((e) => String(e.company_id) === String(run.company_id))
    if (companyEmployees.length === 0) {
      toast.error("No employees", "No employees found for this company.")
      return
    }
    try {
      const records = await processRun({
        runId: run.id,
        data: { employees: companyEmployees.map((e) => ({ employee_id: e.id })) },
      })
      setResults(records)
      toast.success("Payroll processed", `${records.length} payroll records generated successfully.`)
    } catch (err) {
      toast.error("Processing failed", getApiErrorMessage(err))
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{formatPeriod(run.period_year, run.period_month)}</p>
          <p className="text-sm text-slate-400 mt-0.5">{companyName ?? run.company_id}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium", cfg.bg, cfg.color)}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </div>
      </div>

      {run.description && <p className="text-sm text-slate-500">{run.description}</p>}

      <div className="flex items-center gap-2">
        {run.status === "draft" && (
          <Button variant="secondary" size="sm" onClick={handleLock} disabled={isLocking}>
            <Lock className="h-3.5 w-3.5" />
            {isLocking ? "Locking..." : "Lock Run"}
          </Button>
        )}
        {run.status === "locked" && (
          <Button size="sm" onClick={handleProcess} disabled={isProcessing}>
            <Zap className="h-3.5 w-3.5" />
            {isProcessing ? "Processing..." : "Process Bulk Payroll"}
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="border-t border-white/[0.08] pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Processed Records ({results.length})</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                <span className="text-sm text-slate-300 truncate">{r.employee_name ?? r.employee_id}</span>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-slate-500">Gross: <span className="text-slate-300">{formatIDR(r.gross_income)}</span></span>
                  <span className="text-slate-500">THP: <span className="text-amber-300 font-medium">{formatIDR(r.thp)}</span></span>
                  <span className="text-slate-500">PPh21: <span className="text-red-300">{formatIDR(r.income_tax)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PayrollRunsPanel() {
  const [createOpen, setCreateOpen] = useState(false)
  const [runs, setRuns] = useState<PayrollRunOut[]>([])
  const { data: companies = [] } = useCompanies()

  const getCompanyName = (id: string) => companies.find((c) => c.id === id)?.name

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Payroll Run
        </Button>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-xl border border-dashed border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <Clock className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-300">No payroll runs yet</p>
            <p className="text-sm text-slate-500 mt-1">Create a new run to begin the payroll cycle.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} companyName={getCompanyName(run.company_id)} />
          ))}
        </div>
      )}

      <CreateRunDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(run) => setRuns((prev) => [run, ...prev])}
      />
    </>
  )
}
