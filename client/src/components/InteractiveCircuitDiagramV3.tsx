/**
 * InteractiveCircuitDiagramV3 — Premium Industrial Diagnostic Map
 * 
 * Visual redesign: softer glow effects, cleaner component cards with rounded corners,
 * glassmorphism detail popovers, improved legend, better wire labels.
 * ALL LOGIC & ANIMATION SYSTEMS UNCHANGED.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Zap, AlertTriangle, Thermometer, Move, Lock } from "lucide-react";
import type { CircuitDiagram, SystemState, AnimationTrigger, TechRole } from "@/data/scenariosV3";
import {
  DiagramNOContact,
  DiagramNCContact,
  DiagramCoil,
  DiagramMotor,
  DiagramFuse,
  DiagramTerminal,
  DiagramBreaker,
  DiagramDisconnect,
  DiagramTransformer,
  DiagramOverloadHeater,
  DiagramEStop,
  DiagramPLCInput,
  DiagramPLCOutput,
  DiagramVFD,
} from "@/lib/electricalDiagramPrimitives";

interface Props {
  diagram: CircuitDiagram;
  role: TechRole;
  systemState: SystemState | null;
  activeAnimations: AnimationTrigger[];
  /** When true, disable pan/zoom so parent can scroll (mobile landscape) */
  disablePanZoom?: boolean;
  /** When true, hide all zoom/lock floating controls (mobile) */
  hideMobileControls?: boolean;
}

interface ComponentInfo {
  id: string;
  label: string;
  type: string;
  state: string;
  description: string;
  tapInfo: { function: string; currentState: string; normalState: string; explanation?: string } | null;
  x: number;
  y: number;
}

// === ANIMATION SUB-COMPONENTS (unchanged logic, refined visuals) ===

function CurrentFlowParticles({ x1, y1, x2, y2, intensity = 0.5 }: { x1: number; y1: number; x2: number; y2: number; intensity?: number }) {
  const particleCount = Math.ceil(3 * intensity);
  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.circle
          key={i}
          r={1.5 + intensity}
          fill={`oklch(0.82 0.13 155 / ${0.5 + intensity * 0.3})`}
          filter="url(#glow-soft)"
          animate={{
            cx: [x1, x2],
            cy: [y1, y2],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 1.2 - intensity * 0.4,
            delay: i * (0.4 / particleCount),
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
}

function SparkEffect({ cx, cy, intensity = 0.7 }: { cx: number; cy: number; intensity?: number }) {
  const sparkCount = 6 + Math.floor(intensity * 4);
  return (
    <g>
      {Array.from({ length: sparkCount }).map((_, i) => {
        const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.5;
        const length = 8 + intensity * 12 + Math.random() * 8;
        return (
          <motion.line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * length}
            y2={cy + Math.sin(angle) * length}
            stroke={i % 2 === 0 ? "#fbbf24" : "#f97316"}
            strokeWidth={1 + Math.random()}
            strokeLinecap="round"
            animate={{
              opacity: [0, 1, 0.8, 0],
              x2: [cx, cx + Math.cos(angle) * length],
              y2: [cy, cy + Math.sin(angle) * length],
            }}
            transition={{
              duration: 0.15 + Math.random() * 0.2,
              delay: i * 0.05,
              repeat: Infinity,
              repeatDelay: 1.5 + Math.random() * 2,
            }}
          />
        );
      })}
      <motion.circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#fbbf24"
        filter="url(#glow-soft)"
        animate={{ r: [2, 5, 2], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
      />
    </g>
  );
}

function SmokeEffect({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.circle
          key={i}
          cx={cx + (Math.random() - 0.5) * 10}
          r={2 + Math.random() * 3}
          fill="oklch(0.5 0 0 / 0.25)"
          animate={{
            cy: [cy - 5, cy - 40 - Math.random() * 20],
            opacity: [0, 0.35, 0],
            r: [2, 5 + Math.random() * 3, 8],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: i * 0.4,
            repeat: Infinity,
          }}
        />
      ))}
    </g>
  );
}

function ThermalOverlay({ cx, cy, width, height }: { cx: number; cy: number; width: number; height: number }) {
  return (
    <motion.rect
      x={cx - width / 2}
      y={cy - height / 2}
      width={width}
      height={height}
      rx={8}
      fill="url(#thermal-gradient)"
      animate={{ opacity: [0.15, 0.4, 0.15] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

function MotorSpinAnimation({ cx, cy, speed = 1 }: { cx: number; cy: number; speed?: number }) {
  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 2 / speed, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos((i * Math.PI * 2) / 3) * 10}
          y2={cy + Math.sin((i * Math.PI * 2) / 3) * 10}
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
    </motion.g>
  );
}

function WireHeatEffect({ x1, y1, x2, y2, intensity = 0.5 }: { x1: number; y1: number; x2: number; y2: number; intensity?: number }) {
  const color = intensity > 0.7 ? "#ef4444" : "#f97316";
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={3 + intensity * 2}
      strokeLinecap="round"
      filter="url(#glow-soft)"
      animate={{ opacity: [0.25, 0.6, 0.25] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
  );
}

// === MAIN COMPONENT ===

export default function InteractiveCircuitDiagramV3({ diagram, role, systemState, activeAnimations, disablePanZoom = false, hideMobileControls = false }: Props) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [highlightedWireRung, setHighlightedWireRung] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

   // Track active pointers for pinch-to-zoom
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  // Double-tap-to-zoom tracking
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const doubleTapTimeout = 300; // ms window for double-tap detection

  // Internal pan/zoom override: when disablePanZoom is true (mobile landscape),
  // user can toggle it on via a button
  const [panZoomOverride, setPanZoomOverride] = useState(false);
  const effectiveDisablePanZoom = disablePanZoom && !panZoomOverride;

  // Reset override when disablePanZoom prop changes (e.g., orientation change)
  useEffect(() => {
    if (!disablePanZoom) setPanZoomOverride(false);
  }, [disablePanZoom]);

  // Prevent native touch scrolling/bouncing on the container (only when pan/zoom is active)
  // FIX (Bug #1): Only prevent touchmove (not touchstart) so iOS Safari recognizes
  // the gesture properly. Blocking touchstart caused the "sluggish" feeling because
  // iOS couldn't initiate its touch tracking pipeline.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || effectiveDisablePanZoom) return;
    const preventScroll = (e: TouchEvent) => {
      // Only prevent if we're actually panning/pinching (not a quick tap)
      if (e.touches.length >= 1) {
        e.preventDefault();
      }
    };
    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      el.removeEventListener("touchmove", preventScroll);
    };
  }, [effectiveDisablePanZoom]);

  // Momentum/inertia state for smooth panning on mobile
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const lastMovePos = useRef({ x: 0, y: 0 });
  const momentumFrameRef = useRef<number>(0);

  // Pan & pinch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (effectiveDisablePanZoom) return; // Let parent handle scrolling
    // Don't call e.preventDefault() on pointerdown — iOS Safari needs the event
    // to flow through for proper touch recognition. We prevent scrolling via
    // the touchmove handler instead.
    e.stopPropagation();
    // Cancel any ongoing momentum animation
    if (momentumFrameRef.current) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = 0;
    }
    const el = containerRef.current;
    if (el) el.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastMoveTimeRef.current = Date.now();
    lastMovePos.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };

    if (pointersRef.current.size === 1) {
      // Double-tap detection
      const now = Date.now();
      const last = lastTapRef.current;
      if (last && (now - last.time) < doubleTapTimeout && Math.abs(e.clientX - last.x) < 30 && Math.abs(e.clientY - last.y) < 30) {
        // Double tap detected — toggle between 2x zoom at tap point and reset
        if (scale > 1.1) {
          // Already zoomed — reset to 1x
          setScale(1);
          setPanOffset({ x: 0, y: 0 });
        } else {
          // Zoom to 2x centered on tap position
          const rect = el!.getBoundingClientRect();
          const tapX = e.clientX - rect.left;
          const tapY = e.clientY - rect.top;
          const newScale = 2;
          // Pan so the tapped point stays in the same visual position
          const offsetX = -(tapX * (newScale - 1));
          const offsetY = -(tapY * (newScale - 1));
          setScale(newScale);
          setPanOffset({ x: offsetX, y: offsetY });
        }
        lastTapRef.current = null;
        setIsPanning(false);
        return;
      }
      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

      // Single finger — start pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    } else if (pointersRef.current.size === 2) {
      // Two fingers — start pinch
      setIsPanning(false);
      const pts = Array.from(pointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (effectiveDisablePanZoom) return;
    e.preventDefault();
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      // Pinch-to-zoom
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (lastPinchDistRef.current !== null) {
        const delta = (dist - lastPinchDistRef.current) * 0.005;
        setScale(s => Math.min(Math.max(s + delta, 0.4), 3));
      }
      lastPinchDistRef.current = dist;
    } else if (isPanning && pointersRef.current.size === 1) {
      // Single finger pan — track velocity for momentum
      const now = Date.now();
      const dt = now - lastMoveTimeRef.current;
      if (dt > 0) {
        velocityRef.current = {
          x: (e.clientX - lastMovePos.current.x) / dt * 16, // normalize to ~60fps
          y: (e.clientY - lastMovePos.current.y) / dt * 16,
        };
      }
      lastMoveTimeRef.current = now;
      lastMovePos.current = { x: e.clientX, y: e.clientY };
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    const el = containerRef.current;
    if (el) {
      try { el.releasePointerCapture(e.pointerId); } catch {}
    }
    if (pointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      // Apply momentum/inertia for smooth feel on mobile
      const vel = velocityRef.current;
      if (Math.abs(vel.x) > 0.5 || Math.abs(vel.y) > 0.5) {
        const applyMomentum = () => {
          velocityRef.current.x *= 0.92; // friction
          velocityRef.current.y *= 0.92;
          if (Math.abs(velocityRef.current.x) < 0.3 && Math.abs(velocityRef.current.y) < 0.3) {
            momentumFrameRef.current = 0;
            return;
          }
          setPanOffset(prev => ({
            x: prev.x + velocityRef.current.x,
            y: prev.y + velocityRef.current.y,
          }));
          momentumFrameRef.current = requestAnimationFrame(applyMomentum);
        };
        momentumFrameRef.current = requestAnimationFrame(applyMomentum);
      }
      setIsPanning(false);
    } else if (pointersRef.current.size === 1) {
      // Transition from pinch back to pan
      const remaining = Array.from(pointersRef.current.values())[0];
      setIsPanning(true);
      setPanStart({ x: remaining.x - panOffset.x, y: remaining.y - panOffset.y });
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (effectiveDisablePanZoom) return; // Let parent handle scrolling
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(Math.max(s + delta, 0.4), 3));
  };

  // Wire tracing: click a rung label to highlight it
  const handleRungTrace = (rungId: string) => {
    setHighlightedWireRung(prev => prev === rungId ? null : rungId);
  };

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setTime(t => t + 1);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const getAnimationForComponent = (compId: string) => {
    return activeAnimations.filter(a => a.targetId === compId);
  };

  const hasAnimationType = (compId: string, type: string) => {
    return activeAnimations.some(a => a.targetId === compId && a.type === type);
  };

  const hasFault = (componentId: string) => {
    if (!systemState) return false;
    const compState = systemState.componentStates?.[componentId];
    return compState?.state === "faulted" || compState?.state === "tripped" || compState?.state === "open" || compState?.state === "overheating";
  };

  const getComponentState = (compId: string): { state: string; color: string; energized: boolean; appearance?: any } => {
    if (!systemState) return { state: "Unknown", color: "#6b7280", energized: false };
    const compState = systemState.componentStates?.[compId];
    if (compState) {
      const isFaulted = compState.state === "faulted" || compState.state === "tripped" || compState.state === "open" || compState.state === "overheating";
      const isEnergized = compState.state === "energized" || compState.state === "running" || compState.state === "closed";
      const color = compState.appearance?.color === "green" ? "#22c55e"
        : compState.appearance?.color === "red" ? "#ef4444"
        : compState.appearance?.color === "amber" ? "#f59e0b"
        : compState.appearance?.color === "orange" ? "#f97316"
        : isFaulted ? "#ef4444"
        : isEnergized ? "#22c55e"
        : "#6b7280";
      return { state: compState.state.toUpperCase(), color, energized: isEnergized, appearance: compState.appearance };
    }
    return { state: "Normal", color: "#22c55e", energized: true };
  };

  const handleComponentClick = (comp: any, cx: number, cy: number) => {
    setSelectedComponent({
      id: comp.id,
      label: comp.label,
      type: comp.type,
      state: getComponentState(comp.id).state,
      description: comp.tapInfo?.function || `${comp.type} component`,
      tapInfo: comp.tapInfo || null,
      x: cx,
      y: cy,
    });
  };

  // === RENDER RUNG ===
  const renderRung = (rung: typeof diagram.rungs[0], rungIdx: number) => {
    const yOffset = rungIdx * 120 + 70;
    const rungWidth = 680;
    const componentSpacing = rungWidth / (rung.components.length + 1);

    return (
      <g key={rung.id}>
        {/* Rung label — clickable for wire tracing */}
        <text
          x={15}
          y={yOffset + 4}
          className="diag-text-xs cursor-pointer"
          fill={highlightedWireRung === rung.id ? "#22c55e" : "#4b5563"}
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={(e) => { e.stopPropagation(); handleRungTrace(rung.id); }}
        >
          {rung.label}
        </text>

        {/* Rung highlight overlay when tracing */}
        {highlightedWireRung === rung.id && (
          <motion.rect
            x={40}
            y={yOffset - 30}
            width={720}
            height={60}
            rx={8}
            fill="#22c55e"
            opacity={0.04}
            stroke="#22c55e"
            strokeWidth={0.5}
            strokeDasharray="4,4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 }}
          />
        )}

        {/* Rung horizontal bus — subtle */}
        <line x1={50} y1={yOffset} x2={750} y2={yOffset} stroke="#1f2937" strokeWidth={0.3} strokeDasharray="2,4" />

        {/* Components */}
        {rung.components.map((comp, compIdx) => {
          const cx = componentSpacing * (compIdx + 1) + 50;
          const cy = yOffset;
          const compState = getComponentState(comp.id);
          const isFaulted = hasFault(comp.id);
          const compAnims = getAnimationForComponent(comp.id);
          const isVibrating = hasAnimationType(comp.id, "motor_vibrate");
          const isHeating = hasAnimationType(comp.id, "wire_heat");
          const isSmoking = hasAnimationType(comp.id, "smoke");
          const hasThermal = hasAnimationType(comp.id, "thermal_gradient");
          const isSpinning = hasAnimationType(comp.id, "motor_spin");
          const hasCurrentFlow = hasAnimationType(comp.id, "current_flow");
          const hasSpark = hasAnimationType(comp.id, "spark");
          const hasLedBlink = hasAnimationType(comp.id, "led_blink");
          const appearance = compState.appearance;

          const prevX = compIdx > 0 ? componentSpacing * compIdx + 50 + 40 : 50;
          const nextX = cx - 40;

          return (
            <g key={comp.id}>
              {/* Connection wire */}
              <line
                x1={prevX}
                y1={cy}
                x2={nextX}
                y2={cy}
                stroke={compState.energized ? "#22c55e" : "#374151"}
                strokeWidth={compState.energized ? 2 : 1}
                opacity={compState.energized ? 0.7 : 0.4}
              />
              
              {/* Energized wire glow */}
              {compState.energized && (
                <line
                  x1={prevX}
                  y1={cy}
                  x2={nextX}
                  y2={cy}
                  stroke="#22c55e"
                  strokeWidth={6}
                  opacity={0.08}
                  filter="url(#glow-soft)"
                />
              )}

              {/* Current flow particles on wire */}
              {compState.energized && (
                <CurrentFlowParticles x1={prevX} y1={cy} x2={nextX} y2={cy} intensity={0.4} />
              )}

              {/* Wire heat effect */}
              {isHeating && (
                <WireHeatEffect x1={prevX} y1={cy} x2={nextX} y2={cy} intensity={compAnims.find(a => a.type === "wire_heat")?.intensity || 0.5} />
              )}

              {/* Last component to right rail */}
              {compIdx === rung.components.length - 1 && (
                <>
                  <line
                    x1={cx + 40}
                    y1={cy}
                    x2={750}
                    y2={cy}
                    stroke={compState.energized ? "#22c55e" : "#374151"}
                    strokeWidth={compState.energized ? 2 : 1}
                    opacity={compState.energized ? 0.7 : 0.4}
                  />
                  {compState.energized && (
                    <>
                      <line x1={cx + 40} y1={cy} x2={750} y2={cy} stroke="#22c55e" strokeWidth={6} opacity={0.08} filter="url(#glow-soft)" />
                      <CurrentFlowParticles x1={cx + 40} y1={cy} x2={750} y2={cy} intensity={0.3} />
                    </>
                  )}
                </>
              )}

              {/* Thermal overlay */}
              {hasThermal && (
                <ThermalOverlay cx={cx} cy={cy} width={80} height={50} />
              )}

              {/* Smoke effect */}
              {isSmoking && (
                <SmokeEffect cx={cx} cy={cy} />
              )}

              {/* Component body */}
              <motion.g
                onClick={() => handleComponentClick(comp, cx, cy)}
                className="cursor-pointer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                animate={isVibrating ? {
                  x: [0, -2, 2, -1, 1, 0],
                  y: [0, 1, -1, 1, -1, 0],
                } : {}}
                transition={isVibrating ? {
                  duration: 0.15,
                  repeat: Infinity,
                } : {}}
              >
                {/* Component background — rounded, softer */}
                <motion.rect
                  x={cx - 38}
                  y={cy - 24}
                  width={76}
                  height={48}
                  rx={8}
                  fill={isFaulted ? "oklch(0.14 0.03 25)" : compState.energized ? "oklch(0.13 0.02 155)" : "oklch(0.10 0.003 250)"}
                  stroke={compState.color}
                  strokeWidth={isFaulted ? 2 : compState.energized ? 1.2 : 0.8}
                  strokeDasharray={isFaulted && !isVibrating ? "4,2" : "none"}
                  animate={appearance?.pulse ? { opacity: [0.7, 1, 0.7] } : appearance?.glow ? { filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />

                {/* Soft fault glow behind component */}
                {isFaulted && (
                  <motion.rect
                    x={cx - 42}
                    y={cy - 28}
                    width={84}
                    height={56}
                    rx={12}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={1}
                    filter="url(#glow-fault)"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}

                {/* Component-specific symbols */}
                {(comp.type === "estop" || comp.type === "switch") && (
                  <DiagramEStop cx={cx} cy={cy} color={compState.color} scale={0.85} energized={compState.energized} />
                )}

                {comp.type === "relay" && (
                  <g>
                    {/* Relay/safety-relay coil = verified NEMA / JIC coil primitive + label */}
                    <DiagramCoil cx={cx} cy={cy} color={compState.color} scale={0.85} />
                    <text x={cx} y={cy + 4} textAnchor="middle" className="diag-text-xs font-bold" fill={compState.color}>K1</text>
                    {compState.energized && (
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={11}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={1.5}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </g>
                )}

                {comp.type === "motor" && (
                  <g>
                    <DiagramMotor cx={cx} cy={cy} color={compState.color} scale={0.9} />
                    {isSpinning && <MotorSpinAnimation cx={cx} cy={cy} speed={1} />}
                  </g>
                )}

                {comp.type === "vfd" && (
                  <g>
                    <DiagramVFD
                      cx={cx}
                      cy={cy}
                      color={compState.color}
                      scale={0.85}
                      energized={compState.energized}
                      statusLabel={compState.energized ? "45Hz" : "FAULT"}
                    />
                    {hasLedBlink && (
                      <motion.circle
                        cx={cx + 12}
                        cy={cy - 8}
                        r={2.5}
                        fill={compAnims.find(a => a.type === "led_blink")?.color || "red"}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </g>
                )}

                {comp.type === "overload" && (
                  <DiagramOverloadHeater cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "power_supply" && (
                  <g>
                    <rect x={cx - 14} y={cy - 12} width={28} height={24} fill="none" stroke={compState.color} strokeWidth={1.5} rx={3} />
                    <text x={cx} y={cy + 2} textAnchor="middle" className="diag-text-wire font-bold" fill={compState.color}>24V</text>
                    <line x1={cx - 6} y1={cy + 6} x2={cx + 6} y2={cy + 6} stroke={compState.color} strokeWidth={1} />
                    <line x1={cx - 3} y1={cy + 9} x2={cx + 3} y2={cy + 9} stroke={compState.color} strokeWidth={1} />
                  </g>
                )}

                {comp.type === "disconnect" && (
                  <DiagramDisconnect cx={cx} cy={cy} color={compState.color} energized={compState.energized} scale={0.85} />
                )}

                {comp.type === "plc_input" && (
                  <g>
                    <DiagramPLCInput cx={cx} cy={cy} color={compState.color} scale={0.85} energized={compState.energized} />
                    <text x={cx + 8} y={cy - 4} textAnchor="middle" className="diag-text-state" fill={compState.color} style={{ fontFamily: "var(--diag-font-mono)" }}>
                      {comp.label.match(/I:[\d/]+/)?.[0] ?? ""}
                    </text>
                    <motion.circle
                      cx={cx - 6}
                      cy={cy + 6}
                      r={3.5}
                      fill={compState.energized ? "#22c55e" : "#374151"}
                      animate={hasLedBlink ? { opacity: [0, 1, 0] } : compState.energized ? { opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: hasLedBlink ? 0.5 : 1.5, repeat: Infinity }}
                    />
                    <text x={cx + 8} y={cy + 9} textAnchor="middle" className="diag-text-state" fill={compState.energized ? "#86efac" : "#6b7280"} style={{ fontFamily: "var(--diag-font-mono)" }}>
                      {compState.energized ? "ON" : "OFF"}
                    </text>
                  </g>
                )}

                {comp.type === "plc_output" && (
                  <g>
                    <DiagramPLCOutput cx={cx} cy={cy} color={compState.color} scale={0.85} energized={compState.energized} />
                    <text x={cx + 8} y={cy - 4} textAnchor="middle" className="diag-text-state" fill={compState.color} style={{ fontFamily: "var(--diag-font-mono)" }}>
                      {comp.label.match(/O:[\d/]+/)?.[0] ?? ""}
                    </text>
                    <motion.circle
                      cx={cx - 6}
                      cy={cy + 6}
                      r={3.5}
                      fill={compState.energized ? "#22c55e" : "#374151"}
                      animate={hasLedBlink ? { opacity: [0, 1, 0] } : compState.energized ? { opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: hasLedBlink ? 0.5 : 1.5, repeat: Infinity }}
                    />
                    <text x={cx + 8} y={cy + 9} textAnchor="middle" className="diag-text-state" fill={compState.energized ? "#86efac" : "#6b7280"} style={{ fontFamily: "var(--diag-font-mono)" }}>
                      {compState.energized ? "ON" : "OFF"}
                    </text>
                  </g>
                )}

                {comp.type === "contactor" && (
                  <g>
                    {/* Contactor coil = verified NEMA / JIC coil primitive + label */}
                    <DiagramCoil cx={cx} cy={cy} color={compState.color} scale={0.85} />
                    <text x={cx} y={cy + 4} textAnchor="middle" className="diag-text-xs font-bold" fill={compState.color}>K</text>
                  </g>
                )}

                {comp.type === "transformer" && (
                  <DiagramTransformer cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "breaker" && (
                  <DiagramBreaker cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "contact_no" && (
                  <DiagramNOContact cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "contact_nc" && (
                  <DiagramNCContact cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "coil" && (
                  <DiagramCoil cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "fuse" && (
                  <DiagramFuse cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {comp.type === "terminal" && (
                  <DiagramTerminal cx={cx} cy={cy} color={compState.color} scale={0.85} />
                )}

                {/* Label below component — pushed clear of the 48px symbol box (ends at cy+24) */}
                <text x={cx} y={cy + 42} textAnchor="middle" fill="#9ca3af" className="diag-text-tag" style={{ fontFamily: "var(--diag-font-mono)", pointerEvents: "none" }}>
                  <title>{comp.label}</title>
                  {comp.label.length > 16 ? comp.label.slice(0, 15) + "…" : comp.label}
                </text>

                {/* Fault indicator badge — softer pulsing glow */}
                {isFaulted && (
                  <motion.g
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <circle cx={cx + 30} cy={cy - 18} r={8} fill="#ef4444" opacity={0.9} />
                    <circle cx={cx + 30} cy={cy - 18} r={12} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.3} />
                    <text x={cx + 30} y={cy - 14} textAnchor="middle" fill="white" className="diag-text-xs font-bold">!</text>
                  </motion.g>
                )}

                {/* Spark effect */}
                {hasSpark && <SparkEffect cx={cx} cy={cy} intensity={compAnims.find(a => a.type === "spark")?.intensity || 0.7} />}
              </motion.g>
            </g>
          );
        })}
      </g>
    );
  };

  const totalHeight = diagram.rungs.length * 120 + 100;

  return (
    <div className="relative font-sim">
      {/* Zoom controls + reset pan — hidden entirely on mobile to avoid covering fault/action area */}
      {!hideMobileControls && (
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5" style={{ paddingRight: 'env(safe-area-inset-right, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {/* Pan/Zoom toggle — only shown on mobile landscape */}
          {disablePanZoom && (
            <button
              onClick={() => setPanZoomOverride(prev => !prev)}
              className={`w-8 h-8 rounded-lg backdrop-blur-sm border text-sm flex items-center justify-center transition-all ${
                panZoomOverride
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-[#111]/80 border-gray-700/40 text-gray-300 hover:bg-gray-700/60 hover:text-white"
              }`}
              title={panZoomOverride ? "Lock diagram (enable scroll)" : "Unlock pan/zoom"}
            >
              {panZoomOverride ? <Move className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
          {[
            { label: "+", action: () => setScale(s => Math.min(s + 0.2, 3)) },
            { label: "\u2212", action: () => setScale(s => Math.max(s - 0.2, 0.4)) },
            { label: "1:1", action: () => { setScale(1); setPanOffset({ x: 0, y: 0 }); } },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="w-8 h-8 rounded-lg bg-[#111]/80 backdrop-blur-sm border border-gray-700/40 text-gray-300 text-sm flex items-center justify-center hover:bg-gray-700/60 hover:text-white transition-all"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Title bar — premium */}
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-emerald-500"
        />
        <h4 className="text-xs text-gray-400 uppercase tracking-wider font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
          {diagram.title}
        </h4>
        {systemState && (
          <span className={`ml-auto sim-chip text-[10px] ${
            Object.values(systemState.componentStates || {}).some(c => c.state === "faulted" || c.state === "tripped" || c.state === "overheating")
              ? "sim-chip-red"
              : "sim-chip-green"
          }`}>
            {systemState.label}
          </span>
        )}
      </div>

      {/* SVG Diagram — zoomable, pannable container */}
      <div
        ref={containerRef}
        className={`rounded-xl bg-gradient-to-b from-[#060806] to-[#040604] h-full border border-gray-800/40 select-none ${
          effectiveDisablePanZoom
            ? "overflow-auto cursor-default"
            : "overflow-hidden cursor-grab active:cursor-grabbing"
        }`}
        style={{ boxShadow: "inset 0 2px 12px rgba(0,0,0,0.4)", touchAction: effectiveDisablePanZoom ? "pan-x pan-y pinch-zoom" : "none", overscrollBehavior: "contain", WebkitOverflowScrolling: effectiveDisablePanZoom ? "touch" : undefined } as React.CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <svg
          viewBox={`0 0 800 ${totalHeight}`}
          className="electrical-diagram w-full min-w-0"
          style={{ transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`, transformOrigin: "top left" }}
        >
          {/* SVG Defs — refined filters and gradients */}
          <defs>
            <filter id="glow-soft">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-fault">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="thermal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="power-rail-l" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="power-rail-n" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Power rails with softer glow */}
          <line x1={50} y1={30} x2={50} y2={totalHeight - 20} stroke="url(#power-rail-l)" strokeWidth={3.5} />
          <line x1={50} y1={30} x2={50} y2={totalHeight - 20} stroke="#ef4444" strokeWidth={8} filter="url(#glow-soft)" opacity={0.12} />
          <line x1={750} y1={30} x2={750} y2={totalHeight - 20} stroke="url(#power-rail-n)" strokeWidth={3.5} />
          <line x1={750} y1={30} x2={750} y2={totalHeight - 20} stroke="#3b82f6" strokeWidth={8} filter="url(#glow-soft)" opacity={0.12} />

          {/* Rail labels */}
          <text x={50} y={18} textAnchor="middle" fill="#f87171" className="text-[11px] font-bold" style={{ fontFamily: "var(--font-mono)" }}>{diagram.rails.left}</text>
          <text x={750} y={18} textAnchor="middle" fill="#60a5fa" className="text-[11px] font-bold" style={{ fontFamily: "var(--font-mono)" }}>{diagram.rails.right}</text>

          {/* Rungs */}
          {diagram.rungs.map((rung, idx) => renderRung(rung, idx))}

          {/* System state indicator — cleaner */}
          {systemState && (
            <g>
              {(() => {
                const hasFaultedComp = Object.values(systemState.componentStates || {}).some(
                  c => c.state === "faulted" || c.state === "tripped" || c.state === "overheating"
                );
                const statusColor = hasFaultedComp ? "#ef4444" : "#22c55e";
                const statusText = hasFaultedComp ? "FAULT" : "RUN";
                return (
                  <>
                    <rect x={620} y={totalHeight - 48} width={120} height={30} rx={8} fill="oklch(0.10 0.003 250)" stroke={statusColor} strokeWidth={1.2} />
                    <motion.circle
                      cx={640}
                      cy={totalHeight - 33}
                      r={5}
                      fill={statusColor}
                      animate={{ opacity: hasFaultedComp ? [1, 0.3, 1] : [0.7, 1, 0.7] }}
                      transition={{ duration: hasFaultedComp ? 0.5 : 2, repeat: Infinity }}
                    />
                    <text x={652} y={totalHeight - 29} fill="#d1d5db" className="text-[10px] font-bold" style={{ fontFamily: "var(--font-mono)" }}>{statusText}</text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Component info panel — glassmorphism popover */}
      <AnimatePresence>
        {selectedComponent && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            drag={effectiveDisablePanZoom ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 60) setSelectedComponent(null);
            }}
            className={effectiveDisablePanZoom
              ? "absolute inset-x-3 bottom-12 z-20 sim-glass-elevated p-4 max-h-[60%] overflow-y-auto"
              : "mt-4 sim-glass-elevated p-5 relative"
            }
          >
            {/* Swipe handle indicator (mobile landscape only) */}
            {effectiveDisablePanZoom && (
              <div className="flex justify-center mb-2 -mt-1">
                <div className="w-8 h-1 rounded-full bg-gray-600" />
              </div>
            )}
            <button
              onClick={() => setSelectedComponent(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                hasFault(selectedComponent.id) ? "bg-red-500/15 border border-red-500/20" : "bg-emerald-500/15 border border-emerald-500/20"
              }`}>
                {hasFault(selectedComponent.id) ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <Zap className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-semibold mb-1.5" style={{ fontFamily: "var(--font-sim-body)" }}>{selectedComponent.label}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="sim-chip sim-chip-gray text-[10px] uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    {selectedComponent.type.replace(/_/g, " ")}
                  </span>
                  <span className={`sim-chip text-[10px] ${
                    hasFault(selectedComponent.id) ? "sim-chip-red" : "sim-chip-green"
                  }`} style={{ fontFamily: "var(--font-mono)" }}>
                    {selectedComponent.state}
                  </span>
                </div>

                {/* Tap info */}
                {selectedComponent.tapInfo && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-gray-300 text-xs"><span className="text-gray-500">Function:</span> {selectedComponent.tapInfo.function}</p>
                    <p className="text-gray-300 text-xs"><span className="text-gray-500">Current:</span> <span className={hasFault(selectedComponent.id) ? "text-red-300" : "text-emerald-300"}>{selectedComponent.tapInfo.currentState}</span></p>
                    <p className="text-gray-300 text-xs"><span className="text-gray-500">Normal:</span> {selectedComponent.tapInfo.normalState}</p>
                  </div>
                )}

                {/* New Tech explanation */}
                {role === "new" && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Info className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-300 text-[10px] font-semibold uppercase tracking-wider">How This Works</span>
                    </div>
                    <p className="text-blue-200/70 text-[11px] leading-relaxed">
                      {selectedComponent.type === "estop" && "Emergency Stop (E-Stop): A safety device with NC (Normally Closed) contacts wired in series. When pressed, it opens the circuit and stops all motion. All E-stops must be released for the machine to run — this is called 'fail-safe' design."}
                      {selectedComponent.type === "relay" && "Safety Relay: An electrically operated switch that monitors the E-stop chain. When all E-stops are released (circuit complete), the relay energizes and its output contacts close, telling the PLC 'safety is OK'."}
                      {selectedComponent.type === "motor" && "Electric Motor: Converts electrical energy to mechanical rotation. Protected by overloads. If the motor draws too much current (from a bad bearing, seized load, etc.), the overload trips to prevent winding damage."}
                      {selectedComponent.type === "vfd" && "Variable Frequency Drive: Controls motor speed by varying frequency. Has built-in protections including overload, overvoltage, and Safe Torque Off (STO). When STO is active, the drive physically cannot produce output."}
                      {selectedComponent.type === "overload" && "Overload Protection: Monitors motor current. If current exceeds the setpoint for too long (I²t curve), it trips. This prevents motor winding insulation from melting. Must be investigated — not just reset."}
                      {selectedComponent.type === "plc_input" && "PLC Input: A digital signal the PLC reads from the field. TRUE (24VDC) or FALSE (0VDC). The PLC uses these inputs in its logic program to make decisions about running equipment."}
                      {selectedComponent.type === "plc_output" && "PLC Output: A digital signal the PLC sends to the field to control equipment. When TRUE, it energizes a relay, contactor, or sends a signal to a VFD."}
                      {selectedComponent.type === "power_supply" && "Power Supply: Converts 480VAC to 24VDC for the control circuit. Powers PLC inputs, safety relays, sensors, and indicator lights."}
                      {selectedComponent.type === "disconnect" && "Disconnect Switch: A manual switch that removes all power from downstream equipment. Used for lockout/tagout (LOTO) during maintenance."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend — cleaner, more spaced (hidden on mobile landscape to save space) */}
      {!effectiveDisablePanZoom && <div className="mt-4 flex flex-wrap gap-5 text-[10px] text-gray-500 px-1">
        <span className="flex items-center gap-2">
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Energized
        </span>
        <span className="flex items-center gap-2">
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Faulted
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
          De-energized
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Warning
        </span>
        <span className="text-gray-600 ml-auto">Tap component for details · Click rung label to trace</span>
      </div>}
    </div>
  );
}
