"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Layers, Edit } from "lucide-react"
import { useRegulations, useCreateRegulation } from "@/lib/hooks/useApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ApiErrorDisplay } from "@/components/shared/ErrorDisplay"
import { TableSkeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatIDR, getApiErrorMessage } from "@/lib/utils"
import type { TaxRegulationOut } from "@/lib/api/types"

// Default PTKP values per PMK 168/2024
const DEFAULT_PTKP = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
}

const schema = z.object({
  year: z.coerce.number().min(2020).max(2099),
})
type FormValues = z.infer<typeof schema>

function CreateRegulationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mutateAsync, isPending } = useCreateRegulation()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { year: new Date().getFullYear() },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await mutateAsync({
        year: data.year,
        ptkp: DEFAULT_PTKP,
        bpjs_rates: {
          kesehatan_employee: 0.01,
          kesehatan_employer: 0.04,
          jht_employee: 0.02,
          jht_employer: 0.037,
          jp_employee: 0.01,
          jp_employer: 0.02,
        },
      })
      toast.success("Tax regulation created", `Regulations for ${data.year} initialized with PMK 168/2024 defaults.`)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error("Failed to create regulation", getApiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Initialize Tax Regulation</DialogTitle>
          <DialogDescription>
            Create tax parameters for a fiscal year. Pre-populated with PMK 168/2024 / TER defaults.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Fiscal Year <span className="text-red-400">*</span></Label>
            <Input type="number" placeholder="2025" {...register("year")} />
            {errors.year && <p className="text-xs text-red-400">{errors.year.message}</p>}
          </div>
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
            <p className="text-xs font-medium text-amber-300 mb-2">Default PTKP (Non-Taxable Income Thresholds)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(DEFAULT_PTKP).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-xs text-slate-400 font-mono">{k}</span>
                  <span className="text-xs text-slate-300 font-mono">{formatIDR(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Initialize Regulation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RegulationCard({ reg }: { reg: TaxRegulationOut }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Fiscal Year {reg.year}</p>
            <p className="text-xs text-slate-500 mt-0.5">TER PMK 168/2024 Framework</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">Active</Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* PTKP Table */}
      {reg.ptkp && Object.keys(reg.ptkp).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Non-Taxable Income Thresholds (PTKP)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(reg.ptkp).map(([code, amount]) => (
              <div key={code} className="rounded-lg bg-white/5 border border-white/[0.06] p-2.5 text-center">
                <p className="text-xs font-mono font-semibold text-amber-400">{code}</p>
                <p className="text-xs text-slate-300 mt-1 font-mono">{formatIDR(amount as number)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BPJS Rates */}
      {reg.bpjs_rates && Object.keys(reg.bpjs_rates).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Social Security Contribution Rates (BPJS)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(reg.bpjs_rates).map(([key, rate]) => (
              <div key={key} className="rounded-lg bg-white/5 border border-white/[0.06] p-2.5">
                <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, " ")}</p>
                <p className="text-sm font-mono font-semibold text-violet-300 mt-0.5">
                  {((rate as number) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function RegulationsPanel() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: regulations = [], isLoading, error, refetch } = useRegulations()

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Initialize Year
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <TableSkeleton rows={4} cols={4} />
        </div>
      )}

      {error && <ApiErrorDisplay error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && regulations.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-xl border border-dashed border-white/10">
          <Layers className="h-10 w-10 text-slate-600" />
          <div>
            <p className="font-medium text-slate-300">No regulations configured</p>
            <p className="text-sm text-slate-500 mt-1">Initialize a fiscal year with PMK 168/2024 parameters.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {regulations.map((reg) => <RegulationCard key={reg.id} reg={reg} />)}
      </div>

      <CreateRegulationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
