import { PageHeader } from "@/components/layout/PageHeader"
import { GeneralLedgerPanel } from "@/components/accounting/GeneralLedgerPanel"

export const metadata = { title: "General Ledger — MIOS Payroll" }

export default function AccountingPage() {
  return (
    <div>
      <PageHeader
        title="General Ledger Journal"
        description="View monthly payroll journal entries including Income Tax Payable and Social Security Contributions."
      />
      <GeneralLedgerPanel />
    </div>
  )
}
