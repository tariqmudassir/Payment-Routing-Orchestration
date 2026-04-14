# Smart Payment Routing & Orchestration

## User Flows & Screen Architecture

**Companion to:** PRD.md  
**Last Updated:** March 13, 2026

---

## 1. Purpose of This Document

The PRD defined **what** we're building and **why**. This document defines **how users experience it** — the workflows they perform, the screens they navigate, the questions each screen answers, and the actions each screen enables.

This is the blueprint the prototype is built from. Every screen exists because a persona needs it to complete a job. Every element on a screen exists because it answers a question or enables an action. Nothing decorative.

---

## 2. Screen Map

The application has **five primary screens** accessible from a persistent sidebar. The sidebar is always visible. The user's current location is always clear.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────┐  ┌─────────────────────────────────────┐  │
│  │          │  │                                     │  │
│  │ SIDEBAR  │  │         ACTIVE SCREEN               │  │
│  │          │  │                                     │  │
│  │ ● Dash   │  │  (one of five screens below)        │  │
│  │ ○ Live   │  │                                     │  │
│  │ ○ Health │  │                                     │  │
│  │ ○ Config │  │                                     │  │
│  │ ○ Costs  │  │                                     │  │
│  │          │  │                                     │  │
│  │──────────│  │                                     │  │
│  │ SIM      │  │                                     │  │
│  │ CONTROLS │  │                                     │  │
│  └──────────┘  └─────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| # | Screen | Primary Persona | Core Question It Answers |
|---|---|---|---|
| 1 | **Dashboard** | Sarah (Head of Payments) | "How is our payment system performing right now?" |
| 2 | **Live Transactions** | Raj (Payments Engineer) | "What's happening transaction by transaction?" |
| 3 | **Processor Health** | Sarah / Raj | "How is each processor performing, and are any at risk?" |
| 4 | **Routing Configuration** | Sarah | "What rules govern routing, and how do I adjust them?" |
| 5 | **Cost Analysis** | David (CFO) | "How much are we saving, and where can we save more?" |

The **sidebar** also contains simulation controls (start/stop/speed) that persist across all screens, since the simulation drives the entire experience.

---

## 3. User Flows

### Flow 1: "Morning Health Check"

**Persona:** Sarah (Head of Payments)  
**Trigger:** Start of day, or after returning from a meeting  
**Job:** Quickly assess whether the payment system is healthy and performing to expectations  
**Frequency:** 2-3x daily

```
Sarah opens the app
       │
       ▼
  DASHBOARD screen loads
  Sarah scans the four hero metrics:
  auth rate, volume, cost savings, recovery rate
       │
       ├── All metrics green/normal
       │   └── Done. Confidence in <10 seconds.
       │
       └── Something looks off (e.g., auth rate dipped)
           │
           ▼
     Sarah looks at the processor health summary row
     Identifies which processor has a status change
           │
           ▼
     Clicks into PROCESSOR HEALTH screen
     Sees detailed per-processor metrics and timeline
           │
           ▼
     Determines if intervention needed
     (or confirms the system already rerouted traffic)
```

**Design Implications:**
- Dashboard hero metrics must be scannable in under 5 seconds — large type, color-coded, with directional indicators (up/down arrows, red/green).
- Processor health summary on the Dashboard must surface status at a glance without requiring navigation.
- The transition from Dashboard → Processor Health should feel like drilling deeper, not context-switching.

---

### Flow 2: "Processor Going Down — Automated Response"

**Persona:** Sarah and Raj  
**Trigger:** A processor's success rate drops sharply (simulated degradation event)  
**Job:** Confirm the system handled it; understand the impact  
**Frequency:** Occasional (but high-stakes when it happens)

```
Simulation triggers processor degradation
(e.g., Stripe success rate drops from 94% to 45%)
       │
       ▼
  DASHBOARD updates automatically:
  - Stripe's health indicator turns amber → red
  - Auth rate metric shows brief dip, then recovers
  - Volume distribution shifts (traffic moves to other processors)
       │
       ▼
  Sarah navigates to PROCESSOR HEALTH
  - Stripe card shows "DOWN" status with red indicator
  - Other processors show increased volume (absorbed the traffic)
  - Timeline chart shows the exact moment of degradation
       │
       ▼
  Sarah navigates to LIVE TRANSACTIONS
  - Sees transactions that were routed to Stripe, failed, then cascaded to Adyen/Braintree
  - Each cascaded transaction shows retry count and final outcome
       │
       ▼
  After degradation period, Stripe recovers
  - Health status goes amber → green
  - Traffic gradually returns to Stripe
  - Dashboard metrics stabilize
```

**Design Implications:**
- Status changes must be visually prominent — color transitions, status badges.
- The Dashboard must update in real time without requiring refresh.
- Processor Health cards need a temporal dimension (when did status change, how long was it degraded).
- Live Transactions must make cascade/retry behavior visually distinct from normal transactions.

---

### Flow 3: "Why Did This Transaction Fail?"

**Persona:** Raj (Payments Engineer)  
**Trigger:** Customer complaint, support ticket, or anomaly in the feed  
**Job:** Trace a specific transaction's routing journey to understand what happened  
**Frequency:** Several times per week

```
Raj navigates to LIVE TRANSACTIONS
       │
       ▼
  Scans the feed for the transaction in question
  (can identify by status color — red for failed, amber for retried)
       │
       ▼
  Finds the transaction row:
  Shows: ID, $150.00, Visa, EU, → Adyen, Failed → Retry → Stripe, Success
       │
       ▼
  Expands the transaction row (click to expand)
       │
       ▼
  EXPANDED DETAIL shows:
  ┌──────────────────────────────────────────────────┐
  │  Transaction #TXN-2847                           │
  │                                                  │
  │  Routing Decision:                               │
  │  "Selected Adyen (score: 87) — EU region match,  │
  │   best success rate for Visa in EU"              │
  │                                                  │
  │  Attempt 1: Adyen                                │
  │  → Status: Declined (soft)                       │
  │  → Response: "issuer_temporarily_unavailable"    │
  │  → Latency: 340ms                               │
  │                                                  │
  │  Attempt 2: Stripe (cascade fallback)            │
  │  → Status: Approved                              │
  │  → Latency: 220ms                               │
  │  → Fee: $4.65 (2.9% + $0.30)                    │
  │                                                  │
  │  Result: RECOVERED — would have been lost        │
  │  without cascade retry                           │
  └──────────────────────────────────────────────────┘
```

**Design Implications:**
- Transaction rows must be expandable inline (not a separate page) — Raj is scanning multiple transactions.
- The expanded view must tell the full story: routing reasoning, each attempt with its outcome, and the final result.
- "Recovered" transactions should be called out explicitly — this is the product proving its value.
- Color and iconography must distinguish: success (first try), recovered (cascade success), and failed (all attempts exhausted).

---

### Flow 4: "Optimize Routing for Cost"

**Persona:** Sarah (Head of Payments)  
**Trigger:** Monthly cost review, or CFO asking "why are our processing costs up?"  
**Job:** Identify where costs are higher than necessary and adjust routing to reduce them  
**Frequency:** Weekly to monthly

```
Sarah navigates to COST ANALYSIS
       │
       ▼
  Sees headline: "Estimated savings this period: $X vs. single-processor routing"
  Sees cost breakdown by processor — which processor costs the most per transaction?
       │
       ▼
  Notices: Amex transactions are routing to PayPal at 3.5% 
  when Checkout.com could process them at 2.8%
       │
       ├── Clicks on the cost-by-card-type breakdown
       │   Confirms Amex is the most expensive card type
       │
       ▼
  Navigates to ROUTING CONFIGURATION
       │
       ▼
  Increases the weight of the "Cost Optimization" rule
  (slider from current 20% → 40%)
       │
       ▼
  Returns to DASHBOARD to monitor impact
  Over the next few minutes, observes:
  - More Amex transactions routing to Checkout.com
  - Cost per transaction decreasing slightly
  - Auth rate holding steady (no negative impact)
```

**Design Implications:**
- Cost Analysis must be comparative — show actual cost vs. what it would have been. The delta is the value.
- Breakdown dimensions matter: by processor, by card type, by region. These are how Sarah thinks about the problem.
- Routing Configuration must make the connection between weights and outcomes intuitive — changing a weight should feel like turning a dial, not writing code.
- After changing config, the user needs to see the impact play out. The simulation makes this possible in real time.

---

### Flow 5: "Prove ROI to Leadership"

**Persona:** David (CFO / VP Finance)  
**Trigger:** Quarterly business review, budget justification  
**Job:** Get hard numbers on what smart routing is saving the company  
**Frequency:** Monthly to quarterly

```
David navigates to COST ANALYSIS
       │
       ▼
  Headline metric: "Total savings: $47,200 vs. single-processor baseline"
  (simulated period equivalent)
       │
       ▼
  Breakdown shows:
  - Fee savings from cost-optimized routing: $28,400
  - Revenue recovered from cascade retries: $18,800
  - Zero revenue lost to processor outages (vs. estimated $12,000 historical)
       │
       ▼
  David also checks DASHBOARD
  - Auth rate: 94.2% (vs. 88% industry baseline)
  - Recovery rate: 22% of soft declines recovered
       │
       ▼
  David has his talking points for the exec meeting.
```

**Design Implications:**
- Savings must be expressed in dollars, not just percentages. David thinks in dollars.
- The "vs. baseline" comparison is critical — savings are meaningless without a reference point.
- Recovery rate should translate to dollar terms: "22% of soft declines recovered = X transactions = $Y revenue."

---

## 4. Screen Specifications

### 4.1 Dashboard

**Purpose:** Single-glance system health and performance overview.  
**When users come here:** Start of session, periodic check-ins, after making config changes.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  SMART ROUTING DASHBOARD                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │AUTH  │  │TOTAL │  │VOLUME│  │ COST │  │RECOV.│ │
│  │RATE  │  │PROC. │  │TODAY │  │SAVED │  │ RATE │ │
│  │94.2% │  │$1.2M │  │8,421 │  │$4.7K │  │ 22%  │ │
│  │ ↑2.1%│  │      │  │      │  │      │  │      │ │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘ │
│                                                     │
│  ┌─────────────────────┐ ┌────────────────────────┐ │
│  │                     │ │  PROCESSOR HEALTH       │ │
│  │  AUTH RATE TREND     │ │                        │ │
│  │  (line chart,       │ │  ● Stripe    94% ████  │ │
│  │   last 200 txns)    │ │  ● Adyen     91% ███▌  │ │
│  │                     │ │  ● Braintree 89% ███▌  │ │
│  │                     │ │  ● Checkout  92% ████  │ │
│  │                     │ │  ◐ Square    78% ██▌   │ │
│  │                     │ │  ● PayPal    87% ███   │ │
│  └─────────────────────┘ └────────────────────────┘ │
│                                                     │
│  ┌─────────────────────┐ ┌────────────────────────┐ │
│  │  VOLUME BY          │ │  RECENT TRANSACTIONS   │ │
│  │  PROCESSOR          │ │                        │ │
│  │  (bar/donut chart)  │ │  TXN-291 $85  ✓ Stripe│ │
│  │                     │ │  TXN-290 $220 ↻ Adyen │ │
│  │                     │ │  TXN-289 $45  ✓ Sq.   │ │
│  │                     │ │  TXN-288 $190 ✓ Chk.  │ │
│  │                     │ │  TXN-287 $67  ✗ Failed│ │
│  └─────────────────────┘ └────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Elements

| Element | Type | What It Shows | User Action |
|---|---|---|---|
| Auth Rate | Hero metric card | Current blended authorization rate with trend indicator | None (informational) |
| Total Processed | Hero metric card | Total dollar volume processed in current session | None |
| Volume | Hero metric card | Total transaction count | None |
| Cost Saved | Hero metric card | Cumulative savings vs. single-processor baseline | None |
| Recovery Rate | Hero metric card | % of soft declines recovered via cascade retry | None |
| Auth Rate Trend | Line chart | Auth rate over the last N transactions, showing stability or shifts | Hover for detail |
| Processor Health | Compact list | Each processor with status dot, name, success rate, and volume bar | Click to navigate to Processor Health screen |
| Volume by Processor | Bar or donut chart | Distribution of transaction volume across processors | Hover for percentages |
| Recent Transactions | Mini feed | Last 5-8 transactions with status indicators | Click to navigate to Live Transactions screen |

#### Status Indicators

- **Green dot (●):** Healthy — success rate ≥ 80%
- **Amber dot (◐):** Degraded — success rate 50-79%
- **Red dot (○):** Down — success rate < 50%

#### Metric Card Behavior

- Show current value prominently
- Show delta from baseline or previous period (↑ or ↓ with color)
- Green for improvements, red for degradation, gray for neutral

---

### 4.2 Live Transactions

**Purpose:** Real-time feed of every transaction, showing the routing engine in action.  
**When users come here:** Debugging specific transactions, watching the system operate, verifying routing behavior after config changes.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  LIVE TRANSACTIONS                    Filter ▾      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ID       Amount  Card   Region  Processor  Status  │
│  ─────────────────────────────────────────────────  │
│  TXN-294  $85.00  Visa   NA      Stripe     ✓      │
│  TXN-293  $220    MC     EU      Adyen      ✓      │
│  ▶ TXN-292 $150   Visa   EU      Adyen→Str  ↻ REC  │  ← expanded
│  ┌─────────────────────────────────────────────┐    │
│  │ Routing: "Adyen selected — EU Visa match"   │    │
│  │                                             │    │
│  │ Attempt 1: Adyen                            │    │
│  │   Result: Soft decline                      │    │
│  │   Code: issuer_temporarily_unavailable      │    │
│  │   Latency: 340ms                            │    │
│  │                                             │    │
│  │ Attempt 2: Stripe (cascade)                 │    │
│  │   Result: Approved ✓                        │    │
│  │   Latency: 220ms | Fee: $4.65               │    │
│  │                                             │    │
│  │ ✦ RECOVERED — saved by cascade retry        │    │
│  └─────────────────────────────────────────────┘    │
│  TXN-291  $340    Amex   NA      Stripe     ✓      │
│  TXN-290  $45.00  Visa   APAC   PayPal      ✓      │
│  TXN-289  $92.00  MC     LATAM  Braintree   ✓      │
│  TXN-288  $175    Visa   NA     Stripe      ✗ FAIL │
│  ...                                                │
│                                                     │
│  ← Newest transactions appear at top, auto-scroll → │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Elements

| Element | Type | What It Shows | User Action |
|---|---|---|---|
| Transaction row | Table row | ID, amount, card type, region, routed processor, status | Click to expand |
| Expanded detail | Inline panel | Full routing reasoning, all attempts with outcomes, fees, latency | Read; collapse by clicking again |
| Status badge | Colored badge | ✓ Success (green), ↻ Recovered (blue), ✗ Failed (red) | None |
| Filter | Dropdown/toggles | Filter by status (all/success/recovered/failed), by processor, by region | Select filter criteria |

#### Row Color Coding

| Status | Background | Badge | Meaning |
|---|---|---|---|
| Success (first try) | White/default | Green ✓ | Routed optimally, approved on first attempt |
| Recovered (cascade) | Light blue tint | Blue ↻ | Failed first attempt, recovered via retry — **this is the product's value moment** |
| Failed (all retries) | Light red tint | Red ✗ | All attempts exhausted, transaction could not be processed |

#### Scroll Behavior

- New transactions appear at the top with a subtle slide-in animation.
- Auto-scroll keeps the latest transaction visible unless the user has scrolled down to inspect older transactions (auto-scroll pauses on user scroll, resumes on "scroll to top" action).

---

### 4.3 Processor Health

**Purpose:** Detailed per-processor performance view. Understand how each processor is contributing to the system.  
**When users come here:** After spotting a degraded processor on Dashboard, during periodic performance reviews, comparing processors.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  PROCESSOR HEALTH                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ ● STRIPE        │  │ ● ADYEN         │          │
│  │ Status: Healthy  │  │ Status: Healthy  │          │
│  │                  │  │                  │          │
│  │ Auth Rate  94.1% │  │ Auth Rate  91.3% │          │
│  │ Volume    2,847  │  │ Volume    1,923  │          │
│  │ Avg Fee    2.9%  │  │ Avg Fee    2.5%  │          │
│  │ Latency   180ms  │  │ Latency   210ms  │          │
│  │ Load      ████▌  │  │ Load      ███    │          │
│  │                  │  │                  │          │
│  │ Regions: NA, EU  │  │ Regions: EU, APAC│          │
│  │ Cards: All       │  │ Cards: All       │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ ● BRAINTREE     │  │ ● CHECKOUT.COM  │          │
│  │ Status: Healthy  │  │ Status: Healthy  │          │
│  │ ...              │  │ ...              │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ ◐ SQUARE        │  │ ● PAYPAL        │          │
│  │ Status: Degraded │  │ Status: Healthy  │          │
│  │ ...              │  │ ...              │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Processor Card Elements

| Element | What It Shows | Why It Matters |
|---|---|---|
| Status badge | Healthy / Degraded / Down with color | Immediate risk assessment |
| Auth Rate | Current success rate (%) | Core performance indicator |
| Volume | Transaction count handled | Workload distribution |
| Avg Fee | Average processing cost | Cost efficiency per processor |
| Latency | Average response time (ms) | Performance characteristic |
| Load bar | Current volume as % of daily capacity | Headroom for traffic shifts |
| Supported Regions | Which regions this processor serves | Geographic routing context |
| Supported Cards | Which card types are accepted | Card-type routing context |

#### Card Behavior

- Border color matches status (green/amber/red).
- When a processor transitions status (e.g., healthy → degraded), the card border animates to the new color, drawing attention.
- Cards are sorted: degraded/down processors float to the top so problems are immediately visible.

---

### 4.4 Routing Configuration

**Purpose:** View and adjust the rules that govern routing decisions.  
**When users come here:** To tune routing strategy — shift priority between auth rate optimization and cost optimization, enable/disable specific rules, respond to changing business conditions.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  ROUTING CONFIGURATION                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Routing Rules                                      │
│  These weights determine how the routing engine      │
│  scores processors for each transaction.             │
│                                                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  ✓  Success Rate Optimization                  │  │
│  │     Prioritize processors with highest auth     │  │
│  │     rate for the transaction's profile           │  │
│  │     Weight: ████████████░░░░  35%  [─●─────]   │  │
│  ├────────────────────────────────────────────────┤  │
│  │  ✓  Cost Optimization                          │  │
│  │     Route to cheapest eligible processor when   │  │
│  │     auth rates are comparable                    │  │
│  │     Weight: ██████░░░░░░░░░░  20%  [───●───]   │  │
│  ├────────────────────────────────────────────────┤  │
│  │  ✓  Geographic Match                           │  │
│  │     Prefer local acquirers for the              │  │
│  │     cardholder's region                          │  │
│  │     Weight: ██████████░░░░░░  25%  [──●────]   │  │
│  ├────────────────────────────────────────────────┤  │
│  │  ✓  Load Balancing                             │  │
│  │     Distribute volume to avoid hitting          │  │
│  │     processor capacity limits                    │  │
│  │     Weight: ███░░░░░░░░░░░░░  10%  [─●─────]   │  │
│  ├────────────────────────────────────────────────┤  │
│  │  ✓  Latency Optimization                       │  │
│  │     Prefer faster processors for better         │  │
│  │     checkout experience                          │  │
│  │     Weight: ███░░░░░░░░░░░░░  10%  [─●─────]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
│  Cascade Retry Settings                             │
│  ┌────────────────────────────────────────────────┐  │
│  │  Max retry attempts:     [2]  ▲▼               │  │
│  │  Retry on soft decline:  [✓]                   │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
│  Circuit Breaker                                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  Mark degraded below:    [80%] auth rate       │  │
│  │  Mark down below:        [50%] auth rate       │  │
│  │  Recovery threshold:     [85%] sustained       │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Elements

| Element | Type | User Action | Effect |
|---|---|---|---|
| Rule toggle | Checkbox | Enable/disable a routing rule | Rule is included/excluded from scoring |
| Weight slider | Range slider | Adjust how much this factor matters | Routing engine recalculates scores with new weight |
| Weight display | Percentage text | Shows current weight value | Updates in real time as slider moves |
| Max retries | Number stepper | Set cascade retry limit | Changes how many processors are tried before giving up |
| Circuit breaker thresholds | Number inputs | Set degraded/down/recovery thresholds | Changes when processors are pulled from routing |

#### Key Behavior

- Changes take effect **immediately** on the next routed transaction. No "save" button — the simulation reflects changes in real time. This is intentional: it lets stakeholders experiment and see impact during a demo.
- Weight sliders are normalized — they always sum to 100%. Increasing one automatically redistributes the others proportionally.

---

### 4.5 Cost Analysis

**Purpose:** Quantify the financial impact of smart routing. Answer "how much are we saving?"  
**When users come here:** Periodic cost reviews, preparing ROI conversations, identifying cost optimization opportunities.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  COST ANALYSIS                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ TOTAL    │  │ BASELINE │  │ TOTAL    │          │
│  │ FEES     │  │ COST     │  │ SAVINGS  │          │
│  │ $12,840  │  │ $17,540  │  │ $4,700   │          │
│  │ (actual) │  │ (if no   │  │ (26.8%)  │          │
│  │          │  │ routing) │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  Savings Breakdown                                  │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │  Fee optimization (cheaper routing):  $2,840   │  │
│  │  ████████████████████████████░░░░░░░░          │  │
│  │                                                │  │
│  │  Revenue recovered (cascade retry):   $1,860   │  │
│  │  ████████████████████░░░░░░░░░░░░░░░          │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────┐ ┌────────────────────────┐ │
│  │  COST BY PROCESSOR  │ │  COST BY CARD TYPE     │ │
│  │                     │ │                        │ │
│  │  Stripe    2.90%    │ │  Visa        2.65%     │ │
│  │  Adyen     2.48%    │ │  Mastercard  2.71%     │ │
│  │  Braintree 2.75%    │ │  Amex        3.12%     │ │
│  │  Checkout  2.35%    │ │  Discover    2.58%     │ │
│  │  Square    2.60%    │ │                        │ │
│  │  PayPal    3.40%    │ │                        │ │
│  │                     │ │                        │ │
│  │  (bar chart)        │ │  (bar chart)           │ │
│  └─────────────────────┘ └────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  COST BY REGION                                │  │
│  │                                                │  │
│  │  NA     2.72%  ██████████████████              │  │
│  │  EU     2.45%  ████████████████                │  │
│  │  APAC   2.88%  ██████████████████▌             │  │
│  │  LATAM  2.95%  ███████████████████             │  │
│  │  MEA    3.10%  ████████████████████            │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Elements

| Element | Type | What It Shows | Why It Matters |
|---|---|---|---|
| Total Fees | Hero metric | Actual fees paid with smart routing | Real cost |
| Baseline Cost | Hero metric | What fees would have been with single-processor (most expensive path) | The counterfactual |
| Total Savings | Hero metric (highlighted) | Difference in dollars and percentage | The punchline for CFO |
| Savings Breakdown | Horizontal bar | Split between fee optimization savings and revenue recovery | Shows where value comes from |
| Cost by Processor | Bar chart | Average fee % per processor | Identifies expensive processors |
| Cost by Card Type | Bar chart | Average fee % per card type | Identifies expensive card types |
| Cost by Region | Horizontal bar chart | Average fee % per region | Surfaces cross-border cost impact |

#### Baseline Calculation

The "baseline" assumes all transactions routed to the single most expensive eligible processor. This is a reasonable worst-case for a merchant with no routing intelligence — it represents the cost ceiling that smart routing pulls away from.

---

## 5. Sidebar & Simulation Controls

### Sidebar

The sidebar serves two purposes: navigation and simulation control.

```
┌─────────────────┐
│  ◈ SMART        │
│    ROUTING      │
│                 │
│  ● Dashboard    │
│  ○ Transactions │
│  ○ Processors   │
│  ○ Routing      │
│  ○ Cost Analysis│
│                 │
│ ─────────────── │
│                 │
│  SIMULATION     │
│  ▶ Running      │
│  Speed: ●●●○○   │
│  [▶ Start/Stop] │
│                 │
│  TXN/sec: 2.5   │
│  Total: 847     │
│                 │
└─────────────────┘
```

### Simulation Controls

| Control | Type | Effect |
|---|---|---|
| Start/Stop | Toggle button | Starts or pauses transaction generation |
| Speed | 5-level selector | Controls transactions per second (0.5 / 1 / 2 / 5 / 10) |
| TXN/sec | Display | Shows current actual throughput |
| Total | Counter | Cumulative transaction count since simulation started |

### Why Simulation Controls Are Always Visible

The simulation is the heartbeat of the prototype. Without it running, every screen is static. By putting controls in the persistent sidebar:

- The user always knows whether the simulation is running.
- They can adjust speed without leaving their current screen.
- They can pause to inspect a specific moment, then resume.

---

## 6. Interaction Patterns

### 6.1 Real-Time Updates

All screens update in real time as the simulation runs. No polling, no refresh buttons. Data flows continuously.

- Dashboard metrics recalculate with each transaction.
- Charts append new data points.
- Processor health status updates as success rates shift.
- Live transaction feed adds new rows at the top.

### 6.2 Navigation Model

- **Sidebar click:** Switch between the five primary screens. State is preserved — returning to a screen shows it as you left it.
- **Cross-links:** Dashboard elements link to detail screens (click processor health summary → Processor Health screen; click recent transaction → Live Transactions).
- **No modals.** Everything is in the main content area. Modals break the real-time flow.

### 6.3 Color Language

Consistent color coding across all screens:

| Color | Meaning | Used For |
|---|---|---|
| Green (#10B981) | Healthy / Success | Status dots, success badges, positive deltas |
| Amber (#F59E0B) | Degraded / Warning | Degraded status, caution states |
| Red (#EF4444) | Down / Failed | Failed transactions, down status, negative deltas |
| Blue (#6366F1) | Recovered / Active | Cascade recovery badges, active selections, brand |
| Gray (#64748B) | Neutral / Inactive | Disabled states, secondary text |

### 6.4 Animation & Transitions

- **Transaction slide-in:** New transactions appear with a subtle slide-down animation (0.3s ease-out). Draws attention without being distracting.
- **Status transitions:** When a processor status changes, its border color transitions smoothly (0.5s). Creates a visual "alert" without an intrusive popup.
- **Metric updates:** Numbers animate between values (count-up/count-down) rather than jumping. Feels alive.
- **Chart updates:** New data points are appended with a smooth line extension, not a full redraw.

---

## 7. Edge Cases & Empty States

| State | What the User Sees | What They Do |
|---|---|---|
| Simulation not started | Dashboard shows zeroed metrics with a "Start simulation to see routing in action" prompt | Click Start in the sidebar |
| All processors healthy | Processor Health shows all green — no action needed | Confirming: the system is working |
| All processors down | Dashboard shows alert banner: "All processors down — no routing available" | Extreme edge case; demonstrates circuit breaker behavior |
| No failed transactions yet | Live Transactions shows all green rows; "Recovered" filter returns empty with "No cascade retries yet" | Wait for simulation to produce failures |
| Very high speed simulation | Charts may become dense; metrics update rapidly | Consider throttling visual updates to every 500ms even at high sim speeds |

---

## 8. Mapping Screens to PRD Requirements

Every PRD requirement maps to a specific screen element. Nothing in the PRD is unaccounted for in the UI.

| PRD Req | Screen | Element |
|---|---|---|
| M1: Processor registry | Processor Health | Processor cards with properties |
| M2: Weighted scoring algorithm | Routing Config | Weight sliders; Live Transactions expanded view shows scoring |
| M3: Transaction lifecycle | Live Transactions | Status column, expanded attempt history |
| M4: Cascading retry | Live Transactions | Recovered transactions with attempt chain |
| M5: Processor health tracking | Dashboard + Processor Health | Health summary, detailed cards |
| M6: Circuit breaker | Processor Health + Routing Config | Status transitions, threshold settings |
| M7: Dashboard metrics | Dashboard | Five hero metric cards |
| M8: Live transaction feed | Live Transactions | Full-screen transaction table |
| M9: Processor health cards | Processor Health | Six detailed processor cards |
| M10: Simulation engine | Sidebar | Simulation controls |
| S1: Cost analysis | Cost Analysis | Full screen with breakdowns |
| S2: Routing rules UI | Routing Config | Rules with toggles and sliders |
| S3: Geographic routing | Routing Config | Geographic Match rule; Processor Health shows regions |
| S4: Transaction drill-down | Live Transactions | Expanded row detail |
| S5: Trend charts | Dashboard | Auth rate trend chart |

---

*This document defines how each persona interacts with the product, what every screen contains, and why. It's the blueprint for the prototype build.*
