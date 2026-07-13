import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { Award, Download, ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Certificate() {
  const [, params] = useRoute("/certificate/:code");
  const code = params?.code || "";

  const { data: cert, isLoading } = trpc.certificates.getByCode.useQuery({ code });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading certificate...</div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Certificate Not Found</h2>
          <p className="text-muted-foreground mb-4">This certificate code is invalid or has been revoked.</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <SEO title={`Certificate - ${cert.moduleTitle}`} description={`Completion certificate for ${cert.userName}`} />
      
      {/* Print button - hidden during print */}
      <div className="container max-w-4xl mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Link href="/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
            </Button>
          </Link>
          <Button onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Certificate */}
      <div className="container max-w-4xl">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-green-600/50 rounded-lg p-12 relative overflow-hidden">
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-green-600/60" />
          <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-green-600/60" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-green-600/60" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-green-600/60" />

          {/* Content */}
          <div className="text-center relative z-10">
            {/* Logo/Icon */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Award className="w-10 h-10 text-green-500" />
              <div>
                <h3 className="text-lg font-bold tracking-wider text-green-500">EAS</h3>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">Electrical Automation Services</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-light tracking-wide text-foreground mb-2">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="w-24 h-0.5 bg-green-600 mx-auto mb-8" />

            {/* Recipient */}
            <p className="text-muted-foreground mb-2">This certifies that</p>
            <h2 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "Georgia, serif" }}>
              {cert.userName}
            </h2>
            <div className="w-48 h-px bg-border mx-auto mb-6" />

            {/* Course */}
            <p className="text-muted-foreground mb-2">has successfully completed the course</p>
            <h3 className="text-xl font-semibold text-green-400 mb-6">
              {cert.moduleTitle}
            </h3>

            {/* Score */}
            <p className="text-muted-foreground mb-8">
              with a quiz score of <span className="text-foreground font-bold">{cert.quizScore}%</span>
            </p>

            {/* Date and Code */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date Issued</p>
                <p className="text-sm font-medium">{issuedDate}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Instructor</p>
                <p className="text-sm font-medium mt-1" style={{ fontFamily: "Georgia, serif" }}>EAS Training</p>
                <p className="text-xs text-muted-foreground">Electrical Automation Services</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificate ID</p>
                <p className="text-sm font-mono">{cert.certificateCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification note */}
        <p className="text-center text-xs text-muted-foreground mt-4 print:hidden">
          Verify this certificate at:{" "}
          <Link href={`/verify-certificate/${cert.certificateCode}`} className="text-[oklch(0.55_0.12_155)] hover:underline">
            {window.location.origin}/verify-certificate/{cert.certificateCode}
          </Link>
        </p>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-2 max-w-lg mx-auto print:hidden">
          This is an internal skill-validation certificate issued by EAS. It is not accredited by OSHA, NIMS, or any government/industry body.
        </p>
      </div>
    </div>
  );
}
