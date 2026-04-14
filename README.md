# Payment Routing & Orchestration — Interactive Prototype

A high-fidelity simulation of an intelligent payment routing engine. Routes transactions across multiple payment processors in real time using a configurable, weighted scoring system — with circuit breaking, automatic retries, and live cost analysis.

> **This is a front-end prototype.** No real payments are processed. All transactions are simulated in-memory to demonstrate routing logic and engine behaviour.

---

## Live Demo

Deployed on Vercel → *(add your URL here after deployment)*

---

## What's Covered

### Dashboard
- Global KPIs: Auth Rate, Total Volume, Total Fees, Fee Savings vs baseline
- Live auth rate trend line chart (Recharts)
- Volume distribution bar chart per processor
- Quick-nav to all sections

### Live Transaction Simulator
- Start / pause / adjust speed (1×–10×) of a continuous transaction stream
- Each transaction shows: amount, card type, region, selected processor, routing decision reasoning, all attempt results, latency, and fee
- Status badges: Success, Recovered (retry succeeded), Failed
- Rolling feed with full routing score breakdown per transaction

### Processor Health
- Real-time health status per processor: Healthy / Degraded / Down
- Circuit breaker state based on rolling success rate window
- Per-processor stats: success count, fail count, total volume, total fees, avg latency, daily limit utilisation
- Six processors modelled: Stripe, Adyen, Braintree, Checkout.com, Square, PayPal

### Routing Configuration
- Enable / disable and reweight five routing rules:
  - **Success Rate** — favour processors with higher recent auth rates
  - **Cost Optimisation** — favour lower-fee processors for the transaction
  - **Geographic Affinity** — favour processors with home-region advantage
  - **Load Balancing** — distribute volume evenly across healthy processors
  - **Latency** — favour processors with lower average response times
- Circuit breaker thresholds: degraded and down cutoffs, recovery threshold, rolling window size
- Retry settings: max retries, retry on soft decline toggle

### Cost Analysis
- Gross savings vs a single-processor baseline
- Fee breakdown per processor (total fees, volume share, avg fee %)
- Card type mix and region mix breakdowns
- Recovery rate: transactions saved by retry logic

---

## How the Routing Engine Works

Each incoming transaction is scored across all eligible processors:

1. **Eligibility check** — processor must support the card's region and card type, and must not be `down`
2. **Rule scoring** — each enabled rule produces a 0–100 score for the processor
3. **Weighted average** — rule weights (set in Routing Config) determine the final composite score
4. **Selection** — highest-scoring eligible processor is selected
5. **Retry** — if the selected processor fails, the next-best eligible processor is tried (up to `maxRetries`)
6. **Circuit breaker** — processors whose rolling success rate drops below the degraded / down thresholds are automatically deprioritised or excluded

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| State | React Context + useReducer (in-memory) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/payment-routing-orchestration.git
cd payment-routing-orchestration

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output is written to the `dist/` folder.

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Sidebar nav shell
│   ├── Dashboard.tsx           # Overview metrics and charts
│   ├── LiveTransactions.tsx    # Transaction feed and simulator controls
│   ├── ProcessorHealth.tsx     # Processor status cards
│   ├── RoutingConfig.tsx       # Rule weights and circuit breaker settings
│   └── CostAnalysis.tsx        # Fee savings and breakdown charts
├── context/
│   └── EngineContext.tsx       # Global engine state (useReducer)
└── engine/
    ├── types.ts                # All TypeScript interfaces
    ├── processors.ts           # Processor definitions and fee calculation
    ├── router.ts               # Scoring, selection, and retry logic
    └── simulator.ts            # Transaction generation and simulation loop
```

---

## Prototype Limitations

- No real API calls — all processor responses are simulated using probability distributions seeded from realistic baseline success rates
- No persistent state — refreshing resets the simulation
- Processor configurations (fees, regions, card support) are hardcoded but editable in `engine/processors.ts`

---

## Background

Built to validate the product design for a payment routing and orchestration layer, exploring how intelligent routing rules, circuit breaking, and retry logic can meaningfully improve auth rates and reduce processing costs across a multi-processor setup.

Supporting documents (PRD, user flows, screen architecture) are included in the parent repository.
