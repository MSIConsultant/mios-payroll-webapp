"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Users } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { useEmployees, useCreateEmployee, useCompanies } from "@/lib/hooks/useApi"
import { DataTable } from "@/components/shared/DataTable"
import { ApiErrorDisplay } from "@/components/shared/ErrorDisplay"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { formatIDR, formatDate, TAX_METHOD_LABELS, MARITAL_STATUS_LABELS, getApiErrorMessage } from "@/lib/utils"
import type { EmployeeOut } from "@/lib/api/types"

const schema = z.object({
  company_id: z.string().min(1, "Company is required"),
  name: z.string().min(2, "Name is required"),
  nik: z.string().min(16, "NIK must be 16 digits").max(16),
  npwp: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  position: z.string().optional(),
  department: z.string().optional(),
  base_salary: z.coerce.number().min(1, "Base salary is required"),
  marital_status: z.enum(["TK", "K/0", "K/1", "K/2", "K/3"]),
  tax_method: z.enum(["gross", "gross_up", "netto", "tax_allowance"]),
  bpjs_kesehatan: z.boolean().default(true),
  bpjs_ketenagakerjaan: z.boolean().default(true),
  employment_status: z.enum(["permanent", "contract", "freelance"]).optional(),
})
type FormValues = z.infer<typeof schema>

function CreateEmployeeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mutateAsync, isPending } = useCreateEmployee()
  const { data: companies = [] } = useCompanies()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bpjs_kesehatan: true, bpjs_ketenagakerjaan: true },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await mutateAsync({ ...data, email: data.email || undefined })
      toast.success("Employee added", `${data.name} has been enrolled.`)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error("Failed to add employee", getApiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Employee</DialogTitle>
          <DialogDescription>Add an employee to the payroll system with their tax and BPJS configuration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Company */}
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
              <Label>Full Name <span className="text-red-400">*</span></Label>
              <Input placeholder="Budi Santoso" {...register("name")} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>NIK (National ID) <span className="text-red-400">*</span></Label>
              <Input placeholder="3201234567890001" maxLength={16} {...register("nik")} />
              {errors.nik && <p className="text-xs text-red-400">{errors.nik.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>NPWP (Tax ID)</Label>
              <Input placeholder="00.000.000.0-000.000" {...register("npwp")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="budi@company.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Position / Job Title</Label>
              <Input placeholder="Software Engineer" {...register("position")} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input placeholder="Engineering" {...register("department")} />
            </div>
          </div>

          {/* Employment & Tax */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compensation & Tax</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Base Salary (IDR) <span className="text-red-400">*</span></Label>
                <Input type="number" placeholder="5000000" {...register("base_salary")} />
                {errors.base_salary && <p className="text-xs text-red-400">{errors.base_salary.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Employment Status</Label>
                <Select onValueChange={(v) => setValue("employment_status", v as "permanent" | "contract" | "freelance")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marital Status (PTKP) <span className="text-red-400">*</span></Label>
                <Select onValueChange={(v) => setValue("marital_status", v as "TK" | "K/0" | "K/1" | "K/2" | "K/3")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.marital_status && <p className="text-xs text-red-400">{errors.marital_status.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Income Tax Method <span className="text-red-400">*</span></Label>
                <Select onValueChange={(v) => setValue("tax_method", v as "gross" | "gross_up" | "netto" | "tax_allowance")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TAX_METHOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tax_method && <p className="text-xs text-red-400">{errors.tax_method.message}</p>}
              </div>
            </div>
          </div>

          {/* BPJS */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Social Security (BPJS)</p>
            <div className="flex gap-4">
              {[
                { key: "bpjs_kesehatan" as const, label: "BPJS Kesehatan (Health Insurance)" },
                { key: "bpjs_ketenagakerjaan" as const, label: "BPJS Ketenagakerjaan (Employment)" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked
                    {...register(key)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-amber-500"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enrolling..." : "Enroll Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EmployeesTable() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: employees = [], isLoading, error, refetch } = useEmployees()

  const taxMethodColor: Record<string, "default" | "secondary" | "success" | "outline"> = {
    gross: "outline",
    gross_up: "secondary",
    netto: "success",
    tax_allowance: "default",
  }

  const columns: ColumnDef<EmployeeOut>[] = [
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{row.original.name}</p>
            {row.original.email && <p className="text-xs text-slate-500">{row.original.email}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => (
        <div>
          <p className="text-slate-200 text-sm">{row.original.position || "—"}</p>
          {row.original.department && <p className="text-xs text-slate-500">{row.original.department}</p>}
        </div>
      ),
    },
    {
      accessorKey: "base_salary",
      header: "Base Salary",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-amber-300">{formatIDR(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: "marital_status",
      header: "PTKP Status",
      cell: ({ getValue }) => (
        <Badge variant="outline">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: "tax_method",
      header: "Tax Method",
      cell: ({ getValue }) => {
        const v = getValue() as string
        return <Badge variant={taxMethodColor[v] ?? "outline"}>{TAX_METHOD_LABELS[v] ?? v}</Badge>
      },
    },
    {
      accessorKey: "employment_status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined
        return v ? <Badge variant={v === "permanent" ? "success" : "outline"} className="capitalize">{v}</Badge> : <span className="text-slate-600">—</span>
      },
    },
    {
      accessorKey: "join_date",
      header: "Join Date",
      cell: ({ getValue }) => <span className="text-xs text-slate-400">{formatDate(getValue() as string)}</span>,
    },
  ]

  if (error) return <ApiErrorDisplay error={error} onRetry={() => refetch()} />

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Enroll Employee
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search employees..."
        emptyMessage="No employees enrolled yet."
      />
      <CreateEmployeeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
