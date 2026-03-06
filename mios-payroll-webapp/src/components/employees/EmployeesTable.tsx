"use client"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
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
import { formatIDR, formatDate, getApiErrorMessage } from "@/lib/utils"
import type { EmployeeOut } from "@/lib/api/types"

// --- PTKP MAPPING FOR FRONTEND ---
const PTKP_OPTIONS = [
  { value: "TK0", label: "TK/0 - Single, No Dependants" },
  { value: "TK1", label: "TK/1 - Single, 1 Dependant" },
  { value: "TK2", label: "TK/2 - Single, 2 Dependants" },
  { value: "TK3", label: "TK/3 - Single, 3 Dependants" },
  { value: "K0", label: "K/0 - Married, No Dependants" },
  { value: "K1", label: "K/1 - Married, 1 Dependant" },
  { value: "K2", label: "K/2 - Married, 2 Dependants" },
  { value: "K3", label: "K/3 - Married, 3 Dependants" },
]

// --- NPWP FORMATTER ---
const formatNPWP = (value: string) => {
  const digits = value.replace(/\D/g, "").substring(0, 16); // Allow up to 16 per new regulation
  let formatted = digits;
  if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length > 5) formatted = `${formatted.slice(0, 6)}.${digits.slice(5)}`;
  if (digits.length > 8) formatted = `${formatted.slice(0, 10)}.${digits.slice(8)}`;
  if (digits.length > 9) formatted = `${formatted.slice(0, 12)}-${digits.slice(9)}`;
  if (digits.length > 12) formatted = `${formatted.slice(0, 16)}.${digits.slice(12)}`;
  return formatted;
};

// --- STRICT SCHEMA ALIGNED WITH FASTAPI ---
const schema = z.object({
  company_id: z.string().min(1, "Company is required"),
  name: z.string().min(2, "Name is required"),
  nik: z.string()
    .length(16, "NIK must be exactly 16 digits")
    .regex(/^\d+$/, "NIK must contain only numbers"),
  npwp: z.string().min(15, "NPWP is required (15 or 16 digits)"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  jenis_kelamin: z.enum(["L", "P"], { required_error: "Gender is required" }),
  alamat: z.string().min(5, "Address is required"),
  
  join_date: z.string().min(1, "Join date is required"),
  jabatan: z.string().min(2, "Position/Jabatan is required"),
  bagian: z.string().optional(),
  base_salary: z.coerce.number().min(1, "Base salary is required"),
  ptkp_status: z.enum(["TK0", "TK1", "TK2", "TK3", "K0", "K1", "K2", "K3"], {
    required_error: "PTKP Status is required",
  }),
})
type FormValues = z.infer<typeof schema>

function CreateEmployeeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mutateAsync, isPending } = useCreateEmployee()
  const { data: companies = [] } = useCompanies()
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      // Clean NPWP back to pure numbers and convert company_id to integer
      const payload = { 
        ...data, 
        company_id: parseInt(data.company_id, 10),
        npwp: data.npwp.replace(/\D/g, ""),
        bagian: data.bagian || undefined // Send undefined if empty so backend ignores it
      }
      await mutateAsync(payload)
      toast.success("Employee added", `${data.name} has been enrolled.`)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error("Failed to add employee", getApiErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Employee</DialogTitle>
          <DialogDescription>Add a new employee and set their PTKP tax configuration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section 1: Personal Identity */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-amber-500 border-b border-white/10 pb-2">Personal Identity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-red-400">*</span></Label>
                <Input placeholder="Budi Santoso" {...register("name")} />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1.5">
                <Label>National ID (NIK) <span className="text-red-400">*</span></Label>
                <Input placeholder="16 Digit KTP Number" maxLength={16} {...register("nik")} />
                {errors.nik && <p className="text-xs text-red-400">{errors.nik.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Date of Birth <span className="text-red-400">*</span></Label>
                <Input type="date" {...register("date_of_birth")} />
                {errors.date_of_birth && <p className="text-xs text-red-400">{errors.date_of_birth.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Gender <span className="text-red-400">*</span></Label>
                <Controller
                  control={control}
                  name="jenis_kelamin"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select gender..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki (Male)</SelectItem>
                        <SelectItem value="P">Perempuan (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.jenis_kelamin && <p className="text-xs text-red-400">{errors.jenis_kelamin.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Residential Address <span className="text-red-400">*</span></Label>
                <Input placeholder="Jl. Sudirman No. 1..." {...register("alamat")} />
                {errors.alamat && <p className="text-xs text-red-400">{errors.alamat.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Employment & Tax */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-amber-500 border-b border-white/10 pb-2">Employment & Tax Data</h4>
            <div className="grid grid-cols-2 gap-4">
              
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Company <span className="text-red-400">*</span></Label>
                <Controller
                  control={control}
                  name="company_id"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.company_id && <p className="text-xs text-red-400">{errors.company_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Join Date <span className="text-red-400">*</span></Label>
                <Input type="date" {...register("join_date")} />
                {errors.join_date && <p className="text-xs text-red-400">{errors.join_date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Position (Jabatan) <span className="text-red-400">*</span></Label>
                <Input placeholder="Manager" {...register("jabatan")} />
                {errors.jabatan && <p className="text-xs text-red-400">{errors.jabatan.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Department (Bagian)</Label>
                <Input placeholder="Finance" {...register("bagian")} />
              </div>

              <div className="space-y-1.5">
                <Label>Base Salary (IDR) <span className="text-red-400">*</span></Label>
                <Input type="number" placeholder="10000000" {...register("base_salary")} />
                {errors.base_salary && <p className="text-xs text-red-400">{errors.base_salary.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Tax ID (NPWP) <span className="text-red-400">*</span></Label>
                <Input 
                  placeholder="00.000.000.0-000.000" 
                  {...register("npwp")} 
                  onChange={(e) => {
                    const formatted = formatNPWP(e.target.value);
                    setValue("npwp", formatted, { shouldValidate: true });
                  }}
                />
                {errors.npwp && <p className="text-xs text-red-400">{errors.npwp.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>PTKP Status <span className="text-red-400">*</span></Label>
                <Controller
                  control={control}
                  name="ptkp_status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select PTKP..." /></SelectTrigger>
                      <SelectContent>
                        {PTKP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.ptkp_status && <p className="text-xs text-red-400">{errors.ptkp_status.message}</p>}
              </div>
              
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
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
            <p className="text-xs text-slate-500 font-mono">NIK: {row.original.nik}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "jabatan",
      header: "Position",
      cell: ({ row }) => (
        <div>
          <p className="text-slate-200 text-sm">{row.original.jabatan || "—"}</p>
          {row.original.bagian && <p className="text-xs text-slate-500">{row.original.bagian}</p>}
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
      accessorKey: "ptkp_status",
      header: "PTKP Status",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        // Format TK0 to TK/0 for UI readability
        const formatted = val.length === 3 ? `${val.slice(0, 2)}/${val.slice(2)}` : val;
        return <Badge variant="outline">{formatted}</Badge>
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
        searchPlaceholder="Search employees by name or NIK..."
        emptyMessage="No employees enrolled yet."
      />
      <CreateEmployeeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}