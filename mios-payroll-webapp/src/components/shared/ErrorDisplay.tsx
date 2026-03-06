import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/utils"

interface ApiErrorDisplayProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function ApiErrorDisplay({ error, onRetry, title = "Failed to load data" }: ApiErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
        <AlertCircle className="h-6 w-6 text-red-400" />
      </div>
      <div>
        <p className="font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-sm text-slate-500 max-w-md">{getApiErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
        <span className="text-2xl">📭</span>
      </div>
      <div>
        <p className="font-medium text-slate-200">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
