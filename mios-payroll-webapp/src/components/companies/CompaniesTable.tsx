"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, Building2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { useCompanies, useCreateCompany, useDeleteCompany } from "@/lib/hooks/useApi"
import { DataTable } from "@/components/shared/DataTable"
import { ApiErrorDisplay } from "@/components/shared/ErrorDisplay"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { formatDate, getApiErrorMessage } from "@/lib/utils"
import type { CompanyOut } from "@/lib/api/types"

import { Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- 1. THE UPDATED SCHEMA ---
const schema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  npwp: z.string().min(20, "NPWP must be complete (15 digits)"), // 20 chars including the dots and dash
  address: z.string().optional(),
  industry: z.string().optional(),
  jkk_category: z.enum(["LOW", "MEDIUM", "HIGH"], {
    required_error: "Please select a Work Accident Insurance risk level",
  }),
})
type FormValues = z.infer<typeof schema>

// --- NPWP FORMATTER ---
const formatNPWP = (value: string) => {
  const digits = value.replace(/\D/g, "").substring(0, 15);
  let formatted = digits;
  if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length > 5) formatted = `${formatted.slice(0, 6)}.${digits.slice(5)}`;
  if (digits.length > 8) formatted = `${formatted.slice(0, 10)}.${digits.slice(8)}`;
  if (digits.length > 9) formatted = `${formatted.slice(0, 12)}-${digits.slice(9)}`;
  if (digits.length > 12) formatted = `${formatted.slice(0, 16)}.${digits.slice(12)}`;
  return formatted;
};

// --- 2. THE UPDATED DIALOG ---
function CreateCompanyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mutateAsync, isPending } = useCreateCompany()
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      // Clean the NPWP back to pure numbers before sending to backend if desired, 
      // or send as-is depending on your FastAPI setup.
      const payload = { ...data, npwp: data.npwp.replace(/\D/g, "") };
      await mutateAsync(payload)
      toast.success("Company registered", `${data.name} has been added successfully.`)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error("Registration failed", getApiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register Company</DialogTitle>
          <DialogDescription>Add a new company to the payroll system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="space-y-1.5">
            <Label htmlFor="name">Legal Company Name <span className="text-red-400">*</span></Label>
            <Input id="name" placeholder="PT. Example Indonesia" {...register("name")} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="npwp">Tax Registration Number (NPWP) <span className="text-red-400">*</span></Label>
            <Input 
              id="npwp" 
              placeholder="00.000.000.0-000.000" 
              {...register("npwp")} 
              onChange={(e) => {
                const formatted = formatNPWP(e.target.value);
                setValue("npwp", formatted, { shouldValidate: true });
              }}
            />
            {errors.npwp && <p className="text-xs text-red-400">{errors.npwp.message}</p>}
          </div>

          {/* THE NEW JKK DROPDOWN */}
          <div className="space-y-1.5">
            <Label>Work Accident Insurance (JKK) <span className="text-red-400">*</span></Label>
            <Controller
              control={control}
              name="jkk_category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low Risk (0.24%)</SelectItem>
                    <SelectItem value="MEDIUM">Medium Risk (0.54%)</SelectItem>
                    <SelectItem value="HIGH">High Risk (0.89%)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.jkk_category && <p className="text-xs text-red-400">{errors.jkk_category.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" placeholder="Technology, Manufacturing..." {...register("industry")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Registered Address</Label>
            <Input id="address" placeholder="Jl. Sudirman No. 1, Jakarta..." {...register("address")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registering..." : "Register Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CompaniesTable() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: companies = [], isLoading, error, refetch } = useCompanies()
  const { mutateAsync: deleteCompany } = useDeleteCompany()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return
    try {
      await deleteCompany(id)
      toast.success("Company removed", `${name} has been deleted.`)
    } catch (err) {
      toast.error("Delete failed", getApiErrorMessage(err))
    }
  }

  const columns: ColumnDef<CompanyOut>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Building2 className="h-4 w-4 text-amber-400" />
          </div>
          <span className="font-medium text-white">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "npwp",
      header: "NPWP",
      cell: ({ getValue }) => (
        <code className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{getValue() as string}</code>
      ),
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined
        return v ? <Badge variant="outline">{v}</Badge> : <span className="text-slate-600">—</span>
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ getValue }) => (
        <span className="text-slate-400 text-xs max-w-[200px] truncate block">{(getValue() as string) || "—"}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Registered",
      cell: ({ getValue }) => (
        <span className="text-slate-400 text-xs">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          onClick={() => handleDelete(row.original.id, row.original.name)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  if (error) return <ApiErrorDisplay error={error} onRetry={() => refetch()} />

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Register Company
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search companies..."
        emptyMessage="No companies registered yet."
      />
      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
