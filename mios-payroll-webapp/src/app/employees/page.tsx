import { PageHeader } from "@/components/layout/PageHeader"
import { EmployeesTable } from "@/components/employees/EmployeesTable"

export const metadata = { title: "Employees — MIOS Payroll" }

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage employee records, PTKP status, tax methods, and BPJS enrollment."
      />
      <EmployeesTable />
    </div>
  )
}
