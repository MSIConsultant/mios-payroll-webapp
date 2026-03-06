import { PageHeader } from "@/components/layout/PageHeader"
import { CompaniesTable } from "@/components/companies/CompaniesTable"

export const metadata = { title: "Companies — MIOS Payroll" }

export default function CompaniesPage() {
  return (
    <div>
      <PageHeader
        title="Companies"
        description="Manage registered legal entities and their tax identification numbers."
      />
      <CompaniesTable />
    </div>
  )
}
