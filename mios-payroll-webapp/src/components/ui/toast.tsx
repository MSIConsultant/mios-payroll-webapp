"use client"
import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn("fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-[380px] flex-col gap-2 p-4", className)}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const toastVariants = {
  default: "border-white/10 bg-slate-800/95",
  success: "border-emerald-500/30 bg-emerald-900/20",
  destructive: "border-red-500/30 bg-red-900/20",
}

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: keyof typeof toastVariants
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
        toastVariants[variant],
        className
      )}
      {...props}
    />
  )
)
Toast.displayName = ToastPrimitive.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-sm font-semibold text-white", className)} {...props} />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn("text-sm text-slate-400", className)} {...props} />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn("ml-auto rounded-md p-0.5 text-slate-400 hover:text-white cursor-pointer", className)}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

// ── Toast Hook ────────────────────────────────────────────────────────────────
interface ToastState {
  id: string
  title?: string
  description?: string
  variant?: keyof typeof toastVariants
  open: boolean
}

const toastListeners: Array<(toasts: ToastState[]) => void> = []
let toasts: ToastState[] = []

function dispatch(toast: Omit<ToastState, "id" | "open">) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { ...toast, id, open: true }]
  toastListeners.forEach((l) => l(toasts))
  setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
    toastListeners.forEach((l) => l(toasts))
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      toastListeners.forEach((l) => l(toasts))
    }, 300)
  }, 4000)
}

export const toast = {
  success: (title: string, description?: string) => dispatch({ title, description, variant: "success" }),
  error: (title: string, description?: string) => dispatch({ title, description, variant: "destructive" }),
  info: (title: string, description?: string) => dispatch({ title, description, variant: "default" }),
}

export function useToasts() {
  const [state, setState] = React.useState<ToastState[]>(toasts)
  React.useEffect(() => {
    toastListeners.push(setState)
    return () => { const idx = toastListeners.indexOf(setState); if (idx > -1) toastListeners.splice(idx, 1) }
  }, [])
  return state
}

// ── Toaster Component ─────────────────────────────────────────────────────────
const variantIcons = {
  default: <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />,
  success: <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />,
  destructive: <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />,
}

export function Toaster() {
  const toasts = useToasts()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant = "default", open }) => (
        <Toast key={id} open={open} variant={variant}>
          {variantIcons[variant]}
          <div className="flex-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

export { Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport, ToastProvider }
