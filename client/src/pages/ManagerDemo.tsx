/**
 * Manager Demo — public-facing sample-data preview of the Manager Dashboard.
 * No authentication required. Shows what the manager portal looks like
 * with realistic (but clearly labeled) sample data.
 */
import SEO from "@/components/SEO";
import ManagerDashboardPreview from "@/components/previews/ManagerDashboardPreview";
import PreviewFrame from "@/components/previews/PreviewFrame";

export default function ManagerDemo() {
  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO
        title="Manager Dashboard Demo — Workforce Competency at a Glance"
        description="See who's ready, who needs review, who has a safety risk, and where your team's skill gaps are — from one evidence model."
        path="/manager/demo"
      />
      <PreviewFrame
        title="Manager Dashboard"
        subtitle="Workforce competency, demonstrated — decisions, not just reports. The team shown below is sample data."
      >
        <ManagerDashboardPreview />
      </PreviewFrame>
    </div>
  );
}
