# Design System & UX Guidelines — IT Support Ticket Analytics Platform

**Document Version:** 1.0.0  
**Status:** Governed Design System Baseline  
**Styling Framework:** Tailwind CSS 3.4.15 + Custom Design Tokens  
**Iconography:** Lucide React  
**Visualization Engine:** Recharts 2.13.3

---

## 1. Design Philosophy & Operational Core

The **IT Support Ticket Analytics Platform** is an enterprise tool built for operational service desks, incident managers, and IT leadership. Its visual identity must convey clarity, rigor, and immediate legibility.

### 1.1 The Operational Reading Hierarchy
Every analytical screen follows the governed decision-making flow:
```
1. CONTEXT & FILTERS     -> What scope of data am I looking at? (Department, Priority, Timeframe)
2. PRIMARY METRICS       -> What is the overall operational health? (Total Volume, Active Backlog, SLA Compliance)
3. MACRO TREND           -> What changed over time? (Monthly Throughput, Seasonality Curves)
4. SUPPORTING BREAKDOWNS -> Why did it change? (Category Shifts, Team Capacity, Resolution Distributions)
5. ACTIONABLE EXCEPTIONS -> Where is immediate intervention required? (SLA Breaches, Approaching Limits)
6. GOVERNED TAKEAWAY     -> What is the exact operational next step?
```

This embodies the management principle:
**WHAT MATTERS → WHAT CHANGED → WHY → WHAT TO DO NEXT**

### 1.2 Anti-Patterns Strictly Prohibited
- **No Decorative Complexity**: Avoid superfluous multi-color background gradients, floating glassmorphism blur layers, or distracting entry animations that delay data scannability.
- **No Generic AI SaaS Templates**: Refrain from purple-indigo gradient cards or artificial "sparkle" iconography.
- **No Ambiguous Titles**: Chart headers must express the business question or insight (e.g., *"Monthly Intake vs. Resolution Throughput"*, not just *"Tickets Chart"*).
- **No Unlabeled Units**: Every metric card and chart axis must explicitly indicate units (e.g., *"Hours (24/7 Calendar)"*, *"%"*, *"Tickets"*).

---

## 2. Color Palette & Design Tokens

The application employs a neutral slate background system with high-contrast functional accents:

### 2.1 Neutral Foundation (Light Surface System)
| Token Name | Hex Code | Tailwind Utility | Purpose |
|:---|:---|:---|:---|
| Background Slate | `#F8FAFC` | `bg-slate-50` | Primary application canvas background |
| Surface Card | `#FFFFFF` | `bg-white` | Content containers, KPI cards, table panels |
| Border Slate | `#E2E8F0` | `border-slate-200` | Subtle container divisions and table borders |
| Divider Slate | `#F1F5F9` | `border-slate-100` | Inner row dividers |
| Text Primary | `#0F172A` | `text-slate-900` | Headings, primary metric values, critical labels |
| Text Secondary | `#475569` | `text-slate-600` | Explanatory labels, table column headers, breadcrumbs |
| Text Muted | `#94A3B8` | `text-slate-400` | Timestamps, placeholder text, inactive controls |

### 2.2 Semantic & Operational Accents
Colors are reserved strictly for operational status and categorical differentiation:

```
[ Primary Brand / Operational Blue ]  -> #2563EB (blue-600)   : Intake, active state, standard actions
[ Resolution / Compliance Emerald  ]  -> #059669 (emerald-600): Resolved tickets, compliant SLA, positive delta
[ Priority: Critical / Breach Red   ]  -> #DC2626 (red-600)    : P1 Critical, SLA breach, negative alerts
[ Priority: High / Warning Amber    ]  -> #D97706 (amber-600)  : P2 High, approaching SLA limit (<2h)
[ Priority: Medium / Info Indigo    ]  -> #4F46E5 (indigo-600) : P3 Medium, general inquiry
[ Priority: Low / Neutral Slate     ]  -> #64748B (slate-500)  : P4 Low, minor enhancement
```

### 2.3 Status Badges Specification
```tsx
// Status Pill Implementation Tokens
Open:        bg-blue-50   text-blue-700   border-blue-200
In Progress: bg-amber-50  text-amber-700  border-amber-200
Pending:     bg-purple-50 text-purple-700 border-purple-200
Resolved:    bg-emerald-50 text-emerald-700 border-emerald-200
Closed:      bg-slate-100 text-slate-700  border-slate-300
```

---

## 3. Typography & Spacing System

### 3.1 Typeface & Hierarchy
The application relies on clean system typography (Inter / -apple-system / BlinkMacSystemFont):

| Level | Size / Weight | Line Height | Usage |
|:---|:---|:---|:---|
| **Page Title (H1)** | `text-2xl font-bold` (24px) | `leading-tight` | Header of functional view |
| **Section Title (H2)** | `text-lg font-semibold` (18px) | `leading-snug` | Grouping container or major chart panel |
| **Card Header (H3)** | `text-sm font-semibold` (14px) | `leading-normal` | KPI card title, modal headers |
| **Primary Metric** | `text-3xl font-bold` (30px) | `tracking-tight` | Primary KPI numbers (e.g., `8,000`, `87.9%`) |
| **Body Standard** | `text-sm font-normal` (14px) | `leading-relaxed` | Table cell text, descriptive paragraphs |
| **Micro Caption** | `text-xs font-medium` (12px) | `leading-normal` | Timestamps, tags, SLA thresholds, tooltips |

### 3.2 Spacing & Grid System
- **Container Padding**: Standard pages utilize `p-6 lg:p-8` for outer spacing.
- **Card Padding**: Standard cards utilize `p-5` or `p-6`.
- **Card Gap**: Grid layouts utilize `gap-6` (24px) between dashboard cards.
- **Hierarchy Margins**: `mb-2` for micro-labels; `mb-6` between header and filter bar; `mb-8` between major analytical tiers.

---

## 4. Component Design Patterns

### 4.1 Filter Bar (`FilterBar.tsx`)
- Always pinned immediately below the page header.
- Features multi-dimensional dropdowns: Department, Priority, Status, Date Range, and Search Query.
- Displays an **Active Filter Counter** (e.g., *"3 active filters"*) and a single-click *"Reset Filters"* button when non-default selections are present.
- Displays immediate visual feedback showing the resulting record count (e.g., *"Showing 1,555 of 8,000 tickets"*).

### 4.2 KPI Card (`KpiCard.tsx`)
- Top: Category icon + Metric Title + Contextual Tooltip.
- Middle: Large, high-contrast metric value (e.g., `14.9 hrs`).
- Bottom: Comparison delta (vs. target or prior period) + explicit baseline definition (e.g., *"Target: 24h (Calendar)"*).
- Interactive cards provide subtle hover elevation (`hover:shadow-md`) and keyboard focus outlines.

### 4.3 Data Table (`DataTable.tsx`)
- Fixed-height or paginated layout with clean horizontal divider borders (`border-slate-100`).
- Alternating row hover state (`hover:bg-slate-50/75`).
- Sortable column headers with visual sort indicators (Chevron Up/Down).
- Status, Priority, and Assignee cells render as standardized pills.
- Right-aligned actions column with explicit icon buttons (View, Edit, Dispatch).

### 4.4 Chart Styling (`ChartCard.tsx` + Recharts)
- Neutral gridlines (`stroke="#F1F5F9"` with `strokeDasharray="3 3"`).
- Restrained axis styling (`tick={{ fill: '#64748B', fontSize: 12 }}`).
- Custom interactive tooltips with white card background, drop shadow, and formatted values with explicit units.
- Descriptive legend positioned at the top-right of the card.

---

## 5. Responsive Behavior & Breakpoints

The UI adheres strictly to Tailwind's mobile-first responsive grid:

| Breakpoint | Width Range | Layout Adaptation |
|:---|:---|:---|
| **Mobile (`<640px`)** | 320px – 639px | Single column stack; sidebar collapses into top hamburger drawer; data tables enable horizontal touch scrolling; KPI cards display in 1 or 2 columns. |
| **Tablet (`640px–1023px`)** | 640px – 1023px | 2-column KPI grid; charts stack vertically; filter bar wraps into 2 rows; collapsible sidebar. |
| **Desktop (`1024px+`)** | 1024px – 1279px | 3 or 4-column KPI grid; dual-chart side-by-side layout; persistent fixed sidebar navigation. |
| **Wide Screen (`1280px+`)** | 1280px+ | Maximum container width capped at `max-w-7xl` or full-width dashboard layout; 6-column KPI grid for executive overview. |

---

## 6. Accessibility & Usability Standards (WCAG 2.1 AA)

1. **Color Contrast**:
   - All text against background meets or exceeds the **4.5:1** contrast ratio requirement.
   - Large metric text meets the **3:1** ratio requirement.
2. **Keyboard Navigation**:
   - Tab order logically follows the visual DOM layout.
   - Interactive elements (buttons, links, inputs, table rows) feature high-visibility focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`).
3. **Screen Reader Semantics**:
   - Semantic HTML5 landmark elements: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
   - Dynamic charts provide fallback summary tables or descriptive `aria-label` attributes.
   - Form inputs possess explicit `<label>` tags with matching `htmlFor` identifiers.

---

## 7. UI State Design Patterns

```
+-----------------------------------------------------------------------------------+
| 1. LOADING STATE                                                                  |
|    - Animated skeleton bars match target metric cards and table rows.             |
|    - Background synchronization alert: "Hydrating operational dataset (8,000)..."|
+-----------------------------------------------------------------------------------+
| 2. EMPTY STATE                                                                    |
|    - Centered inbox icon + "No tickets match the selected filters".               |
|    - Single-click action: [ Clear All Filters ]                                    |
+-----------------------------------------------------------------------------------+
| 3. ERROR STATE                                                                    |
|    - Amber/Red banner with specific failure code (e.g. "ERR_NETWORK_DISCONNECTED")|
|    - Action button: [ Reconnect & Retry Hydration ]                               |
+-----------------------------------------------------------------------------------+
| 4. UNAUTHORIZED STATE (/403)                                                      |
|    - Shield alert icon + "Access Restricted to IT Support Specialists".           |
|    - Role switcher shortcuts: [ Switch to Agent ] or [ Return to My Tickets ]     |
+-----------------------------------------------------------------------------------+
```
