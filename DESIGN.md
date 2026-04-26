# ServerIdle — Design Document

The source of truth for what we're building. Update this when design decisions change.

---

## Vision

A deeper idle game about building IT infrastructure, from a single Raspberry Pi to a globe-spanning AI cluster. The progression mirrors real-world tech evolution: bare metal → virtualization → cloud → AI agents. The meta-joke: at endgame, your AI agents are the ones idle-clicking for you.

Players who work in tech get the references. Players who don't accidentally learn something.

**Tone:** Technical flavor without being insanely technical. Office Space humor in the tooltips. Terminal aesthetic.

**Platform:** iOS first (App Store), then Google Play. React Native + Expo.

**Style:** Deeper idle with offline progression. Not a casual clicker.

---

## Core design principle

**Constraints create decisions.** The shallow version of this game is "buy more servers, get more credits." The deep version is "you have a finite power, cooling, and security budget — how do you allocate it?" Every system in the game should reinforce that you're making real tradeoffs, not just hitting buy.

---

## Resource model

| Resource | Role | Source | Visible in HUD when |
|---|---|---|---|
| **Credits** | Primary currency | Servers generate, you spend | Always |
| **Power** (watts) | Capacity constraint | Build PDUs, UPS, generators | Phase 3+ |
| **Cooling** (BTU) | Capacity constraint | Build AC, liquid cooling | Phase 3+ |
| **Compute units** | Output unit (servers produce, converts to credits) | Servers generate | Phase 5+ |
| **Research Points** | Unlocks late-game tech | GPUs and clusters generate | Phase 5+ |
| **Skill Points** | Prestige currency | Earned at acqui-hire | Phase 6+ |

**Rule:** Don't show resources in the HUD until they exist in the player's run. Avoids overwhelming new players.

---

## Progression ladder

| Tier | Era | Unlocks |
|---|---|---|
| **Raspberry Pi** | Homelab | Start |
| **Rack Server** | Rack | ~1k credits |
| **Blade Server** | Rack | ~25k credits |
| **Cluster** | Cluster | After 1st upgrade tree node + 25 Pi or 10 Rack |
| **Data Center** | Data Center | Major milestone, brings power/cooling constraints front and center |
| **Cloud Region** | Cloud | After 1st prestige (acqui-hire) |
| **GPU Node** | AI | Mid-cloud era, expensive, power-hungry |
| **AI Cluster** | AI | Endgame, GPU-required, enables agents |

Six visible tiers, but only 2-3 visible at a time. Progression *reveals itself* as you unlock — keeps the early game simple.

**Cost scaling:** 1.15x per purchase within a tier. Standard idle curve.

---

## Systems

### Tap-to-earn (PROVISION button)
The primary active interaction. +1 credit per tap. Stays useful even late game because of skill tree multipliers and click-based events.

### Server tiers
Passive income generators. Each tier consumes power, generates heat, produces compute (which converts to credits).

### Overclock
Toggle. +50% global output, but each tick has a 0.5% chance of destroying one random owned unit. Creates risk/reward decisions. Balanced by Hot Swap upgrade (reduces failure damage to 0) and Redundancy upgrades.

### Power & cooling (Phase 3)
- Each piece of hardware has consumption stats (watts in, BTU out).
- Player must build power capacity (PDUs, UPS, generators) and cooling capacity (AC units, liquid cooling).
- Exceed budget → output efficiency drops; severe excess → hardware failures.
- This is the central tension of the mid-game.

### Uptime % (Phase 3)
Global multiplier (0–100%). Decays slowly when player ignores game. Restored by tapping or resolving incidents. Encourages regular check-ins without punishing long absences (the WelcomeBack flow handles offline cleanly).

### Incident system (Phase 4)
Random tap-to-resolve events with bonus rewards:
- **DDoS** — credits drain unless you tap to mitigate (3 quick taps).
- **Disk full** — output halves until cleared.
- **Memory leak** — uptime drops 1%/sec until restarted.
- **Hacker breach** — minigame: tap "patch" buttons in correct order. Miss = lose credits + uptime.
- **Vendor offer** — limited-time discount on next server purchase.

Frequency tuned by Security skill tree branch.

### Auto-provisioner (Phase 4)
First real automation. Auto-taps PROVISION at a fixed interval. Unlocked via Cron Jobs upgrade. Speeds up via Operations skill tree.

### Staff (Phase 4.5)

A separate unit category from servers and clusters. Each role has a unique passive effect — not just another cps source. Hire on its own **Staff** screen.

**Roles (initial set):**
| Role | Hire cost | Salary (cr/sec) | Effect | Gate |
|---|---|---|---|---|
| 🛠 DevOps Engineer | 5,000 | 0.5 | +5% global server output (stacks per hire) | Own 5 servers |
| 🔒 Security Engineer | 10,000 | 1 | DDoS trigger rate −20% per hire (cap 90%) | Resolve first DDoS |
| 🖥 SysAdmin | 8,000 | 0.8 | Auto-resolves Disk Full incidents | Resolve first Disk Full |
| 📈 SRE | 25,000 | 2.5 | Overclock failure chance −15% per hire | Hot Swap upgrade owned |
| 💼 Sales Engineer | 15,000 | 1.5 | Vendor Offer trigger rate +25% per hire | Accept first Vendor Offer |
| 🧪 Data Scientist | 50,000 | 5 | Generates Research Points | "Research Lab" upgrade (Phase 5+) |
| 👔 Engineering Manager | 100,000 | 10 | All staff effects ×1.25 per hire | Hire 10 staff total |

**Mechanics:**
- Hire cost scales 1.20× per hire (steeper than servers because effects stack)
- **Salary is a per-tick credit drain.** Net cps = output − total salary. Display both.
- Staff continue costing salary while offline (counts against offline earnings)
- Fire any role for 50% refund of last hire price; salary stops
- Soft caps where they make sense (Security can't drop incident rate to 0)
- Some roles **gate behind events** to reward exploration (resolve a DDoS to unlock the Security Engineer)

**Ties to existing systems:**
- Maps real IT org structure to gameplay
- Sets up the "AI agents replace staff" payoff in Phase 6

### Build queues (Phase 5)
Big projects (Data Center, Cloud Region, GPU Cluster) take real time to build (1-10 minutes). Idle-friendly — set it and walk away. Skip with credits. **Do not** add wait times to small server purchases — that breaks the satisfying click loop.

### Cloud era (Phase 5)
- Multi-region: each region is a separate income stream with its own power/cooling/security budget.
- Cost layer: cloud services have ongoing costs. Net income = revenue - costs.
- Unlocks: Compute, Storage, CDN, Serverless as service types within a region.
- Latency tradeoffs: closer regions earn more but cost more.

### GPUs (Phase 6)
Separate hardware type. Required to unlock AI agents. Generates research points alongside credits. Power-hungry.

### AI Agents (Phase 6)
Endgame automation. Agents do the idle clicking for you (the meta-joke payoff). Types:
- **DevOps Agent** — auto-buys servers when affordable.
- **Cost Optimizer** — auto-toggles overclock based on risk model.
- **Incident Responder** — auto-resolves incidents (with smaller bonus).

Agent autonomy slider: high autonomy = high output + risk of runaway costs.

### Prestige (acqui-hire) (Phase 6)
Sell your infrastructure to BigCorp. Reset run. Earn skill points based on run depth:
- `floor(log10(highest credit count) - 6)` skill points (e.g., 1B credits = 3 SP).
- Punishes early-prestige farming, rewards depth.
- Skills are permanent and apply to next run.

---

## Upgrade Tree (per-run)

Lost on prestige. Earned with credits + research points. Organized by era; each era unlocks when you reach that hardware tier. ~30 nodes total.

### Homelab Era *(Pi tier)*
- **Cron Jobs** — auto-tap PROVISION every 5s · 50 cr
- **Containerization** — Pi output ×1.25 · 200 cr
- **SSD Upgrade** — Pi output ×1.5 (req: Containerization) · 1k cr
- **Cluster Software** — unlock Cluster tier (req: 25 Pi) · 5k cr

### Rack Era
- **Rack PDU** — power capacity +500W · 2k cr
- **Load Balancing** — Rack output smoothed, no failure-penalty drops · 8k cr
- **Hot Swap** — overclock failures lose 0 units instead of 1 (req: Load Balancing) · 25k cr
- **Blade Chassis** — unlock Blade tier · 50k cr

### Data Center Era
- **Liquid Cooling** — cooling capacity ×2 · 500k cr
- **Hyperconverged Infra** — all server tiers ×1.3 (req: Liquid Cooling) · 2M cr
- **Multi-Tenant** — unlock cloud regions · 10M cr

### Cloud Era
- **Edge CDN** — +20% credits per cloud region · 50M cr
- **Auto-Scaling** — cloud servers self-buy when affordable · 200M cr
- **Spot Instances** — cloud tier costs −30% · 1B cr

### AI Era *(GPU tier)*
- **Inference Engine** — GPUs produce 2× research points · 5B cr
- **Agent Framework** — unlock AI agents · 50B cr
- **RLHF Loop** — agents +1% output per hour active · 500B cr

**Rule:** within an era, ~half the nodes are gated by prerequisites. Visualizing as a real tree (not a flat list) is the point — players choose their path.

---

## Skill Tree (meta / prestige)

Permanent across resets. Earned with skill points. Four branches, gated by prestige count. ~40 nodes total.

### 🔧 Hardware Branch
- **Bulk Buying** — server costs −10% (5 ranks, stacks multiplicatively)
- **Refurbished Parts** — start each run with 5 free Pi
- **Aftermarket Heatsinks** — cooling consumed −15%
- **Industrial Liquid Cooling** *(req: 3 prestiges)* — cooling capacity ×3 from start
- **Quantum Substrate** *(req: 7 prestiges)* — all output ×2

### ⚙️ Operations Branch
- **Always-On Ops** — uptime decays 50% slower
- **Faster Provisioning** — build timers −25% (5 ranks)
- **Auto-Provisioner** — start runs with Cron Jobs already unlocked
- **24/7 Helpdesk** *(req: 2 prestiges)* — incidents auto-resolve with smaller bonus
- **Six Sigma** *(req: 5 prestiges)* — uptime never drops below 80%

### 🔒 Security Branch
- **Patch Management** — hacker events 30% less frequent
- **WAF** — DDoS events deal 50% less damage
- **Honeypot** — failed hack attempts give bonus credits
- **Zero Trust** *(req: 4 prestiges)* — all incidents 50% less severe
- **Air-Gapped Backup** *(req: 6 prestiges)* — keep 10% of credits through prestige

### 🤖 AI Branch
- **Pretrained Models** — start runs with 1 free agent slot
- **Faster Training** — research point gain ×1.5
- **Agent Specialization** — choose 1 of 3 permanent agent buffs
- **Multi-Agent Orchestration** *(req: 4 prestiges)* — agents work in parallel without slowdown
- **AGI Achieved** *(req: 10 prestiges, terminal)* — endgame unlock, agents passively generate skill points

**Why 4 branches:** spreading thin progresses nothing. Forces commitment, so run #2 feels different from run #5.

**Why prestige-count gates:** without them, run #2 unlocks everything and there's nothing to chase. Gating creates a ~10-prestige arc.

**Endgame:** AGI Achieved converts the game into a passive mode — checked once a day for years. The long tail.

---

## Phase roadmap (revised)

### Phase 0 — Environment & scaffold ✅ DONE
Expo project, simulator + Expo Go working.

### Phase 1 — Core engine ✅ DONE
Zustand store, tick loop, save/load, offline earnings, WelcomeBack modal.

### Phase 2 — Playable loop ✅ DONE
3 server tiers, shop, overclock toggle, FailureNotice modal.

### Phase 3 — Constraints & Tech Tree
- Power and cooling resources
- Hardware consumption stats displayed per tier
- Build power/cooling capacity buildings
- Upgrade tree (Homelab + Rack era nodes)
- Uptime % global multiplier

### Phase 4 — Live Systems
- Incident system: DDoS, disk full, memory leak, hacker minigame
- Auto-provisioner unlock
- Cluster tier (combine N servers for multiplier)

### Phase 5 — Data Center & Cloud
- Data Center tier with build queue / timers
- Multi-region cloud
- Cost layer: ongoing service costs, net income display
- Compute units + Research Points introduced

### Phase 6 — AI Endgame & Prestige
- GPU hardware tier
- AI agents with autonomy slider
- Acqui-hire prestige system
- Skill Tree (all 4 branches)
- AGI Achieved terminal node

### Phase 7 — Polish & Ship
- UI/animation pass
- Sound design
- AdMob integration
- Privacy policy
- App Store assets and submission

---

## Anti-patterns to avoid

- **Wait times on small server purchases** — kills the satisfying click loop. Reserve timers for major projects (Phase 5+).
- **Too many currencies at once** — phase them in. Power/cooling Phase 3, compute/research Phase 5, skill points Phase 6.
- **Flat upgrade lists** — must visualize as real trees with prerequisites. Players need to *choose* a path.
- **Punishing prestige** — first prestige should give ~3-5 SP and feel like a meaningful upgrade, not a setback.
- **Hidden mechanics** — every system needs a tooltip or first-time-use explainer. Especially constraints.

---

## Easter eggs / lore

Random flavor tooltips and event names to make the world feel real:
- "Greg from Accounting needs his printer fixed"
- "An intern just kicked out a power cable"
- "VP requested an Excel file be 'made into an AI'"
- Hacker names: ShadowByte, Wireshark, NotPetya
- Server hostnames: prod-db-01, kubernetes-master, please-dont-delete

Costs nothing to add, makes the game feel lived-in.

---

*This doc is the source of truth. Update it when design changes — don't just code around it.*
