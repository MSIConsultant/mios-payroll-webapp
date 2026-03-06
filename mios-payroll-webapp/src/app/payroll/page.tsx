import { PageHeader } from "@/components/layout/PageHeader"
import { PayrollRunsPanel } from "@/components/payroll/PayrollRunsPanel"

export const metadata = { title: "Payroll Runs — MIOS Payroll" }

export default function PayrollPage() {
  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        description="Create, lock, and process monthly payroll cycles with bulk TER/PPh 21 calculation."
      />
      <PayrollRunsPanel />
    </div>
  )
}
