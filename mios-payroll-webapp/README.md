# MIOS Payroll

**Cloud-based Indonesian SaaS Payroll Management System**

A production-grade frontend for managing payroll operations compliant with Indonesian tax law — including TER PMK 168/2024, BPJS Kesehatan, BPJS Ketenagakerjaan, and PPh 21 (Article 21 Income Tax). Built with Next.js 15, TypeScript, and TanStack Query, wired live to a FastAPI backend hosted on Railway.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [API Layer](#5-api-layer)
6. [Data Types & Schemas](#6-data-types--schemas)
7. [React Query Hooks](#7-react-query-hooks)
8. [Pages & Features](#8-pages--features)
9. [UI Component System](#9-ui-component-system)
10. [Design System](#10-design-system)
11. [Utility Functions](#11-utility-functions)
12. [Environment Variables](#12-environment-variables)
13. [Getting Started (Local)](#13-getting-started-local)
14. [Deploying to Vercel](#14-deploying-to-vercel)
15. [Known API Gaps](#15-known-api-gaps)
16. [Indonesian Payroll Glossary](#16-indonesian-payroll-glossary)
17. [Adding a New API Endpoint](#17-adding-a-new-api-endpoint)
18. [Error Handling Reference](#18-error-handling-reference)

---

## 1. Project Overview

MIOS Payroll is a multi-tenant payroll platform built specifically for the Indonesian market. It handles the full payroll lifecycle:

```
Register Company → Enroll Employees → Create Payroll Run → Lock Run → Process Bulk → General Ledger
```

Key Indonesian regulatory requirements this system addresses:

- **TER (Effective Average Tax Rate)** — The simplified PPh 21 calculation method introduced by PMK 168/2024, replacing the old progressive bracket method for monthly calculations.
- **PTKP (Non-Taxable Income Threshold)** — Varies by marital status and number of dependants (TK/0 through K/3).
- **BPJS Kesehatan** — Mandatory national health insurance. Rates: 1% employee / 4% employer.
- **BPJS Ketenagakerjaan** — Employment social security covering JHT (old age), JP (pension), JKK (work accident), and JKM (death benefit).
- **Four tax methods** — Gross, Gross-Up, Net (Netto), and Tax Allowance — each with distinct employer/employee liability implications.

The backend is a live FastAPI service at:
```
https://mios-payroll-production.up.railway.app
```

---

## 2. Tech Stack

| Layer | Library | Version | Why |
|---|---|---|---|
| Framework | **Next.js** | `^15.3.1` | App Router, Server Components, Turbopack dev |
| Language | **TypeScript** | `^5.5.4` | Strict mode; types mirror FastAPI Pydantic schemas |
| Server State | **TanStack Query** | `^5.56.2` | Async data fetching, caching, background refetch, mutation lifecycle |
| Forms | **React Hook Form** | `^7.53.0` | Zero re-renders on keystroke; uncontrolled inputs |
| Validation | **Zod** | `^3.23.8` | Schema validation that mirrors Pydantic models |
| Tables | **TanStack Table** | `^8.20.5` | Headless, sortable, filterable, virtualization-ready |
| UI Primitives | **Radix UI** | `^1.x` | Accessible, unstyled: Dialog, Select, Toast, Label, Tabs |
| Styling | **Tailwind CSS** | `^3.4.11` | Utility-first; dark glassmorphism design system |
| Icons | **Lucide React** | `^0.462.0` | Consistent 24x24 SVG icon set |
| Font | **IBM Plex Sans** | Google Fonts | Designed for financial/data interfaces |
| Bundler (dev) | **Turbopack** | built-in | Rust-based; ~5-10x faster than webpack in dev mode |

---

## 3. Architecture

### Core Design Principle: Isolated API Layer

The single most important architectural decision in this codebase is that **the Railway base URL exists in exactly one place**: `src/lib/api/client.ts`. No component, page, or hook ever imports a URL string directly.

```
┌─────────────────────────────────────────────────────┐
│                     UI Layer                        │
│  (pages, components — know nothing about URLs)      │
└─────────────────────┬───────────────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────────────┐
│              TanStack Query Hooks                   │
│  src/lib/hooks/useApi.ts                            │
│  (manage cache keys, loading/error state)           │
└─────────────────────┬───────────────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────────────┐
│              API Module Layer                       │
│  src/lib/api/{companies,employees,payroll,...}.ts   │
│  (each module owns one resource's endpoints)        │
└─────────────────────┬───────────────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────────────┐
│              API Client (client.ts)                 │
│  • Reads NEXT_PUBLIC_API_BASE_URL                   │
│  • Adds Content-Type / Accept headers               │
│  • Parses FastAPI 422 validation errors             │
│  • Unwraps paginated {items:[]} responses           │
│  • Handles 204 No Content                           │
└─────────────────────────────────────────────────────┘
```

**When the backend changes an endpoint path**, you edit one file in `src/lib/api/`. The rest of the codebase is untouched.

### State Management Strategy

- **Server state** (API data) → TanStack Query. Never stored in `useState`.
- **UI state** (modal open/closed, form values, selected filters) → local `useState` in the component that owns it.
- **No global client state manager** (no Redux, no Zustand) — the app is simple enough that prop drilling + Query cache covers everything.

### Data Flow for a Mutation

```
User clicks "Register Company"
  → Dialog opens (local useState)
  → Form submit triggers useCreateCompany().mutateAsync(data)
  → API client POSTs to /companies/
  → On success: QueryClient.invalidateQueries(['companies'])
  → useCompanies() refetches automatically
  → Table re-renders with new data
  → Toast notification fires
  → Dialog closes
```

---

## 4. Project Structure

```
mios-payroll/
│
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout: Sidebar + Providers + Toaster
│   │   ├── page.tsx                  # Dashboard (live stat cards)
│   │   ├── globals.css               # Tailwind base + CSS custom properties
│   │   ├── providers.tsx             # QueryClient provider (client component)
│   │   ├── companies/page.tsx        # Company registry
│   │   ├── employees/page.tsx        # Employee roster
│   │   ├── payroll/page.tsx          # Payroll run lifecycle
│   │   ├── accounting/page.tsx       # General Ledger Journal
│   │   ├── regulations/page.tsx      # Tax regulation admin
│   │   └── settings/page.tsx         # Settings (placeholder)
│   │
│   ├── components/
│   │   ├── ui/                       # Atomic design-system components
│   │   │   ├── button.tsx            # Variants: default, outline, ghost, destructive
│   │   │   ├── input.tsx             # Styled text input
│   │   │   ├── label.tsx             # Form label (Radix)
│   │   │   ├── badge.tsx             # Status chips: draft, locked, processed
│   │   │   ├── dialog.tsx            # Modal (Radix Dialog)
│   │   │   ├── select.tsx            # Dropdown (Radix Select)
│   │   │   ├── skeleton.tsx          # Loading skeletons (TableSkeleton, CardSkeleton)
│   │   │   └── toast.tsx             # Notification system (Radix Toast + imperative API)
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Fixed left nav with active-link highlighting
│   │   │   └── PageHeader.tsx        # Consistent page title + action slot
│   │   │
│   │   ├── shared/
│   │   │   ├── DataTable.tsx         # Generic TanStack Table wrapper (sort, filter, search)
│   │   │   └── ErrorDisplay.tsx      # ApiErrorDisplay + EmptyState components
│   │   │
│   │   ├── companies/
│   │   │   └── CompaniesTable.tsx    # Company list table + CreateCompanyDialog
│   │   ├── employees/
│   │   │   └── EmployeesTable.tsx    # Employee roster + full enrollment form
│   │   ├── payroll/
│   │   │   └── PayrollRunsPanel.tsx  # Run card UI + Create/Lock/Process workflow
│   │   ├── accounting/
│   │   │   └── GeneralLedgerPanel.tsx # Journal filter + debit/credit table
│   │   └── regulations/
│   │       └── RegulationsPanel.tsx  # PTKP/BPJS rate cards + initialize form
│   │
│   └── lib/
│       ├── api/                      # ← The isolated API layer
│       │   ├── client.ts             # Base URL, fetch wrapper, error parser
│       │   ├── types.ts              # All TypeScript interfaces (mirrors FastAPI schemas)
│       │   ├── companies.ts          # GET/POST/DELETE /companies/
│       │   ├── employees.ts          # GET/POST /employees/
│       │   ├── payroll.ts            # POST runs, lock, process_bulk
│       │   ├── accounting.ts         # GET /accounting/journal/
│       │   ├── reconciliation.ts     # GET /reconciliation/
│       │   ├── regulations.ts        # GET/POST/PUT /regulations/
│       │   ├── salary.ts             # POST /salary_schemes/
│       │   └── index.ts              # Barrel export
│       │
│       ├── hooks/
│       │   └── useApi.ts             # All TanStack Query hooks
│       │
│       └── utils.ts                  # cn(), formatIDR(), formatDate(), constants
│
├── next.config.js                    # Turbopack enabled, CORS headers
├── tailwind.config.ts                # Design tokens: navy/amber/violet palette
├── tsconfig.json                     # strict: true, path alias @/*
├── vercel.json                       # Vercel deployment config
├── .env.example                      # Template for environment variables
└── package.json                      # Scripts: dev (Turbopack), build, type-check
```

---

## 5. API Layer

### `src/lib/api/client.ts` — The Core

This is the only file in the entire codebase that reads `NEXT_PUBLIC_API_BASE_URL`.

```typescript
import { api } from '@/lib/api'

// All four HTTP methods available:
api.get<CompanyOut[]>('/companies/')
api.post<CompanyOut>('/companies/', { name: 'PT Example', npwp: '...' })
api.put<TaxRegulationOut>('/regulations/2025', updatedData)
api.delete<void>('/companies/abc-123')
```

**What the client does automatically:**

1. **Prepends base URL** — combines `NEXT_PUBLIC_API_BASE_URL` + your endpoint path.
2. **Sets headers** — `Content-Type: application/json` and `Accept: application/json` on every request.
3. **Handles 204/205** — returns `undefined` cleanly without trying to parse an empty body.
4. **Parses FastAPI 422 errors** — FastAPI returns validation errors as `{ detail: [{loc, msg, type}] }`. The client converts this into a flat `{ message, fieldErrors }` object usable by React Hook Form.
5. **Unwraps paginated responses** — if the API returns `{ items: [...], total: N }`, the client returns just the `items` array, so consumers never need to know about the wrapper.
6. **Network error handling** — catches `fetch` throwing (e.g. server unreachable) and converts to the same `ApiError` shape.

**FastAPI 422 Error Parsing — detailed:**

```
FastAPI sends:
{
  "detail": [
    { "loc": ["body", "npwp"], "msg": "field required", "type": "missing" },
    { "loc": ["body", "name"], "msg": "min length is 2", "type": "string_too_short" }
  ]
}

Client parses to:
{
  message: "npwp: field required; name: min length is 2",
  fieldErrors: {
    "npwp": "field required",
    "name": "min length is 2"
  },
  statusCode: 422
}
```

The `fieldErrors` map can be passed directly to React Hook Form's `setError()`.

### API Modules

Each module is a thin wrapper around `api.get/post/put/delete`. They exist so the URL paths are named and discoverable:

| Module | File | Endpoints wrapped |
|---|---|---|
| Companies | `companies.ts` | `GET /companies/`, `POST /companies/`, `GET /companies/{id}`, `DELETE /companies/{id}` |
| Employees | `employees.ts` | `GET /employees/`, `POST /employees/`, `GET /employees/{id}` |
| Payroll | `payroll.ts` | `POST /payroll/runs`, `POST /payroll/runs/{id}/lock`, `POST /payroll/runs/{id}/process_bulk` |
| Accounting | `accounting.ts` | `GET /accounting/journal/{company_id}/{year}/{month}` |
| Reconciliation | `reconciliation.ts` | `GET /reconciliation/{employee_id}/{year}` |
| Regulations | `regulations.ts` | `GET /regulations/`, `POST /regulations/`, `GET /regulations/{year}`, `PUT /regulations/{year}` |
| Salary Schemes | `salary.ts` | `POST /salary_schemes/` |

---

## 6. Data Types & Schemas

All TypeScript interfaces live in `src/lib/api/types.ts`. They are maintained in sync with FastAPI's Pydantic models. **When the backend schema changes, this is the only file that needs to be updated.**

### Key Types

**`CompanyOut`**
```typescript
interface CompanyOut {
  id: string
  name: string
  npwp: string          // Indonesian Tax Registration Number
  address?: string
  industry?: string
  created_at?: string
}
```

**`EmployeeOut`**
```typescript
interface EmployeeOut {
  id: string
  company_id: string
  name: string
  nik: string           // 16-digit National Identity Number (KTP)
  npwp?: string         // Employee's personal tax ID
  email?: string
  position?: string
  department?: string
  employment_status?: 'permanent' | 'contract' | 'freelance'
  join_date?: string
  base_salary: number   // In IDR
  marital_status: 'TK' | 'K/0' | 'K/1' | 'K/2' | 'K/3'
  tax_method: 'gross' | 'gross_up' | 'netto' | 'tax_allowance'
  bpjs_kesehatan?: boolean
  bpjs_ketenagakerjaan?: boolean
  salary_scheme_id?: string
}
```

**`PayrollRecordOut`** — the result of processing a payroll run:
```typescript
interface PayrollRecordOut {
  id: string
  run_id: string
  employee_id: string
  employee_name?: string
  gross_income: number
  net_income: number
  income_tax: number              // PPh 21
  bpjs_kesehatan_employee: number
  bpjs_kesehatan_employer: number
  bpjs_ketenagakerjaan_employee: number
  bpjs_ketenagakerjaan_employer: number
  thp: number                     // Take Home Pay
  details?: Record<string, unknown>
}
```

**`TaxRegulationOut`** — annual tax configuration:
```typescript
interface TaxRegulationOut {
  id: string
  year: number
  ptkp: Record<string, number>        // e.g. { "TK/0": 54000000, "K/3": 72000000 }
  ter_rates?: Record<string, unknown> // TER PMK 168/2024 bracket tables
  bpjs_rates?: Record<string, number> // e.g. { "kesehatan_employee": 0.01 }
}
```

**`ApiError`** — standardized error shape returned by the client:
```typescript
interface ApiError {
  message: string                      // Human-readable summary
  statusCode: number                   // HTTP status code (0 = network error)
  fieldErrors?: Record<string, string> // Field-level errors from 422 responses
}
```

---

## 7. React Query Hooks

All server state lives in `src/lib/hooks/useApi.ts`. Components import hooks, never raw API modules directly.

### Query Keys

All cache keys are centralized in the `queryKeys` object to prevent string typos causing cache misses:

```typescript
export const queryKeys = {
  companies:                ['companies'],
  company:       (id)    => ['companies', id],
  employees:                ['employees'],
  employee:      (id)    => ['employees', id],
  regulations:              ['regulations'],
  regulation:    (year)  => ['regulations', year],
  journal:       (c,y,m) => ['journal', c, y, m],
  reconciliation:(e,y)   => ['reconciliation', e, y],
}
```

### Available Hooks

**Query hooks (read):**

| Hook | Query Key | Notes |
|---|---|---|
| `useCompanies()` | `['companies']` | Normalizes to `[]` if API returns non-array |
| `useCompany(id)` | `['companies', id]` | Only fetches when `id` is truthy |
| `useEmployees()` | `['employees']` | Normalizes to `[]` if API returns non-array |
| `useEmployee(id)` | `['employees', id]` | Only fetches when `id` is truthy |
| `useRegulations()` | `['regulations']` | `staleTime: 5min` — regulations change rarely |
| `useRegulationByYear(year)` | `['regulations', year]` | Only fetches when `year` is truthy |
| `useJournal(companyId, year, month)` | `['journal', ...]` | Only fetches when all three args are truthy |
| `useReconciliation(employeeId, year)` | `['reconciliation', ...]` | Only fetches when both args are truthy |

**Mutation hooks (write):**

| Hook | Action | Cache Invalidated |
|---|---|---|
| `useCreateCompany()` | POST /companies/ | `['companies']` |
| `useDeleteCompany()` | DELETE /companies/{id} | `['companies']` |
| `useCreateEmployee()` | POST /employees/ | `['employees']` |
| `useCreatePayrollRun()` | POST /payroll/runs | — (stored in local state) |
| `useLockPayrollRun()` | POST /payroll/runs/{id}/lock | — |
| `useProcessBulkPayroll()` | POST /payroll/runs/{id}/process_bulk | — |
| `useCreateRegulation()` | POST /regulations/ | `['regulations']` |
| `useUpdateRegulation()` | PUT /regulations/{year} | `['regulations']`, `['regulations', year]` |
| `useCreateSalaryScheme()` | POST /salary_schemes/ | — |

### Retry Behaviour

The QueryClient is configured to **not retry** on 4xx errors (client mistakes that won't self-resolve) but will retry up to 2 times on 5xx or network errors:

```typescript
retry: (failureCount, error) => {
  if (error?.statusCode >= 400 && error?.statusCode < 500) return false
  return failureCount < 2
}
```

---

## 8. Pages & Features

### `/` — Dashboard

Live stat cards pulling from the API on mount. Displays:
- Total registered companies
- Total enrolled employees
- Total monthly payroll base salary (summed in IDR)
- Quick action links to the three primary workflows

Defensive normalization: `Array.isArray()` guards prevent a crash if the API returns an unexpected shape.

### `/companies` — Company Registry

Full CRUD table for company entities.

**Table columns:** Company Name, NPWP, Industry (badge), Address, Registration Date, Delete action

**Create Company dialog fields:**
- Legal Company Name (required, min 2 chars)
- NPWP — Tax Registration Number (required, 15–20 chars)
- Industry (optional)
- Registered Address (optional)

Zod validation runs client-side before the API is called. FastAPI 422 errors display inline under each field.

### `/employees` — Employee Roster

Enrollment form with all Indonesian payroll-specific fields.

**Table columns:** Employee (avatar + name + email), Position/Department, Base Salary (IDR), PTKP Status (marital status code), Income Tax Method (badge), Employment Status, Join Date

**Create Employee dialog — Identity section:**
- Company (dropdown from live API)
- Full Name, NIK (16 digits), NPWP (optional), Email (optional)
- Position, Department

**Create Employee dialog — Compensation & Tax section:**
- Base Salary (IDR)
- Employment Status (Permanent / Contract / Freelance)
- Marital Status — maps to PTKP code (TK/0 through K/3)
- Income Tax Method (Gross / Gross-Up / Net / Tax Allowance)

**Create Employee dialog — Social Security (BPJS) section:**
- BPJS Kesehatan toggle (default: on)
- BPJS Ketenagakerjaan toggle (default: on)

### `/payroll` — Payroll Runs

Implements the full payroll lifecycle in a card-based UI.

**Lifecycle states:**

```
Draft  →  [Lock Run]  →  Locked  →  [Process Bulk Payroll]  →  Processed
```

**Create Run dialog:**
- Company (dropdown)
- Fiscal Year (2023–2026)
- Period Month (January–December)

**Lock Run:** Calls `POST /payroll/runs/{id}/lock`. Changes status badge from Draft to Locked.

**Process Bulk:** Fetches all employees for the run's company and automatically constructs the `BulkPayrollRequest`. Calls `POST /payroll/runs/{id}/process_bulk`. On success, displays an inline results table showing per-employee: Gross Income, THP, PPh 21 deducted.

> Note: The API has no `GET /payroll/runs/` endpoint yet, so runs created in a session are tracked in local `useState`. They will be lost on page refresh until the backend adds a list endpoint.

### `/accounting` — General Ledger Journal

Filter panel (Company + Year + Month) then "Generate Journal" loads the double-entry ledger table.

**Journal entry display:**
- Entry reference and description header
- Double-entry ledger table: Account Code, Account Name, Description, Debit, Credit
- Totals footer row confirming debit = credit (balanced ledger)

Account names use standard international accounting terminology (e.g. "Income Tax Payable", "Social Security Contributions — Employer").

### `/regulations` — Tax Regulations Admin

Initialize and view annual tax parameter sets.

**Initialization:** Creates a new regulation year pre-populated with PMK 168/2024 defaults:
- PTKP thresholds for all 8 marital status codes (TK/0 through K/3)
- BPJS contribution rates: Kesehatan (1% employee / 4% employer), JHT, JP

**Regulation card display:**
- PTKP grid (8 cells, IDR formatted)
- BPJS rates grid (percentage formatted)
- Edit button (UI wired, backend PUT endpoint already supported)

---

## 9. UI Component System

### `Button`

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="secondary">Violet accent</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Subtle</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Trash2 /></Button>
<Button disabled={isPending}>
  {isPending ? 'Saving...' : 'Save'}
</Button>
```

### `DataTable`

Generic table component wrapping TanStack Table v8. Pass typed column definitions and data:

```tsx
const columns: ColumnDef<CompanyOut>[] = [
  { accessorKey: 'name', header: 'Company Name' },
  { accessorKey: 'npwp', header: 'NPWP' },
]

<DataTable
  columns={columns}
  data={companies}
  isLoading={isLoading}
  searchable
  searchPlaceholder="Search companies..."
  emptyMessage="No companies found."
/>
```

Features: client-side global search, column sort (click header), skeleton loader while `isLoading`, record count footer.

### `Toast` (imperative API)

Fires notifications without needing a React context hook:

```typescript
import { toast } from '@/components/ui/toast'

toast.success('Title', 'Optional description')
toast.error('Something failed', errorMessage)
toast.info('FYI', 'Some information')
```

Toasts auto-dismiss after 4 seconds. The `<Toaster />` component must be present in the layout (it already is in `src/app/layout.tsx`).

### `Badge`

```tsx
<Badge variant="draft">Draft</Badge>
<Badge variant="locked">Locked</Badge>
<Badge variant="processed">Processed</Badge>
<Badge variant="success">Permanent</Badge>
<Badge variant="destructive">Terminated</Badge>
<Badge variant="secondary">Gross-Up</Badge>
<Badge variant="outline">K/2</Badge>
```

### `ApiErrorDisplay`

Shows a centred error UI with a retry button:

```tsx
if (error) return (
  <ApiErrorDisplay
    error={error}
    onRetry={() => refetch()}
    title="Failed to load employees"
  />
)
```

### Skeleton Loaders

```tsx
<TableSkeleton rows={5} cols={4} />   // Animated shimmer rows
<CardSkeleton />                       // Single stat card placeholder
```

---

## 10. Design System

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| Background | `#020817` (slate-950) | Page background |
| Surface | `#0F172A` (slate-900) | Sidebar, modals |
| Border | `rgba(255,255,255,0.06–0.10)` | Card / table borders |
| Primary (Gold) | `#F59E0B` (amber-500) | CTAs, active nav, key numbers |
| Primary Hover | `#FBBF24` (amber-400) | Button hover state |
| Accent (Violet) | `#8B5CF6` (violet-500) | Secondary badges, gross-up highlights |
| Text Primary | `#F8FAFC` (slate-50) | Headings, key values |
| Text Secondary | `#CBD5E1` (slate-300) | Body text |
| Text Muted | `#64748B` (slate-500) | Labels, subtitles |
| Success | `#10B981` (emerald-500) | Processed status, permanent employees |
| Error | `#EF4444` (red-500) | Destructive actions, error states |

### Typography

Font: **IBM Plex Sans** (Google Fonts) — weights 300, 400, 500, 600, 700.

Chosen specifically for financial interfaces. IBM Plex Sans has tabular number alignment, making salary and tax figures easy to scan in tables.

```css
font-family: 'IBM Plex Sans', sans-serif;
```

### Effects

- **Glassmorphism cards**: `backdrop-blur-xl` + `bg-white/[0.03]` + `border border-white/[0.08]`
- **Sidebar**: `bg-slate-900/80 backdrop-blur-xl`
- **Modals**: `bg-slate-900/95 backdrop-blur-xl`
- **Transitions**: 150–200ms on hover/focus states (`transition-colors duration-200`)
- **Shimmer skeleton**: CSS gradient animated via `background-position`

### Utility Class: `glass-card`

Defined in `globals.css`:
```css
.glass-card {
  @apply rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm;
}
.glass-card-hover {
  @apply glass-card hover:bg-white/[0.06] transition-colors cursor-pointer;
}
```

---

## 11. Utility Functions

All in `src/lib/utils.ts`:

| Function | Input | Output | Example |
|---|---|---|---|
| `cn(...classes)` | Tailwind class strings | Merged, deduplicated string | `cn('p-4', isActive && 'bg-amber-500')` |
| `formatIDR(amount)` | `number` | IDR currency string | `5000000` → `"Rp 5.000.000"` |
| `formatDate(dateStr?)` | ISO date string or undefined | Readable date or `"—"` | `"2025-03-01"` → `"01 Mar 2025"` |
| `formatPeriod(year, month)` | `number, number` | Month + year string | `(2025, 3)` → `"March 2025"` |
| `getApiErrorMessage(error)` | `unknown` | Safe error string | Extracts `.message` or returns fallback |

**Constants:**

```typescript
TAX_METHOD_LABELS     // Record<TaxMethod, display string>
MARITAL_STATUS_LABELS // Record<MaritalStatus, full PTKP description>
MONTHS                // Array<{ value: 1–12, label: string }>
```

---

## 12. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | Full URL of the FastAPI backend, no trailing slash |

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=https://mios-payroll-production.up.railway.app
```

> The `NEXT_PUBLIC_` prefix exposes the variable to the browser bundle. This is intentional — the API URL is not a secret. Never put secrets (API keys, database passwords) in `NEXT_PUBLIC_` variables.

For local backend development:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 13. Getting Started (Local)

### Prerequisites

- Node.js 18.17 or newer (22.x recommended)
- npm 9+

### Steps

```bash
# 1. Clone or unzip the project
cd mios-payroll

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local if you need to point to a different backend

# 4. Start the development server (Turbopack enabled)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

First load takes ~2–4 seconds (Turbopack compiling). Subsequent navigations are near-instant.

### Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with Turbopack on port 3000 |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Start production server (requires `build` first) |
| `npm run lint` | ESLint check |
| `npm run type-check` | TypeScript check without emitting files |

---

## 14. Deploying to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install CLI globally
npm install -g vercel

# From the project root — follow the prompts
vercel

# Production deployment
vercel --prod
```

When prompted for environment variables, set:
```
NEXT_PUBLIC_API_BASE_URL = https://mios-payroll-production.up.railway.app
```

### Option B — GitHub Integration (recommended for teams)

1. Push the project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the repository.
4. In the **Environment Variables** section add:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://mios-payroll-production.up.railway.app`
5. Click **Deploy**.

Every push to `main` will auto-deploy. Pull requests get preview URLs automatically.

### Option C — vercel.json (already configured)

The `vercel.json` at the root pre-configures the framework and build settings. The env variable inside it is a default fallback — override it in the Vercel dashboard for real deployments:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "https://mios-payroll-production.up.railway.app"
  }
}
```

### Build Output

```
Route (app)              Size     First Load JS
○ /                      3.7 kB       126 kB
○ /companies             2.2 kB       183 kB
○ /employees             3.4 kB       201 kB
○ /payroll               4.9 kB       185 kB
○ /accounting            2.9 kB       154 kB
○ /regulations           4.6 kB       168 kB
○ /settings              0.1 kB       102 kB
```

All routes are static (`○`) — they prerender to HTML and hydrate client-side. Vercel's edge CDN caches them globally.

---

## 15. Known API Gaps

These endpoints are missing from the backend. The frontend is designed to accommodate them without structural changes — each addition only requires a few lines in the relevant `src/lib/api/` module and a new hook.

### Critical (blocks production use)

| Missing Endpoint | Impact | Frontend work needed when added |
|---|---|---|
| `POST /auth/login`, `GET /auth/me` | API is fully open — no authentication | Add `Authorization: Bearer` header in `client.ts`; add `/login` page |
| `GET /payroll/runs/?company_id=` | Cannot list historical payroll runs | Add `payrollApi.listRuns()` + `usePayrollRuns()` hook |
| `GET /payroll/runs/{id}` | Cannot restore run state after page refresh | Add `payrollApi.get(id)` + `usePayrollRun(id)` hook |

### Important (degrades UX)

| Missing Endpoint | Impact | Frontend work needed when added |
|---|---|---|
| Pagination params on `GET /employees/` and `GET /companies/` | List endpoints will time out or crash with large datasets | Add `?page=&limit=` params; update `DataTable` to support server-side pagination |
| `PUT /employees/{id}` | No way to correct employee data after enrollment | Add edit dialog to `EmployeesTable` |
| `GET /salary_schemes/` | Cannot populate salary scheme dropdown in employee form | Add `salaryApi.list()` + `useSalarySchemes()` hook |
| `GET /employees/?company_id={id}` | Cannot scope employees per company — multi-tenancy risk | Add filter param to `employeesApi.list(companyId)` |

### Nice to Have

| Missing Endpoint | Impact |
|---|---|
| `DELETE /employees/{id}` | No offboarding/soft-delete flow |
| `GET /reconciliation/` (list) | Cannot browse all annual tax summaries |
| `POST /payroll/runs/{id}/finalize` | Lifecycle is incomplete — no finalized state transition |
| `PATCH /regulations/{year}` | Partial update support for individual PTKP/BPJS fields |

---

## 16. Indonesian Payroll Glossary

| Indonesian Term | International Standard Term | Description |
|---|---|---|
| PPh 21 | Article 21 Income Tax | Monthly income tax withheld at source by the employer |
| TER | Effective Average Tax Rate | Simplified monthly PPh 21 method introduced by PMK 168/2024 |
| PTKP | Non-Taxable Income Threshold | Annual income exempt from tax; varies by marital status |
| PKP | Taxable Income | Gross annual income minus PTKP |
| THP | Take Home Pay | Net salary received by employee after all deductions |
| BPJS Kesehatan | National Health Insurance | Mandatory: 1% employee, 4% employer contribution |
| BPJS Ketenagakerjaan | Employment Social Security | Umbrella program covering JHT, JP, JKK, and JKM |
| JHT | Old Age Security Fund | Retirement savings: 2% employee, 3.7% employer |
| JP | Pension Program | Monthly pension: 1% employee, 2% employer (wage-capped) |
| JKK | Work Accident Insurance | 0.24–1.74% employer only (varies by industry risk level) |
| JKM | Death Benefit Insurance | 0.3% employer only |
| NIK | National Identity Number | 16-digit number on the Indonesian KTP identity card |
| NPWP | Tax Registration Number | Individual or corporate tax ID issued by Direktorat Jenderal Pajak |
| Gross Method | Gross (Employee Borne) | Employee bears PPh 21; stated salary is pre-tax gross |
| Gross-Up | Gross-Up (Employer Borne) | Employer absorbs PPh 21; salary is grossed up to cover the tax |
| Netto | Net (Fixed Net Salary) | Employee receives a fixed net amount; employer pays all tax on top |
| Tax Allowance | Tax Allowance (Reimbursed) | Employer pays tax as a formal allowance, included in the employee's gross income |
| TK/0 | Single, No Dependants | Annual PTKP: Rp 54,000,000 |
| K/0 | Married, No Dependants | Annual PTKP: Rp 58,500,000 |
| K/1 | Married, 1 Dependant | Annual PTKP: Rp 63,000,000 |
| K/2 | Married, 2 Dependants | Annual PTKP: Rp 67,500,000 |
| K/3 | Married, 3 Dependants | Annual PTKP: Rp 72,000,000 (maximum) |
| PMK 168/2024 | Ministerial Regulation 168/2024 | DJP regulation that introduced the TER simplified tax calculation method |

---

## 17. Adding a New API Endpoint

Follow these four steps every time the backend adds a new endpoint. The entire change is contained within `src/lib/api/` and `src/lib/hooks/useApi.ts`.

### Example: Adding `GET /payroll/runs/` (list all runs for a company)

**Step 1 — Confirm the type** (`src/lib/api/types.ts`)

`PayrollRunOut` already exists. Nothing to add here unless the new endpoint returns a new shape.

**Step 2 — Add the API call** (`src/lib/api/payroll.ts`):
```typescript
export const payrollApi = {
  // ... existing methods ...
  listRuns: (companyId?: string) =>
    api.get<PayrollRunOut[]>(
      companyId
        ? `/payroll/runs/?company_id=${companyId}`
        : '/payroll/runs/'
    ),
}
```

**Step 3 — Add the hook** (`src/lib/hooks/useApi.ts`):
```typescript
export function usePayrollRuns(companyId?: string) {
  return useQuery({
    queryKey: ['payroll-runs', companyId ?? 'all'],
    queryFn: async () => {
      const data = await payrollApi.listRuns(companyId)
      return Array.isArray(data) ? data : []
    },
    staleTime: 15_000,
  })
}
```

**Step 4 — Use it in the component** (`src/components/payroll/PayrollRunsPanel.tsx`):
```typescript
const { data: runs = [], isLoading } = usePayrollRuns(selectedCompanyId)
```

That is the entire change. No modifications needed to `client.ts`, `layout.tsx`, `providers.tsx`, or any infrastructure file.

---

## 18. Error Handling Reference

### In a component using a query:
```tsx
const { data, isLoading, error, refetch } = useCompanies()

if (isLoading) return <TableSkeleton rows={5} cols={4} />
if (error)     return <ApiErrorDisplay error={error} onRetry={() => refetch()} />
```

### In a form mutation:
```tsx
const { mutateAsync, isPending } = useCreateCompany()

const onSubmit = async (data: FormValues) => {
  try {
    await mutateAsync(data)
    toast.success('Company registered')
    onClose()
  } catch (err) {
    // getApiErrorMessage safely extracts .message from ApiError shape
    toast.error('Registration failed', getApiErrorMessage(err))
  }
}
```

### Mapping FastAPI 422 field errors directly into React Hook Form:
```tsx
} catch (err) {
  const apiErr = err as ApiError
  if (apiErr.fieldErrors) {
    Object.entries(apiErr.fieldErrors).forEach(([field, message]) => {
      setError(field as keyof FormValues, { message })
    })
  } else {
    toast.error('Error', apiErr.message)
  }
}
```

### HTTP Status Code Behaviour

| Status | What happens |
|---|---|
| `200` | Returns parsed JSON body |
| `204` / `205` | Returns `undefined` (no body to parse) |
| `422` | Throws `ApiError` with `fieldErrors` map populated from FastAPI detail array |
| `400` / `404` / `409` | Throws `ApiError` with `message` from FastAPI `detail` string |
| `500` | Throws `ApiError`; TanStack Query retries up to 2 times before showing error state |
| Network fail | Throws `ApiError` with `statusCode: 0` and a user-readable "Unable to reach the server" message |