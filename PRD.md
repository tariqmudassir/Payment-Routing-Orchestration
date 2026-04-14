# Smart Payment Routing & Orchestration

## Product Requirements Document

**Author:** Product Management  
**Status:** Draft  
**Last Updated:** March 13, 2026

---

## 1. Executive Summary

Merchants processing payments at scale are forced into a costly trade-off: depend on a single payment processor (and accept its outages, fees, and blind spots) or manually manage multiple processors with no intelligence layer between them. Both paths leave money on the table.

**Smart Payment Routing & Orchestration** is an intelligent middleware layer that sits between a merchant's checkout and multiple payment processors. It makes real-time routing decisions to maximize authorization rates, minimize processing costs, and eliminate single points of failure — automatically.

The core bet: **the routing decision is the most undervalued lever in payment infrastructure.** A 2-3% improvement in authorization rates at scale translates directly to recovered revenue. A 15-20% reduction in processing costs drops straight to margin. And failover protection turns payment outages from revenue emergencies into non-events.

---

## 2. Problem Statement

### 2.1 The Landscape

The global digital payments market processes over $10 trillion annually. Merchants operating across geographies typically integrate with 2-5 payment processors (Stripe, Adyen, Braintree, Checkout.com, etc.). Yet the vast majority route transactions with no intelligence — either hardcoded to a single processor or using basic round-robin distribution.

### 2.2 Core Problems

#### Problem 1: Failed Transactions = Lost Revenue

**"Transactions fail, and we just lose that customer."**

- The average online payment authorization rate is 85-90%. That means 10-15% of attempted purchases fail at the processor level.
- Of those failures, an estimated 20-30% are "soft declines" — temporary issues (processor overload, issuer timeouts, risk scoring edge cases) that a different processor would approve.
- Most merchants have no retry logic. When a transaction fails, the customer sees "Payment Failed" and abandons.
- **Impact:** A merchant processing $100M/year with an 88% auth rate is losing ~$12M in failed transactions. Recovering even 20% of recoverable declines = **$720K-$1.8M in recaptured revenue.**

#### Problem 2: Overpaying on Processing Fees

**"We're paying the same rate on every transaction regardless of the best option."**

- Processing fees vary significantly across providers: 2.4%-3.5% + $0.20-$0.30 per transaction, with additional surcharges for international cards, premium card types, and currency conversion.
- A domestic Visa transaction might cost 2.4% on Processor A but 2.9% on Processor B. An international Amex might be 3.5% on Processor A but 2.8% on Processor C.
- Without cost-aware routing, merchants systematically overpay on transactions that have a cheaper path.
- **Impact:** On $100M volume, a 0.3% average fee reduction through intelligent routing = **$300K annual savings.**

#### Problem 3: Processor Outages Are Revenue Emergencies

**"When Stripe went down last quarter, we lost 4 hours of sales."**

- Every major processor experiences outages — Stripe (2-3 incidents/year with >30min impact), Adyen, Braintree — all have documented incidents.
- For a merchant doing $100M/year, a 4-hour outage during peak hours can mean $50K-$200K in lost sales.
- Most merchants have no automated failover. When their primary processor goes down, engineering scrambles to manually reroute — if they even have a backup integration ready.
- **Impact:** Automated failover eliminates revenue loss during processor outages entirely.

#### Problem 4: Geography Mismatch Kills Authorization Rates

**"Our US-based processor declines our European customers at a much higher rate."**

- Local acquiring (processing a transaction through a processor with a local presence in the cardholder's region) improves authorization rates by 3-8% compared to cross-border processing.
- Cross-border transactions also incur additional fees (typically 1-1.5% surcharge).
- Merchants with global customers but a single processor are eating both the higher decline rate and the cross-border fee on every international transaction.
- **Impact:** Geo-intelligent routing simultaneously improves auth rates AND reduces fees for international transactions.

#### Problem 5: No Unified Visibility Across Processors

**"I can't tell you our actual success rate — I'd have to pull data from three different dashboards."**

- Each processor has its own dashboard, its own metrics definitions, its own reporting cadence.
- There is no single view that lets a payments team compare processor performance, identify trends, or make data-driven routing decisions.
- Decisions about which processor to use for which traffic are made on gut feel or outdated analyses, not real-time data.
- **Impact:** Without unified visibility, optimization is impossible. Teams can't improve what they can't measure.

### 2.3 Problem Summary

| Problem | Who Feels It | Severity | Current Workaround |
|---|---|---|---|
| Failed transactions (soft declines) not retried | Revenue/Product teams | **Critical** | None — revenue is lost |
| Overpaying on processing fees | Finance/Ops | **High** | Periodic manual review, renegotiation |
| Processor outages halt revenue | Engineering/Revenue | **Critical** | Manual failover (slow, error-prone) |
| Cross-border transactions underperform | International growth teams | **High** | Separate regional integrations (expensive) |
| No unified analytics across processors | Payments/Analytics teams | **Medium** | Manual data aggregation, spreadsheets |

---

## 3. User Personas

### Persona 1: Head of Payments — "Sarah"

- **Role:** Leads payments strategy at a mid-to-large e-commerce company ($50M-$500M GMV)
- **Goals:** Maximize authorization rates, reduce processing costs, ensure uptime
- **Frustrations:** Doesn't have real-time visibility into cross-processor performance. Spends weeks building business cases for processor changes. Gets blamed when outages happen.
- **Decision Criteria:** ROI-driven. Needs clear cost-benefit analysis. Cares deeply about reliability.

### Persona 2: Payments Engineer — "Raj"

- **Role:** Builds and maintains payment integrations
- **Goals:** Clean abstractions, reliable failover, minimal on-call incidents
- **Frustrations:** Every new processor is a 3-6 month integration project. Retry logic is hacked together. Gets paged at 2am when a processor goes down.
- **Decision Criteria:** API quality, documentation, ease of integration, operational reliability.

### Persona 3: CFO / VP Finance — "David"

- **Role:** Owns cost structure, margin optimization
- **Goals:** Reduce payment processing as a % of revenue
- **Frustrations:** Knows the company is overpaying on processing but can't pinpoint where. Fee structures are opaque.
- **Decision Criteria:** Hard dollar savings, clear reporting, compliance confidence.

---

## 4. Jobs to Be Done

| Job | Context | Desired Outcome |
|---|---|---|
| Route each transaction to the processor most likely to approve it | At checkout, in real time, across all traffic | Higher authorization rates without customer friction |
| Automatically retry failed transactions through alternative processors | When a soft decline occurs, before the customer sees a failure | Recover revenue from transactions that would otherwise be lost |
| Failover instantly when a processor is degraded or down | During outages, without manual intervention | Zero revenue impact from processor incidents |
| Route transactions to minimize processing cost | When multiple processors can handle a transaction equally well | Lower cost-per-transaction without sacrificing approval rates |
| See unified performance across all processors in one place | When making strategic payments decisions | Data-driven processor strategy, not gut feel |
| Configure routing logic without code changes | When business conditions change (new market, new processor, seasonal shifts) | Payments team can self-serve routing adjustments |

---

## 5. Solution Overview

### 5.1 What We're Building

An **intelligent payment routing layer** that acts as a single integration point between the merchant and multiple payment processors. Every transaction flows through the routing engine, which makes a real-time decision about which processor to use based on configurable rules and live performance data.

### 5.2 How It Works

```
Customer Checkout
       │
       ▼
┌──────────────────────────────┐
│   ROUTING ENGINE             │
│                              │
│  1. Evaluate transaction     │
│     (amount, card, region)   │
│                              │
│  2. Score each processor     │
│     (success rate, cost,     │
│      geography, health)      │
│                              │
│  3. Route to best match      │
│                              │
│  4. If declined → cascade    │
│     to next-best processor   │
│                              │
│  5. Log decision + outcome   │
│     for continuous learning  │
└──────────┬───────────────────┘
           │
     ┌─────┼─────┬─────────┐
     ▼     ▼     ▼         ▼
  Stripe  Adyen  Braintree  ...
```

### 5.3 Core Capabilities

**1. Multi-Factor Routing Engine**
- Scores every eligible processor for each transaction across weighted dimensions: historical success rate, cost, geographic fit, processor health, and load.
- Routing decisions are transparent — every transaction logs why it was routed where it was.

**2. Retry & Cascading Fallback**
- On soft decline, automatically retries through the next-best processor.
- Configurable retry limits (default: up to 2 cascading retries).
- Idempotency controls to prevent duplicate charges.

**3. Real-Time Health Monitoring**
- Continuously tracks each processor's success rate, latency, and error patterns.
- Detects degradation before full outage. Automatically shifts traffic away from unhealthy processors.
- Circuit breaker pattern: if a processor's success rate drops below threshold, it's temporarily removed from routing.

**4. Cost Optimization**
- Calculates actual cost per transaction for each processor (percentage fee + fixed fee + surcharges).
- When multiple processors have similar authorization likelihood, routes to the cheapest option.
- Tracks cumulative savings vs. single-processor baseline.

**5. Unified Analytics Dashboard**
- Single view across all processors: authorization rates, volume distribution, cost analysis, latency.
- Transaction-level drill-down showing routing decision, attempts, and outcome.
- Trend analysis to surface performance shifts over time.

**6. Configurable Routing Rules**
- Business users can adjust routing weights (e.g., prioritize cost over speed, or vice versa).
- Rules can be toggled on/off without code changes.
- Support for processor pinning (force specific traffic to specific processors for testing or compliance).

---

## 6. Feature Requirements

### 6.1 Priority Framework

We use **MoSCoW** to define scope boundaries clearly:

- **Must Have** — Required for the product to deliver its core value. Ship is blocked without these.
- **Should Have** — Significantly enhances value. Plan for these but can defer if timeline is tight.
- **Could Have** — Nice-to-have improvements. Build if capacity allows.
- **Won't Have (this phase)** — Explicitly out of scope. Important for alignment.

### 6.2 Requirements

#### MUST HAVE (MVP)

| ID | Requirement | Rationale |
|---|---|---|
| M1 | **Processor registry** with configurable properties (fees, regions, card types, status) | Foundation — routing needs processors to route to |
| M2 | **Weighted scoring algorithm** that evaluates processors on success rate, cost, and eligibility | Core routing intelligence — the product's reason to exist |
| M3 | **Transaction lifecycle management** (pending → processing → success/failed) | Need to track what happened to every transaction |
| M4 | **Cascading retry logic** — on soft decline, automatically attempt next-best processor | Primary revenue recovery mechanism |
| M5 | **Processor health tracking** — real-time success rate monitoring with status classification (healthy/degraded/down) | Required for reliable routing decisions |
| M6 | **Circuit breaker** — automatically remove processors that fall below success rate threshold | Prevents routing into known failures |
| M7 | **Dashboard with key metrics** — auth rate, volume, cost, processor health at a glance | Visibility is a core user need, not a nice-to-have |
| M8 | **Live transaction feed** showing routing decisions and outcomes in real time | Demonstrates the system working; builds trust |
| M9 | **Processor health cards** — per-processor status, success rate, volume, latency | Users need to see each processor's contribution |
| M10 | **Transaction simulation engine** for the prototype | Lets stakeholders interact with the system without live data |

#### SHOULD HAVE

| ID | Requirement | Rationale |
|---|---|---|
| S1 | **Cost analysis view** — compare actual vs. optimal cost, show savings | Makes the financial case tangible |
| S2 | **Routing rules configuration UI** — toggle rules, adjust weights | Self-serve reduces dependency on engineering |
| S3 | **Geographic routing intelligence** — prefer local acquirers for international transactions | Meaningful auth rate improvement for global merchants |
| S4 | **Transaction detail drill-down** — full attempt history, routing reasoning, timeline | Debug capability; answers "why did this transaction go here?" |
| S5 | **Performance trend charts** — auth rate and cost over time | Surfaces degradation trends before they become problems |

#### COULD HAVE

| ID | Requirement | Rationale |
|---|---|---|
| C1 | **A/B testing framework** — route a % of traffic to test new processors or configurations | Enables data-driven processor evaluation |
| C2 | **Alerting & notifications** — processor health alerts, anomaly detection | Proactive vs. reactive operations |
| C3 | **Exportable reports** — CSV/PDF of routing performance | Finance and exec reporting needs |
| C4 | **Machine learning-based routing** — model that learns from historical outcomes | Adaptive optimization beyond static rules |

#### WON'T HAVE (This Phase)

| ID | Requirement | Rationale |
|---|---|---|
| W1 | Actual payment processor API integrations | Prototype uses simulation; real integrations are an engineering workstream |
| W2 | PCI DSS compliance implementation | Compliance is critical but out of scope for a prototype |
| W3 | Multi-tenant / SaaS architecture | Prototype demonstrates single-merchant experience |
| W4 | Webhook delivery and event streaming | Infrastructure concern for production build |
| W5 | Settlement and reconciliation | Adjacent domain; separate product scope |

---

## 7. Success Metrics

### 7.1 Product Metrics (What the product optimizes for)

| Metric | Definition | Target | Why It Matters |
|---|---|---|---|
| **Authorization Rate Lift** | % improvement in auth rate vs. single-processor baseline | +2-5% | Primary value proposition. Directly maps to recovered revenue. |
| **Cost Per Transaction** | Blended processing cost across all routed transactions | 10-20% reduction vs. unoptimized | Demonstrates financial value to CFO persona. |
| **Recovery Rate** | % of initially-declined transactions recovered via retry/cascade | 15-25% of soft declines | Quantifies the cascade retry value. |
| **Failover Time** | Time from processor degradation detection to traffic reroute | < 30 seconds | Measures reliability promise. |
| **Routing Decision Latency** | Time added to transaction by the routing layer | < 50ms p95 | Must not degrade checkout experience. |

### 7.2 Prototype Success Criteria

For the prototype specifically, success means:

1. **Demonstrates the routing engine making visibly intelligent decisions** — stakeholders can see transactions being routed differently based on card type, geography, and processor health.
2. **Shows cascading retry recovering failed transactions** — a transaction fails on Processor A and succeeds on Processor B, visibly.
3. **Quantifies cost savings** — dashboard shows what the merchant saved vs. single-processor routing.
4. **Handles processor degradation gracefully** — when a simulated processor goes down, traffic reroutes automatically and the dashboard reflects it.
5. **Is interactive** — stakeholders can adjust routing weights, toggle processors, and see the impact in real time.

---

## 8. Scope of Work — Prototype

### 8.1 What We're Building

A **fully interactive, simulation-driven prototype** that demonstrates smart payment routing in action. The prototype will:

- Simulate realistic transaction traffic (varying amounts, card types, regions, currencies)
- Run each transaction through the real routing algorithm
- Simulate processor responses (with realistic success/failure rates that shift over time)
- Display everything in a real-time dashboard

### 8.2 Architecture

```
┌─────────────────────────────────────────────────┐
│  PROTOTYPE APPLICATION (React + TypeScript)      │
│                                                  │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │  Simulation   │───▶│  Routing Engine        │  │
│  │  Engine       │    │  (same logic as prod)  │  │
│  │              │    │                        │  │
│  │  Generates    │    │  - Processor scoring   │  │
│  │  transactions │    │  - Weighted selection   │  │
│  │  at interval  │    │  - Retry / cascade     │  │
│  └──────────────┘    │  - Health tracking      │  │
│                      └───────────┬────────────┘  │
│                                  │               │
│  ┌───────────────────────────────▼────────────┐  │
│  │  Dashboard UI                              │  │
│  │                                            │  │
│  │  - Metrics overview     - Cost analysis    │  │
│  │  - Processor health     - Routing config   │  │
│  │  - Live transaction log - Trend charts     │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 8.3 Simulated Processors

| Processor | Strengths | Weaknesses |
|---|---|---|
| **Stripe** | High NA success rate, broad card support | Higher fees, lower APAC performance |
| **Adyen** | Strong EU presence, competitive international fees | Slightly lower NA rates |
| **Braintree** | PayPal integration, good LATAM coverage | Higher Amex fees |
| **Checkout.com** | Lowest fees for EU, fast settlement | Limited LATAM support |
| **Square** | Strong for small transactions | No international coverage |
| **PayPal** | High consumer trust, good for APAC | Highest fees, slower latency |

### 8.4 Build Sequence

| Phase | Deliverable | Components |
|---|---|---|
| **Phase 1: Engine** | Core routing logic | Types, processor registry, scoring algorithm, transaction lifecycle, retry/cascade manager, metrics tracker |
| **Phase 2: Simulation** | Transaction simulator | Realistic traffic generation, processor response simulation, time-varying processor health |
| **Phase 3: Dashboard** | Interactive UI | Layout, metrics overview, processor health cards, live transaction feed |
| **Phase 4: Advanced Views** | Configuration & analysis | Routing rules UI, cost analysis, transaction drill-down, trend charts |

### 8.5 Key Simulation Behaviors

The simulator should demonstrate these scenarios naturally during runtime:

1. **Optimal routing** — Visa transactions from NA route to Stripe (highest NA auth rate); EU transactions route to Adyen or Checkout.com.
2. **Cost optimization** — When two processors have similar auth rates, the cheaper one wins.
3. **Cascade recovery** — ~10% of transactions will soft-decline on the first processor and succeed on retry via a different processor.
4. **Processor degradation** — Periodically, a processor's success rate drops (simulating real degradation). The engine detects it and reroutes traffic. Dashboard shows the shift.
5. **Health recovery** — After a degradation period, the processor recovers and gradually receives traffic again.

---

## 9. Technical Considerations

| Consideration | Approach |
|---|---|
| **Routing latency** | Scoring algorithm is O(n) where n = number of processors (typically <10). Sub-millisecond in practice. |
| **Idempotency** | Each transaction gets a unique ID. Retry attempts reference the parent transaction to prevent duplicate charges. |
| **Circuit breaker thresholds** | Configurable. Default: mark degraded at <80% success rate, mark down at <50%. Recovery requires sustained >85% over a window. |
| **Retry limits** | Configurable per merchant. Default: max 2 cascade retries. Hard stop to prevent infinite retry loops. |
| **State management** | React context with reducer pattern. Engine state is in-memory for the prototype (production would use a proper data store). |
| **Production path** | Engine logic is written as pure TypeScript functions, decoupled from React. Can be extracted to a Node.js service directly. |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Routing adds latency to checkout | Medium | High | Engine is designed for <50ms overhead. Scoring is simple math, not ML inference. Monitor p95 latency. |
| Cascade retries cause duplicate charges | High (if not handled) | Critical | Idempotency keys on every transaction. Processors deduplicate on their end. We never retry a "success." |
| Incorrect routing degrades auth rates | Medium | High | Shadow mode: run routing engine alongside existing single-processor path, compare decisions before switching live. |
| Processor adds/changes fee structure | High (ongoing) | Medium | Processor registry is configurable. Fee updates are a config change, not a code change. |
| Over-optimization for cost hurts auth rate | Medium | High | Routing weights are configurable. Cost is one factor among several, never the sole criterion. Default config prioritizes auth rate. |
| Prototype doesn't reflect real-world complexity | Medium | Medium | Use realistic processor characteristics based on published benchmarks. Simulate edge cases (degradation, region mismatch) explicitly. |

---

## 11. Open Questions

1. **Processor contract constraints** — Some processor agreements include minimum volume commitments. Should the routing engine enforce volume floors? *(Defer to production phase.)*
2. **3DS / SCA interaction** — Strong Customer Authentication requirements may constrain which processors can handle EU transactions. How does routing interact with the authentication layer? *(Defer to production phase.)*
3. **Tokenization strategy** — If card tokens are processor-specific, cascading to a different processor requires network tokenization or raw card data. What's the tokenization approach? *(Defer to production phase.)*
4. **Regulatory routing constraints** — Some regions (India, Brazil) have regulations requiring local processing. Should routing rules enforce compliance? *(Should Have — include in routing rules framework.)*

---

## 12. Appendix: Competitive Landscape

| Solution | Approach | Gap Our Product Fills |
|---|---|---|
| **Spreedly** | Vault + basic routing | Limited intelligence — rules are static, no real-time optimization |
| **Pagos** | Analytics layer on top of processors | Visibility only — doesn't route or retry |
| **Primer** | Workflow-based orchestration | Powerful but complex — steep learning curve, heavy implementation |
| **Custom Internal** | Bespoke routing logic per merchant | Expensive to build, hard to maintain, no shared learning |

Our approach combines **real-time intelligent routing** (not just static rules), **cascading retry** (not just failover), and **unified analytics** in a single layer — with a configuration-first model that lets payments teams self-serve.

---

*This document defines what we're building and why. Next step: build the prototype to demonstrate this in action.*
