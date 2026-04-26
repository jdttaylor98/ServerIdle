# ServerIdle — Gameplay Flow

End-to-end walkthrough of the current player experience. Everything below Phase 3 is *implemented and live*. Phase 4+ is in [DESIGN.md](./DESIGN.md) but **not yet built**.

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

---

## Screens

The game is split across a main dashboard and four drill-down screens, all accessed from the dashboard:

| Screen | Purpose |
|---|---|
| **Main** | Credits, cps, mini Power/Cooling meters, PROVISION, Overclock toggle, nav tiles |
| **Servers** | Buy/sell server tiers (Pi, Rack, Blade) |
| **Power** | Buy/sell power capacity buildings + full power meter |
| **Cooling** | Buy/sell cooling capacity buildings + full cooling meter |
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
| Hot Swap | 25,000 | Overclock failures lose 0 units (req: Load Balancing) |
| Blade Chassis | 50,000 | Blade output ×1.25 |

---

## Phase 4 — Overclocking (the risk/reward beat)

Once you've got a few Racks, the **OVERCLOCK** button becomes interesting:

- Toggle on → `+50% output globally`
- Each tick has a `0.5%` chance to **destroy 1 random unit** of any server you own
- Average failure interval: ~3.3 minutes
- On failure: overclock auto-disables, FailureNotice modal pops

**Hot Swap upgrade (25k cr)** flips this entirely — failures stop destroying units. Overclock becomes free output. This is the first major "broken-feeling" moment — exactly the idle game payoff curve.

---

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

### Pi Cluster

A new buildable unit that **consumes** 10 Raspberry Pis to form one Cluster:

| Stat | Value |
|---|---|
| Build cost | `2,000 cr` + **10 Pis** |
| Cost scaling | 1.15× per buy |
| Output | `0.5 × 10 × 1.5 = 7.5 cr/sec` (50% multiplier vs. 10 raw Pis) |
| Power | `80W` (same as 10 Pis) |
| Heat | `120 BTU` (same as 10 Pis) |
| Inherits Pi upgrades | Yes — Containerization + SSD Upgrade also boost cluster output |

**Strategic tradeoffs:**
- You commit your Pi inventory (selling clusters refunds credits but **does NOT** return the Pis)
- A cluster is `1.5×` the output of the Pis it consumed — pure win on output
- Same power/heat as the underlying Pis, so cooling/power decisions are unchanged
- The cluster tier becomes more efficient than building more Pis once you have the upgrade

---

## Phase 7 — Endgame (current content cap)

Once you've:
- Bought every Homelab + Rack era upgrade
- Stacked Blades to your heart's content
- Maxed out Industrial HVAC for cooling
- Toggled overclock with Hot Swap on (free +50%)

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

## Currently NOT implemented (coming in later phases)

The full design is in [DESIGN.md](./DESIGN.md). Highlights of what's still to come:

### Phase 4 — Live Systems
- **Incidents:** random tap-to-resolve events (DDoS, disk full, memory leak, hacker breach minigame)
- ~~Cluster tier~~ ✅ shipped (Pi Cluster)
- **Rack Cluster** (consume 5 Racks for a multiplier — coming with later upgrades)
- **Auto-provisioner** automation upgrades

### Phase 5 — Data Center & Cloud
- **Data Center** tier with real-time build timers (1-10 minute waits, idle-friendly)
- **Multi-region cloud** with separate income streams + latency tradeoffs
- **Cost layer:** ongoing service costs, net income display
- **Compute units** + **Research Points** as new resources

### Phase 6 — AI Endgame & Prestige
- **GPU hardware** tier (power-hungry, generates Research Points)
- **AI Agents** with autonomy slider (the meta-joke payoff: agents auto-click for you)
- **Acqui-hire prestige** — sell your infra to BigCorp, reset run, earn **Skill Points**
- **Skill Tree** — 4 branches (Hardware / Operations / Security / AI) with permanent buffs across resets, gated by prestige count
- **AGI Achieved** terminal node (req: 10 prestiges) — passive endgame

### Phase 7 — Polish & Ship
- UI animations, sound design, AdMob, App Store submission

---

## Quick reference: full unit table

### Servers
| Tier | Cost (base) | Output | Power | Heat |
|---|---|---|---|---|
| Raspberry Pi | 10 cr | 0.5 cr/sec | 8W | 12 BTU |
| Rack Server | 250 cr | 5 cr/sec | 350W | 500 BTU |
| Blade Server | 5,000 cr | 30 cr/sec | 1,200W | 1,800 BTU |

(All have 1.15× cost scaling per purchase)

### Clusters
| Type | Build cost | Consumes | Output | Power | Heat |
|---|---|---|---|---|---|
| Pi Cluster | 2,000 cr | 10× Pi | 7.5 cr/sec | 80W | 120 BTU |

(Unlocks via Cluster Software upgrade. Inherits source-tier upgrade multipliers. 1.15× cost scaling.)

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
| Hot Swap | 25,000 | Load Balancing | Overclock failures lose 0 units |
| Blade Chassis | 50,000 | — | Blade output ×1.25 |

---

*This doc tracks what's playable today. Update it when phases ship — keep [DESIGN.md](./DESIGN.md) for the long-term spec and this for the live state.*
