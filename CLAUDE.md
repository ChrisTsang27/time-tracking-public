# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js time tracking application with gamification features, built on Supabase for authentication and data storage. The app includes RPG-style progression (XP, levels, streaks), invoice generation, and productivity features like daily kickoffs and reflections.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom animations
- **UI Components**: Radix UI primitives
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **State Management**: React hooks + local state
- **Charts**: Recharts
- **PDF Generation**: jsPDF + jsPDF-autotable
- **Excel Export**: xlsx
- **Animations**: Framer Motion

## Architecture

### Database Schema

**Core Tables:**

- `time_logs`: Time entries with title, hours, description, progress status, category, tags
- `profiles`: User profiles with XP, level, current_streak, last_log_date for gamification
- `invoice_settings`: User business details and default invoice settings
- `invoices`: Generated invoices with client details and totals
- `invoice_items`: Line items linking to time logs or custom entries

All tables use Row Level Security (RLS) with user-scoped policies based on `auth.uid()`.

### Application Structure

**Entry Points:**

- `app/page.tsx`: Main dashboard (requires auth, redirects to /login if not authenticated)
- `app/login/page.tsx`: Authentication page (email/password via Supabase)

**Key Components:**

- `components/app-sidebar.tsx`: Navigation between views (Dashboard, Records, Calendar, Projects, Export)
- `components/app-header.tsx`: User status card with XP/level display
- `components/time-log-dialog.tsx`: Modal for creating/editing time logs
- `components/log-list.tsx`: Displays time logs with filtering, sorting, editing, deletion
- `components/analytics-dashboard.tsx`: Charts showing productivity trends
- `components/calendar-view.tsx`: Calendar interface for viewing time logs by date
- `components/invoice-dialog.tsx`: Multi-step invoice creation with preview
- `components/daily-kickoff.tsx`: Morning productivity prompt (shows before 6 PM, once per day)
- `components/end-of-day-reflection.tsx`: Evening reflection prompt (shows after 6 PM, once per day)
- `components/command-palette.tsx`: Keyboard shortcuts (Cmd+K) for quick actions

**State Management:**

- Main dashboard uses `refreshTrigger` state to coordinate data refreshes across components
- Time-based features use localStorage to track when dialogs were last shown
- Most components fetch data directly from Supabase using `supabase` client

### Gamification System

Implemented in `lib/gamification.ts`:

- **XP Calculation**: 100 XP per hour logged
- **Leveling**: Starts at 500 XP, increases by 1.2x multiplier per level
- **Streaks**: Consecutive days of logging time (resets if day is skipped)
- **Titles**: Role-playing titles based on level (Novice Chronomancer → Eternal Guardian)

XP and streaks are updated in the database when time logs are created.

### Invoice System

- User sets up business details in `invoice_settings` (one per user)
- Invoices can be generated from selected time logs or created manually
- PDF export uses jsPDF with custom formatting
- Invoice items link to time logs via optional `time_log_id` foreign key

### Theming

- Uses `next-themes` for dark/light mode switching
- Theme provider wraps app in `components/theme-provider.tsx`
- Custom CSS variables defined in `app/globals.css`
- Gradient backgrounds and glass-morphism effects throughout

### Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Migrations

Migration files are included in the root directory:

- `schema.sql`: Base RLS policies for time_logs
- `migration_rpg_system.sql`: Profiles table for gamification
- `migration_invoice_system.sql`: Invoice tables (settings, invoices, invoice_items)
- `migration_add_fields.sql`: Additional field updates
- `migration_tactical_pack.sql`: Feature additions

These should be run in Supabase SQL editor to set up the database schema.

## Key Patterns

### Data Fetching

Components typically fetch data in useEffect hooks using the Supabase client:

```typescript
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("user_id", userId);
```

### Authentication Flow

- Session checked via `supabase.auth.getSession()` on page load
- Unauthenticated users redirected to `/login`
- Logout clears session and redirects to `/login`

### Responsive Design

- Mobile-first approach with Tailwind breakpoints
- Sidebar hidden on mobile, accessible via hamburger menu
- Touch-optimized UI components

### Type Safety

All data types defined in `types/index.ts` including TimeLog, Profile, Invoice, InvoiceSettings, InvoiceItem.

## Feature: Invoice Live Preview ✅ COMPLETED

Invoice creation dialog now shows a live preview of the final invoice layout.

**Implementation Details:**

- ✅ **Left side**: Form inputs for invoice (client, notes, etc.) - scrollable
- ✅ **Right side**: Read-only preview component (`InvoicePreview`) that renders exactly how the exported invoice looks
- ✅ **Real-time updates**: Preview updates instantly using React `useMemo` for performance optimization
- ✅ **Responsive design**:
  - Desktop (lg+): Side-by-side layout
  - Mobile: Preview stacks below form (vertical layout)
- ✅ **Components created**:
  - `components/invoice-preview.tsx`: Reusable preview component with HTML/CSS rendering
  - Updated `components/invoice-dialog.tsx`: New layout with live preview integration
- ✅ **No breaking changes**: All existing functionality preserved (PDF export, database save)
- ✅ **Type-safe**: Full TypeScript support with proper interfaces
