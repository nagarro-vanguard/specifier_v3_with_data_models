# Feature fit - "Check and allocate visitor parking for a visitor vehicle for a period"

> Sample output for a fictional product called Acme. The citations are illustrative; they point at a sample Acme glossary, not a real one.

- Date: 2026-10-05
- Glossary: unset (Residential or Commercial)
- Family: `access-visitors-and-security`

> Convention:
> - glossary terms and values are in pills
> - file names are in italics
> - kinds are tagged in [square brackets]

---

## How this was read - the four layers

| Layer | What it unravels | How it helps |
|---|---|---|
| Layer 1 - Family | which part of the product this belongs to | narrows the search to one family, so you do not read the whole glossary |
| Layer 2 - Term and kind | the agreed word, and whether it is an object, role, step or state | gives the exact word to match, and points to the right document |
| Layer 3 - Structure and movement | how the term connects, and the step-by-step flow with its gates | shows whether the feature can reuse existing rails, and where it plugs in |
| Layer 4 - Proof and close calls | the exact quotes, the LOB differences, the reuse-vs-missing call | lets you cite every claim and settle the tricky calls honestly |

---

## Files this view drew on

### Layer 1 - Family

| File | What it gave |
|---|---|
| *residential/map.md* | the families overview; the all-families search for "Visitor Parking" |

### Layer 2 - Term and kind

| File | What it gave |
|---|---|
| *residential/objects.md* | `visitor`<br>`parking-lot`<br>`vehicle-record`<br>`request-category` (holds the "Visitor Parking Permit" value) |
| *residential/roles.md* | `visitor` as a persona (D-4), the Role half of the split |
| *residential/states.md* | `slot-state` `released`, the release analogue |
| *residential/decisions.md* | D-4 (`visitor` canonical) |

### Layer 3 - Structure and movement

| File | What it gave |
|---|---|
| *residential/steps.md* | `visitor-entry` / `visitor-exit`<br>the absent parking-allocation step |

### Layer 4 - Proof and close calls

| File | What it gave |
|---|---|
| *residential/section-deep-dives/access-visitors-and-security-glossary.md* | parking is unit-scoped<br>the roles (gatekeeper-admin, resident, security-guard) |
| *commercial/section-deep-dives/access-visitors-and-security-glossary.md* | `visitor pass validity`<br>`invite duration`<br>check-in / check-out<br>host approval |
| *_reconciliation/assembled-glossary.md* | Commercial parking is Park+ Phase 2 |

---

## Verdict - New capability

We can reuse the nouns (`visitor`, parking space, vehicle) and an existing approval path, but the product does not model allocating a parking space to a visitor for a period. That part is a build, not a config.

**At a glance**

- Reuse: 8 elements (see table)
- Net-new: 5 elements (the capability itself)
- Decisions that block: 2 (reading, LOB)

**Reuse - already in the glossary**

| Concept | Kind | Residential | Commercial |
|---|---|---|---|
| visitor (entrant) | Object | `visitor` | `visitor` / `guest` |
| visitor (persona) | Role | `visitor` | `visitor` / `guest` |
| parking space | Object | `parking-lot` | `parking-slot` (Phase 2) |
| vehicle | Object | `vehicle-record` | `vehicle-registration` |
| permit category | Object | `request-category` | - |
| approval | Step | `member-request-flow` (ALH) | host approval |
| entry logging | Step | `visitor-entry` | `check-in` |
| exit logging | Step | `visitor-exit` | `check-out` |

**Net-new - the build**

| Net-new element | Kind | Why it is new |
|---|---|---|
| visitor-scoped parking | Object | parking hangs off `unit`, never off `visitor`; needs a new `visitor` -> parking link |
| availability check | Step | Residential has none; Commercial availability is Park+ Phase 2 (future) |
| allocate or assign a space | Step | no reserve-a-space step or gate exists anywhere |
| allocation period | State | periods exist only on visitor passes, never on parking |
| release at period end | Step | an analogue exists (`slot` `released`) but it is a different object |

**Decisions that block**

- Reading: a permit request, or a live check-and-allocate
- LOB: Residential, or Commercial

---

## Diagram 1 - Movement (how the feature would flow)

**Colours**

- Green: already in the glossary (reuse)
- Red: not in the glossary (new)
- Blue: a decision you must make

```mermaid
flowchart TD
    s(["Trigger: visitor arrives with a vehicle"]):::reuse
    v["Object/Role: visitor (identified)"]:::reuse
    veh["Object: visitor vehicle"]:::gap
    d{"Decision: which reading?"}:::decide
    a1["Step: raise permit request -> ALH approval"]:::reuse
    a2["Outcome: permit granted or rejected"]:::reuse
    b1["Step: check parking availability"]:::gap
    b2["Step: allocate a space to the vehicle"]:::gap
    b3["State: allocation period"]:::gap
    e1["Step: visitor-entry (log entry)"]:::reuse
    rec[("Object: entry-exit-record")]:::reuse
    e2["Step: visitor-exit (log exit)"]:::reuse
    rel["Step: release space at period end"]:::gap

    s --> v --> veh --> d
    d -->|"A - mostly exists"| a1 --> a2
    d -->|"B - new build"| b1 --> b2 --> b3
    a2 -.->|"visitor later arrives"| e1
    b3 --> e1
    e1 --> rec --> e2 --> rel

    classDef reuse fill:#EAF3DE,stroke:#3B6D11,color:#173404;
    classDef gap fill:#F7C1C1,stroke:#A32D2D,color:#501313;
    classDef decide fill:#B5D4F4,stroke:#185FA5,color:#042C53;
```

**Read it:** the only continuous green rail is identify visitor, then permit approval, then log entry and exit. Everything that makes this feature what it is (check, allocate, period, release) is red.

---

## Diagram 2 - Model (what the analysis found in the term graph)

```mermaid
flowchart TD
    unit["Object: unit"]:::reuse -->|contains| plot["Object: parking-lot<br/>resident / unit-scoped"]:::reuse
    plot -->|contains| vrec["Object: vehicle-record<br/>resident vehicle"]:::reuse
    visitor["Object/Role: visitor"]:::reuse
    visitor -.->|"NO LINK IN MODEL"| vpark["Object: visitor parking<br/>not modelled"]:::gap
    rc["Object: request-category"]:::reuse -->|value| vpp["Value: 'Visitor Parking Permit'"]:::reuse
    visitor -->|produces| ver["Object: visitor-entry-request"]:::reuse -->|produces| eer["Object: entry-exit-record"]:::reuse

    classDef reuse fill:#EAF3DE,stroke:#3B6D11,color:#173404;
    classDef gap fill:#F7C1C1,stroke:#A32D2D,color:#501313;
```

**Read it:** parking hangs off `unit` (a resident), never off `visitor`. "Visitor Parking" exists only as a permit value, not as an allocatable space. The dashed edge is the gap.

**Values referenced**

- `visitor-request-status` [State] values (Res):
  - `waiting`
  - `approved`
  - `rejected`
- `visitor pass validity` [State] values (Com), the nearest time-bound analogue, on passes not parking:
  - `single-use`
  - `time-bound`
  - `expired`
- `invite duration` [State] values (Com):
  - `single-day`
  - `multi-day`

---

## Who acts (roles)

| Step | Who | Kind | Source |
|---|---|---|---|
| Manage vehicles and parking | `gatekeeper-admin` / `security-supervisor` | Role | residential access deep-dive |
| Approve the visitor or permit | `resident` (Res), `host employee` (Com) | Role | residential access deep-dive, commercial access deep-dive |
| Log entry and exit | `security-guard` (via the guard app) | Role | residential access deep-dive |

No new role is needed; the actors already exist. Only the capability is missing.

---

## Steps followed (the operation trace)

**Decomposed tokens**

- `visitor` (root)
- visitor parking
- visitor vehicle
- check
- allocate
- for a period of time

**Token: visitor**

| Input | What you did | Processing | Output |
|---|---|---|---|
| visitor | pick the Glossary | not stated; parking differs sharply by LOB | unset -> carry both (open question) |
| visitor | find the Family | scan families | `access-visitors-and-security` |
| visitor | Kind -> Object or Role; match rung 1 (exact) | search *objects.md*, *roles.md*, *decisions.md* | exact term `visitor`, both Object and Role (D-4) -> REUSE |

**Token: visitor parking**

| Input | What you did | Processing | Output |
|---|---|---|---|
| visitor parking | Kind -> Object | search *objects.md* for a parking term | `parking-lot` (Res, unit-scoped), `parking-slot` (Com) |
| visitor parking | check the "visitor" qualifier | search topology for a visitor-to-parking link | Res parking is unit-scoped; no link from `visitor` to parking |
| visitor parking | match - rung 2 (synonym) | search *decisions.md* for "visitor parking" | not a term or synonym |
| visitor parking | search all families | search for "Visitor Parking" | only a Value of `request-category`, the "Visitor Parking Permit" |
| result | - | - | GAP: parking exists; visitor-scoped parking does not |

**Token: visitor vehicle**

| Input | What you did | Processing | Output |
|---|---|---|---|
| visitor vehicle | Kind -> Object | search *objects.md* for a vehicle term | `vehicle-record` (Res, unit-bound), `vehicle-registration` (Com) |
| visitor vehicle | check the "visitor" qualifier | is it tied to a visitor? | resident or unit-bound; no visitor vehicle |
| result | - | - | GAP |

**Token: check**

| Input | What you did | Processing | Output |
|---|---|---|---|
| check | Kind -> Step or State | search for a parking-availability concept | Com only: real-time parking availability (Park+ Phase 2); Res none |
| result | - | - | Partial (Com, Phase 2), GAP (Res) |

**Token: allocate**

| Input | What you did | Processing | Output |
|---|---|---|---|
| allocate | Kind -> Step | search *steps.md* access family for allocate, assign, or reserve parking | no parking allocation step; only "create lots" and "save vehicle record" |
| result | - | - | GAP |

**Token: for a period of time**

| Input | What you did | Processing | Output |
|---|---|---|---|
| for a period of time | Kind -> State or value | search *states.md* for a parking duration | none for parking |
| for a period of time | find the nearest time-bound | search access states | `visitor pass validity`, `invite duration`, on passes not parking |
| result | - | - | GAP for parking; a pass-validity analogue exists but is a different object |

---

## Evidence and traceability (appendix)

| Claim | Element | Kind | Source |
|---|---|---|---|
| visitor is a defined term, both persona and object | `visitor` (D-4) | Object, Role, Decision | roles.md, objects.md, decisions.md |
| parking is unit-scoped | `parking-lot` "for a unit" | Object | objects.md |
| a unit can hold many lots | `unit` contains `parking-lot` | Relationship | residential access deep-dive |
| vehicle is resident's | `vehicle-record` "against a lot and unit" | Object | objects.md |
| "Visitor Parking Permit" is a permit value | Value of `request-category` | Value | objects.md |
| request to approval path exists | `member-request-flow` -> ALH -> output or rejection | Step | steps.md |
| visitor entry and exit logging exists | `visitor-entry` / `visitor-exit` -> `entry-exit-record` | Step | steps.md |
| no parking allocation step | absent from access steps | Step | steps.md |
| period only on passes | `visitor pass validity`, `invite duration` | State | commercial access deep-dive |
| Commercial parking is Phase 2 | scope note | - | reconciliation (assembled-glossary) |
| release analogue (different object) | `slot-state` includes `released` | State | states.md |
