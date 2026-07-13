# EASLearn — Global Symbol Inventory

**Generated:** 2026-05-25
**Phase 1 of Master Symbol Verification & Correction Directive**

---

## REACT COMPONENT SYMBOLS (3 Libraries)

### GROUP A: Hardwired Schematic Symbols (NMTBA EGP-1)
**File:** `client/src/components/symbols/NMTBA_EGP1_SymbolLibrary.tsx`
**Standard:** NMTBA EGP-1 / JIC

| # | Component Name | Export Name | Pixel-Traced | Used In |
|---|---------------|-------------|:---:|---------|
| 1 | Relay Coil | RelayCoilSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |
| 2 | Relay Contact NO | RelayContactNOSymbol | No (V5 JIC) | FlashCards, ComponentID, DrawSymbol |
| 3 | Relay Contact NC | RelayContactNCSymbol | No (V5 JIC) | FlashCards, ComponentID, DrawSymbol |
| 4 | Limit Switch NO | LimitSwitchNOSymbol | YES | FlashCards, ComponentID |
| 5 | Limit Switch NC | LimitSwitchNCSymbol | YES | — |
| 6 | Pressure Switch NO | PressureSwitchNOSymbol | YES | FlashCards, ComponentID |
| 7 | Pressure Switch NC | PressureSwitchNCSymbol | YES | — |
| 8 | Temperature Switch NO | TemperatureSwitchNOSymbol | YES | FlashCards, ComponentID |
| 9 | Temperature Switch NC | TemperatureSwitchNCSymbol | YES | — |
| 10 | Flow Switch NO | FlowSwitchNOSymbol | YES | — |
| 11 | Flow Switch NC | FlowSwitchNCSymbol | YES | — |
| 12 | Level Switch NO | LevelSwitchNOSymbol | YES | — |
| 13 | Level Switch NC | LevelSwitchNCSymbol | YES | — |
| 14 | Foot Switch NO | FootSwitchNOSymbol | No (JIC manual) | — |
| 15 | Foot Switch NC | FootSwitchNCSymbol | No (JIC manual) | — |
| 16 | Pushbutton NO | PushbuttonNOSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |
| 17 | Pushbutton NC | PushbuttonNCSymbol | No (manual) | FlashCards, ComponentID |
| 18 | Timer TDAE NO | TimerTDAE_NOSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |
| 19 | Timer TDAE NC | TimerTDAE_NCSymbol | No (manual) | — |
| 20 | Timer TDDE NO | TimerTDDE_NOSymbol | No (manual) | FlashCards, ComponentID |
| 21 | Timer TDDE NC | TimerTDDE_NCSymbol | No (manual) | — |
| 22 | Disconnect Switch | DisconnectSwitchSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |
| 23 | Selector Switch 2-Pos | SelectorSwitch2PosSymbol | No (manual) | ComponentID |
| 24 | Toggle Switch | ToggleSwitchSymbol | No (manual) | — |
| 25 | Overload | OverloadSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |
| 26 | Fuse | FuseSymbol | No (manual) | FlashCards, ComponentID |
| 27 | Transformer | TransformerSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |
| 28 | Ground | GroundSymbol | No (manual) | FlashCards |
| 29 | Motor | MotorSymbol | No (manual) | FlashCards, ComponentID, DrawSymbol |

### GROUP B: PLC Symbols (Allen-Bradley / Rockwell)
**File:** `client/src/components/symbols/ElectricalSymbols.tsx`
**Standard:** Allen-Bradley / Rockwell Studio 5000

| # | Component Name | Export Name | Used In |
|---|---------------|-------------|---------|
| 1 | PLC Input (XIC) | PLCInputSymbol | FlashCards |
| 2 | PLC Output (OTE) | PLCOutputSymbol | FlashCards |

### GROUP C: Semiconductor Symbols (ANSI/IEEE)
**File:** `client/src/components/symbols/ANSI_IEEE_SemiconductorSymbols.tsx`
**Standard:** IEEE 315 / ANSI Y32.2

| # | Component Name | Export Name | Used In |
|---|---------------|-------------|---------|
| 1 | Diode (Rectifier) | DiodeSymbol | FlashCards, ComponentID, DrawSymbol |
| 2 | Zener Diode | ZenerDiodeSymbol | FlashCards, ComponentID |
| 3 | Schottky Diode | SchottkyDiodeSymbol | FlashCards, ComponentID |
| 4 | LED | LEDSymbol | FlashCards, ComponentID, DrawSymbol |
| 5 | Photodiode | PhotodiodeSymbol | FlashCards |
| 6 | TVS Bidirectional | TVSBidirectionalSymbol | — |
| 7 | Fast Recovery Diode | FastRecoveryDiodeSymbol | — |
| 8 | Bridge Rectifier | BridgeRectifierSymbol | — |
| 9 | Flyback Diode | FlybackDiodeSymbol | — |
| 10 | NPN Transistor | NPNTransistorSymbol | FlashCards, ComponentID, DrawSymbol, SemiRef |
| 11 | PNP Transistor | PNPTransistorSymbol | FlashCards, ComponentID, SemiRef |
| 12 | N-MOSFET | NMOSFETSymbol | FlashCards, ComponentID, DrawSymbol, SemiRef |
| 13 | P-MOSFET | PMOSFETSymbol | ComponentID, SemiRef |
| 14 | IGBT | IGBTSymbol | SemiRef |
| 15 | SCR | SCRSymbol | FlashCards, ComponentID, DrawSymbol |
| 16 | TRIAC | TRIACSymbol | FlashCards, ComponentID |

### GROUP A (Extended): Proximity Sensors
**File:** `client/src/components/symbols/ElectricalSymbols.tsx`
**Standard:** NMTBA-adjacent (hardwired schematic context)

| # | Component Name | Export Name | Used In |
|---|---------------|-------------|---------|
| 1 | Inductive Prox | InductiveProxSymbol | ComponentID |
| 2 | Capacitive Prox | CapacitiveProxSymbol | ComponentID |
| 3 | Selector Switch 3-Pos | SelectorSwitch3PosSymbol | ComponentID |

---

## DATABASE INLINE SVGs (14 Lessons)

| Lesson ID | Title | SVG Count | Symbol Types |
|-----------|-------|:---------:|-------------|
| 20 | Relay Logic Fundamentals | 8 | Relay coil, NO/NC contacts, pushbuttons, overload, motor |
| 60010 | PLC Ladder Logic Fundamentals | 6 | XIC, XIO, OTE, TON, CTU (PLC vertical bars) |
| 60013 | Semiconductor Devices in Industrial Controls | 4 | SCR, diode variants |
| 60016 | Relay Logic to PLC Migration | 4 | Relay coil, contacts, motor |
| 60017 | Troubleshooting Relay Logic Circuits | 8 | Relay coil, contacts, pushbuttons, overload |
| 90010 | Reading Electrical Schematics | 3 | Limit switch, pressure switch, temperature switch |
| 90011 | Panel Layout Drawings | 6 | Motor, contacts, pushbuttons |
| 120016 | Cross-Referencing Contacts and Coils | 4 | Relay coil, contacts, motor |
| 120017 | VFD and Motor Starter One-Line | 4 | Motor, disconnect, fuse, overload |
| 120020 | Reading Safety Circuit Schematics | 6 | Limit switches, E-stop, safety relay |
| 150003 | Reading Prints Under Pressure | 10 | Limit switches, relay coil, contacts, motor |

---

## USAGE CONTEXT MATRIX

### Interactive Components Using Symbols

| Component | File | Symbols Used | Context |
|-----------|------|:---:|---------|
| SymbolFlashCards | interactive/SymbolFlashCards.tsx | 27 | Study cards — all groups |
| ComponentIDChallenge | interactive/ComponentIDChallenge.tsx | 28 | ID quiz — all groups |
| DrawSymbolExercise | interactive/DrawSymbolExercise.tsx | 14 | Drawing practice — mixed |
| SemiconductorReference | pages/SemiconductorReference.tsx | 5 | Reference page — Group C |

---

## TOTAL SYMBOL COUNT

| Category | Count |
|----------|:-----:|
| GROUP A (NMTBA/JIC) React | 29 |
| GROUP B (PLC) React | 2 |
| GROUP C (Semiconductor) React | 16 |
| GROUP A Extended (Prox) React | 3 |
| Database Inline SVGs | ~63 |
| **TOTAL UNIQUE SYMBOLS** | **~50** |

---

## AUDIT STATUS (from previous passes)

| Symbol | Standard | Status | Notes |
|--------|----------|:------:|-------|
| Limit Switch NO/NC | NMTBA EGP-1 | ✅ PASS | Pixel-traced |
| Pressure Switch NO/NC | NMTBA EGP-1 | ✅ PASS | Pixel-traced |
| Temperature Switch NO/NC | NMTBA EGP-1 | ✅ PASS | Pixel-traced |
| Flow Switch NO/NC | NMTBA EGP-1 | ✅ PASS | Pixel-traced |
| Level Switch NO/NC | NMTBA EGP-1 | ✅ PASS | Pixel-traced |
| Relay Contact NO/NC | JIC | ✅ PASS | V5 approved geometry |
| Foot Switch NO/NC | JIC | ⚠️ NEEDS VERIFY | Manual JIC geometry |
| SCR | IEEE 315 | ✅ PASS | Gate fixed to cathode junction |
| All other semiconductors | IEEE 315 | ✅ PASS | Verified at 60/120/200px |
| PLC XIC/XIO/OTE | Allen-Bradley | ✅ PASS | Correct vertical bar notation |
| PLC TON/CTU | Allen-Bradley | ✅ PASS | Correct block notation |
