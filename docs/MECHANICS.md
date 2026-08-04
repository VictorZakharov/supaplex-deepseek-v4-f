# Supaplex Clone — Mechanics & Engine Spec

This document is the source of truth for how the game behaves. Every rule here is
enforced by a unit test in `tests/unit/engine.test.ts` (or the integration suite in
`tests/integration/playthrough.test.ts`). Where a behavior is marked **verify**, it
is an approximation of the original game that can be corrected in one place
(`src/core/constants.ts` or `src/core/tiles/tiles.ts`).

## Model

- The world is a grid of cells. Static tiles live in a `Uint8Array`; dynamic
  entities (Murphy, Zonks, Snik Snaks, explosions) occupy cells via a per-cell
  entity slot.
- One entity per cell for movers. Collectibles (Infotrons, Electrons) are tiles and
  are "collected" when a mover enters their cell.
- The engine is deterministic: same level + same input sequence → identical state.
  No randomness anywhere in `src/core`.
- A fixed timestep drives everything: `TICK_MS = 50`.

## Entities

### Murphy (player)
- Moves one cell per `MURPHY_STEP_TICKS` (2) while a direction is held; the most
  recently pressed direction wins.
- Dies on contact with a Zonk, Snik Snak, or an explosion cell.
- Collects an Infotron on entry (score +100), an Electron on entry (carried).
- Deposits a carried Electron when walking onto a Terminal (+250).
- Teleports through Portals, preserving travel direction.
- Can walk through one-way walls only from the open side.

### Zonk (bouncing ball)
- Falls straight down when the cell below is free (not solid, no blocking entity).
- On the ground, travels horizontally and reverses direction when blocked.
- After a fall ends, resumes horizontal travel.
- Killed by an explosion. Kills Murphy on contact.

### Snik Snak
- Greedy 8-direction pursuit of Murphy, avoiding walls and other movers.
- Kills Murphy on contact. Killed by an explosion.

### Explosions
- `EXPLOSION_GENERATOR` tiles pulse on a fixed interval
  (`GENERATOR_PULSE_TICKS = 6`).
- Each pulse advances the blast front one cell in each of 4 directions
  (`EXPLOSION_STEP_TICKS = 2`).
- Burning cells destroy destructible tiles and kill Zonks/Snik Snaks (and Murphy).
- Blasts stop at solid, non-destructible tiles (walls, generators, base, terminals,
  one-way walls).

### Base / win condition
- The Base only opens once every Infotron in the level has been collected.
- Walking onto an open Base completes the level (+1000).
- Completing the last level ends the game.

## Level format

Text maps, one character per cell. Lines starting with `//` are comments; blank
lines are ignored. All rows must have equal length.

| Char | Meaning |
|---|---|
| `.` | Empty |
| `#` | Wall (solid, not destructible) |
| `~` | Destructible wall (destroyed by explosion) |
| `M` | Murphy spawn |
| `I` | Infotron |
| `Z` | Zonk |
| `S` | Snik Snak |
| `B` | Base (exit) |
| `T` | Terminal |
| `E` | Electron |
| `X` | Explosion generator |
| `O` | Portal (must come in pairs) |
| `^` `v` `<` `>` | One-way wall facing that direction |

## Scoring

| Action | Points |
|---|---|
| Infotron collected | 100 |
| Electron deposited | 250 |
| Level complete | 1000 |
| Extra life | every 10,000 points |

## Timing constants

| Constant | Value | Meaning |
|---|---|---|
| `TICK_MS` | 50 | Fixed timestep |
| `MURPHY_STEP_TICKS` | 2 | Murphy steps every 2nd tick |
| `ZONK_STEP_TICKS` | 2 | Zonk steps every 2nd tick |
| `SNIK_SNAK_STEP_TICKS` | 2 | Snik Snak steps every 2nd tick |
| `GENERATOR_PULSE_TICKS` | 6 | Generator emits every 6th tick |
| `EXPLOSION_STEP_TICKS` | 2 | Blast advances every 2nd tick |
| `START_LIVES` | 3 | Starting lives |

## Verify-against-original items

- Whether explosions pass through portals (currently blocked).
- Exact Zonk bounce cadence vs. the original.
- One-way wall interaction with Zonks falling through them.

These are isolated in `src/core/tiles/tiles.ts` and `src/core/constants.ts` so a
single change fixes the behavior everywhere.
