/**
 * Hydraulic Pressure-Loss Lab — the fluid_power wedge simulator (MVP: F1 + F4).
 * Proves EASLearn's judgment engine transfers into another high-downtime domain.
 */
import { Link } from "wouter";
import { ArrowLeft, Droplet } from "lucide-react";
import SEO from "@/components/SEO";
import HydraulicSim from "@/components/hydraulicLab/HydraulicSim";

export default function HydraulicLab() {
  return (
    <>
      <SEO
        title="Hydraulic Pressure-Loss Lab"
        description="Diagnose hydraulic pressure loss on a clamp/press station — a method-first troubleshooting simulator, not a quiz."
      />
      <div className="min-h-screen bg-[oklch(0.07_0.003_250)] py-8">
        <div className="container max-w-4xl">
          <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.55_0.12_155)] mb-4 hover:gap-2.5 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Labs
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Droplet className="w-5 h-5 text-[oklch(0.62_0.14_250)]" />
            <h1 className="text-2xl font-heading text-white tracking-wide">Hydraulic Pressure-Loss Lab</h1>
          </div>
          <p className="text-sm text-[oklch(0.55_0.01_250)] mb-6">
            A clamp/press station is slow and weak. Prove <b>where</b> pressure is lost — restriction, relief, or pump — and don't blame the pump until the evidence proves the pump.
          </p>
          <HydraulicSim />
        </div>
      </div>
    </>
  );
}
