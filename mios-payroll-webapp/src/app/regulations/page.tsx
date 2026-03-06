import { PageHeader } from "@/components/layout/PageHeader"
import { RegulationsPanel } from "@/components/regulations/RegulationsPanel"

export const metadata = { title: "Tax Regulations — MIOS Payroll" }

export default function RegulationsPage() {
  return (
    <div>
      <PageHeader
        title="Tax Regulations"
        description="Configure annual PTKP thresholds, TER rates (PMK 168/2024), and BPJS contribution rates."
      />
      <RegulationsPanel />
    </div>
  )
}
