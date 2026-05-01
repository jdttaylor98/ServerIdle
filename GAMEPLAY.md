# ServerIdle — Gameplay Flow

End-to-end walkthrough of the current player experience. Everything through Phase 6c is *implemented and live*.

---

## Starting state

A brand-new player opens the game with:

| Resource | Starting value |
|---|---|
| Credits | `0` |
| Servers owned | `0` of all types |
| Capacity buildings | `0` of all types |
| Upgrades purchased | None |
| Power capacity | `100W` (free) |
| Cooling capacity | `150 BTU` (free) |
| Credits per second | `0` (no servers yet) |

**Only available action:** Tap the **PROVISION** button (+1 credit per tap).

### Progressive reveal

The game intentionally hides systems you can't yet engage with — they appear as you progress. You won't see staff, large capacity buildings, or higher server tiers until you've earned them by playing. New cards appearing in their respective screens is part of the discovery loop.

| Item | Reveal trigger |
|---|---|
| Rack Server | Own 5 Raspberry Pis |
| Blade Server | Own 1 Rack Server |
| Data Center | Own 1 Blade Server |
| PDU / AC Unit | Own 1 of the previous tier (Power Strip / Desk Fan) |
| UPS / Liquid Cooling | Own 1 of the previous tier (PDU / AC Unit) |
| Generator / Industrial HVAC | Own 1 of the previous tier (UPS / Liquid Cooling) |
| **STAFF** nav tile | Own 5 servers (first staff role unlockable) |
| Each staff role | Specific event triggers (resolve a DDoS, etc.) — see Staff section |
| Cluster section | Buy the Cluster Software upgrade |

---

## Screens

The game is split across a main dashboard and four drill-down screens, all accessed from the dashboard:

| Screen | Purpose |
|---|---|
| **Main** | Credits, cps, mini Power/Cooling meters, PROVISION, Overclock toggle, nav tiles |
| **Servers** | Buy/sell server tiers (Pi, Rack, Blade) + Clusters |
| **Power** | Buy/sell power capacity buildings + full power meter |
| **Cooling** | Buy/sell cooling capacity buildings + full cooling meter |
| **Staff** | Hire/fire IT roles with passive effects + ongoing salaries |
| **Research** | Spend Research Points on permanent in-run buffs |
| **Cloud** | Lease cloud regions (one of each) — unlocked via Multi-Region Deployment upgrade |
| **GPU** | Build GPU Nodes and AI Clusters — unlocked via CUDA Drivers research |
| **AI Agents** | Hire AI agents with autonomy slider — unlocked by owning 1+ GPU Node |
| **Upgrades** | Tree-view of unlockable upgrades organized by era |

Mini meters on the dashboard always show real-time power/cooling usage so you can spot overload at a glance.

---

## Phase 1 — First Pi (the first 60 seconds)

| Step | Action | Result |
|---|---|---|
| 1 | Tap PROVISION 10× | 10 credits |
| 2 | Buy 1× **Raspberry Pi** (10 cr) | First passive income: `0.5 cr/sec` |
| 3 | Tap to 25 credits | Reach first upgrade threshold |
| 4 | Open **UPGRADES** screen → buy **Mechanical Keyboard** (25 cr) | PROVISION now gives **+2 cr per tap** |
| 5 | Keep tapping + waiting | Pi income compounds |

**At this point:** 1 Pi, ~0.5 cr/sec, +2/tap clicker.

---

## Phase 2 — Stacking Pis (~5 minutes)

The natural early-game loop is to stack Raspberry Pis:

- Each Pi: **8W power**, **12 BTU heat**, **0.5 cr/sec**, costs `10 × 1.15ⁿ` credits
- Cost grows ~15% per buy (10 → 11 → 13 → 15 → 17 → 19 → 22 → 25 → 29 …)

**Key constraint:** starting capacity supports **~12 Pis** before you overload cooling.

```
12 Pis = 96W power   (under 100W cap)  ✓
12 Pis = 144 BTU heat (under 150 BTU cap) ✓
13 Pis = 156 BTU      → OVERLOAD, output drops to (150/156) = 96%
```

**Buy capacity to keep stacking:**
- **Desk Fan** — `$50` for `+75 BTU` cooling → unlocks 6 more Pis
- **Power Strip** — `$50` for `+50W` power → unlocks 6 more Pis
- (Cooling fills first because heat > power per Pi)

**Recommended early upgrades (in order):**
| Upgrade | Cost | Effect |
|---|---|---|
| Mechanical Keyboard | 25 | +1 credit per tap |
| Cron Jobs | 200 | Auto-tap PROVISION every 5s |
| Macro Recorder | 1,000 | +2 more credits per tap (req: Mech Keyboard) |
| Containerization | 500 | Pi output ×1.25 |
| SSD Upgrade | 2,000 | Pi output ×1.5 (req: Containerization → ×1.875 total) |
| Hyperthreading | 5,000 | Tap credits ×1.5 (req: Macro Recorder) |

After all click upgrades stack: each tap = `(1 + 1 + 2) × 1.5 = 6 credits`. Each cron auto-tap also gives 6 credits every 5s = 1.2 cr/sec passive from Cron Jobs alone.

---

## Phase 3 — First Rack Server (~10–20 minutes)

When credits hit ~1k–2k, the next tier opens up:

**Rack Server** — `$250`, `350W power`, `500 BTU heat`, **`5 cr/sec`** (10× a Pi)

But you need capacity to run one:
- **PDU** — `$1,000` for `+500W` (covers 1 Rack)
- **AC Unit** — `$1,000` for `+750 BTU` (covers 1 Rack)

So your first Rack costs effectively `$2,250` (Rack + PDU + AC Unit). Pays back in ~7-8 minutes at 5 cr/sec.

**Free bonus:** the **Rack PDU upgrade** (`$2,000`) gives `+500W` permanently — equivalent to a free PDU.

**Rack-era upgrades:**
| Upgrade | Cost | Effect |
|---|---|---|
| Rack PDU | 2,000 | +500W power capacity |
| Load Balancing | 8,000 | Rack output ×1.25 |
| Redundant PSU | 25,000 | Overclock failure chance −50% (req: Load Balancing) |
| Blade Chassis | 50,000 | Blade output ×1.25 |

---

## Staff

Staff are a separate unit category from servers. Each role has a unique passive effect and an ongoing **salary** that drains credits every second. Net cps shown on the main dashboard is `output − payroll`.

Most roles are **gated behind events** — you have to play through the relevant content before they become hireable.

| Role | Hire cost | Salary | Effect | Unlock |
|---|---|---|---|---|
| 🛠 DevOps Engineer | 5,000 | 0.5/sec | +5% server/cluster output per hire | Own 5 servers |
| 🔒 Security Engineer | 10,000 | 1/sec | DDoS trigger −20% per hire (90% cap) | Resolve a DDoS |
| 🖥 SysAdmin | 8,000 | 0.8/sec | Disk Full incidents stop occurring | Resolve a Disk Full |
| 📈 SRE | 25,000 | 2.5/sec | Overclock failure chance −15% per hire | Buy Hot Swap upgrade |
| 💼 Sales Engineer | 15,000 | 1.5/sec | Vendor Offer rate +25% per hire | Accept a Vendor Offer |
| 🧪 Data Scientist | 50,000 | 5/sec | Generates 0.1 Research Points/sec per hire | Buy Research Lab upgrade |
| 👔 Engineering Manager | 100,000 | 10/sec | All other staff effects ×1.25 per hire | Hire 10 total staff |

**Mechanics:**
- Hire cost scales 1.20× per same-role hire (steeper than servers)
- Salary deducts every tick (1 second). Credits floor at 0 — you won't go negative
- Salary applies during offline progression too (offline net cps = max(0, output − salary) × 0.5)
- Fire any role for 50% refund of last hire price; salary stops immediately
- Hard caps where they make sense (Security can't drop DDoS to 0, just to 10%)
- Engineering Manager **boosts other staff effects multiplicatively** (1.25× per Manager hired)

## Live incidents

Once you own at least one server (or cluster), random incidents fire roughly **1% per second** (~1 every 1–3 minutes on average). Only one is active at a time. Each shows as a banner at the top of the main screen with a countdown timer.

| Incident | Effect while active | Resolve | Reward / Penalty |
|---|---|---|---|
| 🛑 **DDoS Attack** | 0.5× output globally (15s timer) | Tap **MITIGATE** 3 times | Resolve: +30s of cps · Timeout: −120s of cps |
| 💾 **Disk Full** | 0.5× output globally (20s timer) | Tap **CLEAR DISK** once | Resolve: +15s of cps · Timeout: −30s of cps |
| 💰 **Vendor Offer** | No effect (30s timer) | Tap **ACCEPT 50% OFF** | Banks a 50% discount on your next server purchase |
| 🧠 **Memory Leak** | Output decays from 1.0× → 0.5× over 15s, floors at 0.25× (30s timer) | Tap **RESTART SERVICE** | Resolve: +20s of cps · Timeout: −2% of total credits |
| 🚨 **Hacker Breach** | 0.7× output (12s timer) — **minigame** | Tap 4 letter buttons in the displayed order | Resolve: +90s of cps · Timeout: −10% of total credits |

**Hacker Breach minigame:** the banner shows a 4-letter sequence and 4 randomly-positioned letter buttons. Tap the buttons in the sequence order. A wrong tap resets your progress to step 0. Security Engineers reduce hacker breach trigger rate (same protection as for DDoS).

A banked vendor discount appears as `💰 50% OFF NEXT SERVER` under your cps display until you use it.

A small toast confirms the result (resolved or timed out) for ~3.5 seconds after each incident ends.

---

## Phase 4 — Overclocking (the risk/reward beat)

Once you've got a few Racks, the **OVERCLOCK** button becomes interesting:

- Toggle on → `+50% output globally`
- Each tick has a `0.5%` chance to **destroy 1 random unit** of any server you own
- Average failure interval: ~3.3 minutes
- On failure: overclock auto-disables, FailureNotice modal pops

**Redundant PSU upgrade (25k cr)** cuts overclock failure chance in half (0.25% per tick instead of 0.5%). Still risky, but makes overclock a viable long-term strategy. SRE hires stack on top — between both you can push failure chance very low.

---

## Research Points (Phase 5b)

A **second currency** alongside credits, generated passively by **Data Scientist** staff.

To unlock:
1. Reach the Data Center era (own 1 Data Center)
2. Buy the **Research Lab** upgrade in the Data Center upgrade era — 250,000 cr
3. Hire Data Scientists from the Staff screen — they now appear unlocked

Each Data Scientist generates **0.1 RP/sec**, multiplied by your Engineering Manager bonus. The dashboard shows total RP and the per-second rate once you've unlocked anything Research-related.

**Spend RP on the Research Tree.** A new **🔬 RESEARCH** nav tile appears once you've unlocked the Research Lab. Each node is a permanent in-run buff bought with RP.

| Node | Cost | Prereqs | Effect |
|---|---|---|---|
| Distributed Computing | 10 RP | — | Research Points gain ×2 |
| Predictive Scaling | 25 RP | — | All server + cluster output ×1.10 |
| Smart Caching | 75 RP | Distributed Computing | PROVISION tap credits ×2 |
| Liquid Nitrogen Cooling | 200 RP | Predictive Scaling | Cooling capacity ×1.5 |
| Power Optimization | 500 RP | Liquid Nitrogen | Server power draw −20% |
| CUDA Drivers | 1500 RP | Power Optimization + Smart Caching | Reveals GPU tier (Phase 6 preview, no effect yet) |

**Research nodes are lost on prestige** (Phase 6) — they're a per-run progression, distinct from the cross-run **Skill Tree** that prestige unlocks.

**Strategy:** Distributed Computing first (compounds your RP gain) is usually the right opening. From there you choose: tap-build (Smart Caching → Hyperthreading style) or output-build (Predictive Scaling → Liquid Nitrogen → Power Optimization).

(Research Points generate at full rate offline — no efficiency penalty, since they aren't gated by power/cooling.)

## Cloud regions (Phase 5c)

A new infrastructure category alongside servers and clusters. **Cloud regions** are unique entities: max **one** of each. They're significantly more output-dense than even Data Centers, and they share the same build queue as servers (so only one build runs at a time across the whole game).

To unlock: own 1 Data Center → buy the **Multi-Region Deployment** upgrade (1M cr) in the Data Center upgrade era → the **🌐 CLOUD** nav tile appears.

| Region | Lease cost | Output | Ops cost | Net | Build time | Power | Heat |
|---|---|---|---|---|---|---|---|
| Edge Network | 1M cr | 1,500/sec | −300/sec | **+1,200/sec** | 3 min | 8,000W | 12,000 BTU |
| AP-South | 2.5M cr | 3,500/sec | −875/sec | **+2,625/sec** | 5 min | 12,000W | 18,000 BTU |
| EU-West | 5M cr | 7,000/sec | −1,750/sec | **+5,250/sec** | 8 min | 18,000W | 27,000 BTU |
| US-East | 12M cr | 15,000/sec | −4,500/sec | **+10,500/sec** | 12 min | 25,000W | 37,500 BTU |

Owning all four nets **+19,575 cr/sec** after ops costs (gross 27,000 − costs 7,425).

**Service costs** drain credits every second the region is leased — they sit alongside staff salaries on the dashboard breakdown:

```
   25,500 / sec (gross)
 −     12.5 payroll
 −  7,425   cloud ops
 = 18,062.5 net
```

Net cps floors at 0 (you won't go negative). Costs apply offline as well, so leaving a region online while away is the same tradeoff as staff salaries.

Decommission a region for a 50% refund (a one-time setback rather than a regret) — and the ongoing cost stops immediately.

## Build queues

Some structures are too big to spin up instantly. **Data Centers** (and other large facilities coming in later phases) require real-time **build timers** instead of instant purchase.

When you click BUILD on a buildable tier:
- Credits are deducted immediately
- A timer starts counting down on that row
- BUILD buttons on *all* buildable tiers are disabled until the current build completes (one global build slot)
- You can **cancel** at any time for a 50% refund
- The unit is added to your inventory the moment the timer hits zero
- **Build progress continues offline** — close the app, come back, and your build is done

Pi / Rack / Blade are still instant. Build queues only kick in for Data Center tier and up.

## Phase 5 — Blade Servers (~30+ minutes)

**Blade Server** — `$5,000`, `1,200W power`, `1,800 BTU heat`, **`30 cr/sec`** (60× a Pi)

To run them economically:
- **UPS** — `$20,000` for `+5,000W`
- **Liquid Cooling** — `$20,000` for `+7,500 BTU`

Each UPS supports ~4 Blades on power. Each Liquid Cooling unit supports ~4 Blades on heat. So the natural "set" is 4 Blades + 1 UPS + 1 Liquid Cooling for ~`$60K`.

A 4-Blade setup outputs `120 cr/sec` → pays back in ~8 minutes.

---

## Phase 6 — Cluster Software unlock (~1 hour in)

**Cluster Software** — `$10,000` upgrade, **also requires 25 Raspberry Pis owned**.

This is the first real *gate*: you can't just rush past Pis with money — you have to actually keep Pis around. Buying this upgrade unlocks the **Pi Cluster** tier on the Servers screen.

### Clusters

Clusters consume server units of a tier and turn them into a single more efficient unit. Sell refunds credits but **does NOT return the consumed servers** — clustering is a one-way commitment.

#### Pi Cluster
Unlocked by the **Cluster Software** upgrade.

| Stat | Value |
|---|---|
| Build cost | `2,000 cr` + **10 Pis** |
| Output | `0.5 × 10 × 1.5 = 7.5 cr/sec` |
| Power | `80W` (same as 10 Pis) |
| Heat | `120 BTU` (same as 10 Pis) |
| Inherits | Pi upgrades (Containerization + SSD) |

#### Rack Cluster
Unlocked by the **Rack Clustering** upgrade (`30K cr`, requires Load Balancing).

| Stat | Value |
|---|---|
| Build cost | `50,000 cr` + **5 Rack Servers** |
| Output | `5 × 5 × 1.5 = 37.5 cr/sec` |
| Power | `1,750W` (same as 5 Racks) |
| Heat | `2,500 BTU` (same as 5 Racks) |
| Inherits | Rack upgrades (Load Balancing) |

**Strategic tradeoffs:**
- A cluster is `1.5×` the output of the servers it consumed — pure win on output
- Same power/heat as the underlying servers, so cooling/power decisions are unchanged
- Once unlocked, clusters become the most efficient credit-per-power-watt option for that tier

---

## Phase 7 — Endgame (current content cap)

Once you've:
- Bought every Homelab + Rack era upgrade
- Stacked Blades to your heart's content
- Maxed out Industrial HVAC for cooling
- Running overclock with Redundant PSU + SRE hires for reduced failure risk

… you've hit the current end of content. Numbers will keep growing, but no new mechanics unlock.

**Typical endgame numbers (rough):**
- 100+ Pis, 50+ Racks, 20+ Blades
- Several thousand cr/sec
- Total credits in the millions
- Power: 30k+ W (lots of UPS units)
- Cooling: 50k+ BTU (Liquid Cooling stack)

---

## Selling

At any point you can sell back servers and capacity buildings for **50% refund** of the most recent purchase price. Useful for:
- Downscaling when you upgrade to a higher tier
- Reclaiming credits when you over-bought capacity
- Resetting if you want to try a different strategy

Sell button appears as a small underlined link below the row, only when you own ≥ 1.

---

## Offline progression

Close the app and your servers keep earning at **50% efficiency**, capped at **8 hours**. When you reopen, a "Welcome Back" modal shows pending offline earnings. Tapping **Collect** adds them to your balance.

If you close *without* collecting, the pending amount sticks around — reopening shows the same modal. Earnings keep accruing on top while you're away.

---

## GPU Hardware (Phase 6a)

A new hardware category that generates both credits AND Research Points. Unlocked by the **CUDA Drivers** research node (1500 RP, requires Power Optimization + Smart Caching).

| Tier | Cost | Credits/sec | RP/sec | Power | Heat | Build time |
|---|---|---|---|---|---|---|
| GPU Node | 2M cr | 800/sec | 0.5/sec | 15,000W | 22,000 BTU | 3 min |
| AI Cluster | 25M cr | 5,000/sec | 3.0/sec | 60,000W | 90,000 BTU | 10 min |

AI Cluster reveals after owning 3 GPU Nodes. Both share the global build queue. Extremely power-hungry — expect to invest heavily in Generators and Industrial HVAC.

GPU RP output stacks with Data Scientist RP and the Distributed Computing research multiplier.

---

## AI Agents (Phase 6b)

The meta-joke payoff: your AI does the clicking for you. Agents unlock once you own at least 1 GPU Node.

| Agent | Hire cost | Salary | Effect |
|---|---|---|---|
| 🤖 DevOps Agent | 5M cr | 50/sec | Auto-buys servers and capacity to keep infra balanced |
| 📊 Cost Optimizer | 3M cr | 30/sec | Auto-manages overclock based on risk tolerance |
| 🚀 Incident Responder | 8M cr | 80/sec | Auto-resolves incidents for a reduced reward |

### Autonomy slider (1–10)

A global slider that affects all agents. Higher autonomy = more aggressive behavior, more risk.

- **DevOps Agent:** Buy interval scales from 30s (autonomy 1) to 3s (autonomy 10). Checks efficiency before buying — if efficiency drops below threshold (90% at low autonomy, 50% at high), buys power or cooling capacity instead of servers. Picks the bottleneck (power vs cooling) and buys the best affordable building for it.
- **Cost Optimizer:** At low autonomy, only enables overclock with Redundant PSU + SRE protection. At high autonomy, leaves overclock on aggressively.
- **Incident Responder:** Response delay scales from 8s (autonomy 1) to 1s (autonomy 10). Reward scales from 75% (autonomy 1) to 30% (autonomy 10) of normal — faster resolution costs you more of the bonus.

Agent salaries drain every second alongside staff payroll and cloud ops costs.

---

## Currently NOT implemented (coming in later phases)

The full design is in [DESIGN.md](./DESIGN.md). Highlights of what's still to come:

### Phase 4 — Live Systems ✅ COMPLETE
- ~~Incidents (DDoS, Disk Full, Vendor Offer, Memory Leak, Hacker Breach)~~ ✅ shipped
- ~~Cluster tier~~ ✅ shipped (Pi Cluster, Rack Cluster)
- ~~Staff system (DevOps, Security, SysAdmin, SRE, Sales, Manager)~~ ✅ shipped
- **Data Scientist** role and **Auto-provisioner upgrades** deferred to after Phase 5

### Phase 5 — Data Center & Cloud ✅ COMPLETE
- ~~Data Center tier with real-time build timers~~ ✅ shipped (Phase 5a)
- ~~Research Points + Data Scientist staff role~~ ✅ shipped (Phase 5b)
- ~~Multi-region cloud~~ ✅ shipped (Phase 5c)
- ~~Service cost layer~~ ✅ shipped (Phase 5d)

### Phase 6 — AI Endgame & Prestige
- ~~GPU hardware tier~~ ✅ shipped (Phase 6a)
- ~~AI Agents with autonomy slider~~ ✅ shipped (Phase 6b)
- **Acqui-hire prestige** — sell your infra to BigCorp, reset run, earn **Skill Points**
- **Skill Tree** — 4 branches (Hardware / Operations / Security / AI) with permanent buffs across resets, gated by prestige count
- **AGI Achieved** terminal node (req: 10 prestiges) — passive endgame

### Phase 7 — Polish & Ship
- UI animations, sound design, AdMob, App Store submission

---

## Quick reference: full unit table

### Servers
| Tier | Cost (base) | Output | Power | Heat | Build time |
|---|---|---|---|---|---|
| Raspberry Pi | 10 cr | 0.5 cr/sec | 8W | 12 BTU | instant |
| Rack Server | 250 cr | 5 cr/sec | 350W | 500 BTU | instant |
| Blade Server | 5,000 cr | 30 cr/sec | 1,200W | 1,800 BTU | instant |
| Data Center | 500,000 cr | 500 cr/sec | 5,000W | 7,000 BTU | **5 minutes** |

(All have 1.15× cost scaling per purchase. Data Center reveals after owning 1 Blade.)

### Clusters
| Type | Build cost | Consumes | Output | Power | Heat | Unlock |
|---|---|---|---|---|---|---|
| Pi Cluster | 2,000 cr | 10× Pi | 7.5 cr/sec | 80W | 120 BTU | Cluster Software |
| Rack Cluster | 50,000 cr | 5× Rack | 37.5 cr/sec | 1,750W | 2,500 BTU | Rack Clustering |

(Inherit source-tier upgrade multipliers. 1.15× cost scaling.)

### Power buildings
| Building | Cost | Provides |
|---|---|---|
| Power Strip | 50 cr | +50W |
| PDU | 1,000 cr | +500W |
| UPS | 20,000 cr | +5,000W |
| Generator | 500,000 cr | +50,000W |

### Cooling buildings
| Building | Cost | Provides |
|---|---|---|
| Desk Fan | 50 cr | +75 BTU |
| AC Unit | 1,000 cr | +750 BTU |
| Liquid Cooling | 20,000 cr | +7,500 BTU |
| Industrial HVAC | 500,000 cr | +75,000 BTU |

### Upgrades (Homelab era)
| Upgrade | Cost | Prereqs | Effect |
|---|---|---|---|
| Mechanical Keyboard | 25 | — | +1 credit per tap |
| Cron Jobs | 200 | — | Auto-tap every 5s |
| Containerization | 500 | — | Pi output ×1.25 |
| Macro Recorder | 1,000 | Mech Keyboard | +2 more credits per tap |
| SSD Upgrade | 2,000 | Containerization | Pi output ×1.5 |
| Hyperthreading | 5,000 | Macro Recorder | Tap credits ×1.5 |
| Cluster Software | 10,000 | Own 25 Pi | Unlocks Cluster tier (not yet built) |

### Upgrades (Rack era)
| Upgrade | Cost | Prereqs | Effect |
|---|---|---|---|
| Rack PDU | 2,000 | — | +500W power capacity |
| Load Balancing | 8,000 | — | Rack output ×1.25 |
| Redundant PSU | 25,000 | Load Balancing | Overclock failure chance −50% |
| Rack Clustering | 30,000 | Load Balancing | Unlock Rack Cluster tier |
| Blade Chassis | 50,000 | — | Blade output ×1.25 |

### Upgrades (Data Center era)
| Upgrade | Cost | Prereqs | Effect |
|---|---|---|---|
| Research Lab | 250,000 | Own 1 Data Center | Unlock Data Scientist + Research Points |
| Multi-Region Deployment | 1,000,000 | Own 1 Data Center | Unlock the Cloud screen + region leases |

---

## Phase 6c — Prestige (Acqui-hire)

Once the player reaches **1M peak credits** in a run, the **ACQUI-HIRE** nav tile appears on the dashboard.

### How it works

BigCorp offers to buy out your infrastructure. You reset **everything** in your current run (credits, servers, clusters, GPUs, capacity, upgrades, research, regions, staff, agents) in exchange for **Skill Points (SP)** that persist permanently across resets.

### SP formula

`SP = floor(log10(peakCredits) - 6)`

| Peak credits | SP earned |
|---|---|
| 10M (10^7) | 1 SP |
| 100M (10^8) | 2 SP |
| 1B (10^9) | 3 SP |
| 10B (10^10) | 4 SP |
| 100B (10^11) | 5 SP |
| 1T (10^12) | 6 SP |

**Minimum threshold**: 10M peak credits to prestige at all.

### What resets

- Credits, research points
- All servers, clusters, GPUs, capacity buildings
- All upgrades, research nodes
- All cloud regions, staff, agents
- Autonomy slider resets to 5
- Incident counters, vendor discount

### What persists

- **Skill Points** (cumulative across all prestiges)
- **Prestige Count** (how many times you've sold)
- **Skill Tree** purchases (permanent once bought)

### Prestige Screen

The prestige screen shows:
- Current prestige count and total SP
- This run's current and peak credits
- SP earned from this run
- SP threshold table with checkmarks for reached thresholds
- "SELL TO BIGCORP" button (disabled until 10M peak credits)
- Progress percentage toward prestige threshold when not yet eligible

---

## Phase 6d — Skill Tree

After your first prestige, the **SKILL TREE** nav tile appears on the dashboard. Spend Skill Points (SP) on permanent upgrades across 4 branches. Skills persist across all future prestiges.

### Branches (32 nodes total, 8 per branch)

**Hardware** (green) — server costs, build times, output, starting capacity
- Bootstrapper → Bulk Discount → Quick Deploy → Datacenter Express
- Bootstrapper → Power Surplus → Cool Start → Mega Capacity
- Bulk Discount → Overbuilt (2+ prestiges)

**Operations** (blue) — economy, research, tap credits, offline earnings
- Venture Capital → Penny Pincher → Cloud Discount / Headhunter (2+ prestiges)
- Venture Capital → Click Training / Angel Investor (2+ prestiges)
- Fast Learner → Offline Mogul (3+ prestiges)

**Security** (red) — incident defense, penalties, overclock safety
- Firewall → Incident Pay → Bug Bounty (3+ prestiges)
- Firewall → Hardened Servers (2+) → Iron Defense (3+ prestiges)
- Backup Systems → Rapid Response → Threat Intel (2+ prestiges)

**AI** (purple) — GPU output, agent costs/speed, automation
- GPU Overclock → Neural Boost / Quantum Leap (2+) → Singularity (3+ prestiges)
- Agent Discount → Loyal Agents → Smart Agents (2+) → Hivemind (3+ prestiges)

### Unlock gating

- Each skill has a minimum prestige count requirement (1, 2, or 3)
- Skills require their prerequisite skills to be purchased first
- Deeper/more powerful nodes require more prestiges, encouraging multiple cycles

### Skill effects summary

| Category | Skills | Effects |
|---|---|---|
| Starting bonuses | Bootstrapper, Power Surplus, Cool Start, Mega Capacity, Venture Capital, Angel Investor | Start runs with servers, capacity, and credits |
| Cost reductions | Bulk Discount, Penny Pincher, Headhunter, Cloud Discount, Agent Discount | 10–25% off various purchases |
| Output multipliers | Overbuilt, GPU Overclock, Quantum Leap, Singularity | +15% to ×2 on server/GPU output |
| Build speed | Quick Deploy, Datacenter Express | Up to −50% build queue time |
| Research | Fast Learner, Neural Boost | +25–30% RP generation |
| Defense | Firewall, Backup Systems, Rapid Response, Threat Intel, Hardened Servers, Iron Defense | Fewer taps, less penalty, longer timers, fewer incidents, safer overclock |
| Incident rewards | Incident Pay, Bug Bounty | +25% rewards, ×2 hacker breach |
| Agent efficiency | Loyal Agents, Smart Agents, Hivemind | −25% salary, better responder rewards, 50% faster agents |
| Offline | Offline Mogul | 75% offline efficiency (up from 50%) |

---

*This doc tracks what's playable today. Update it when phases ship — keep [DESIGN.md](./DESIGN.md) for the long-term spec and this for the live state.*
