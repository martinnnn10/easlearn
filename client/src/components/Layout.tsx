import { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Zap, Mail, Award, ChevronDown, Users, LogOut, Settings, LayoutDashboard, BarChart3 } from "lucide-react";
import ScrollToTop from "./ScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import TrialBanner from "./TrialBanner";
import { FOCUSED_LAUNCH } from "@shared/featureFlags";
import { useSubscription } from "@/hooks/useSubscription";
import CommandPalette from "./CommandPalette";

type NavLink = {
  href: string;
  label: string;
  match: (loc: string) => boolean;
  dropdown?: { href: string; label: string }[];
};

const fullNavLinks: NavLink[] = [
  { href: "/", label: "Home", match: (loc) => loc === "/" },
  { href: "/courses", label: "Learn", match: (loc) => loc.startsWith("/courses") },
  {
    href: "/labs",
    label: "Simulate",
    match: (loc) => loc.startsWith("/labs") || loc === "/simulator",
  },
  {
    href: "/hubs/plc",
    label: "Hubs",
    match: (loc) => loc.startsWith("/hubs"),
    dropdown: [
      { href: "/hubs/plc", label: "PLC Hub" },
      { href: "/hubs/vfd", label: "VFD Hub" },
    ],
  },
  { href: "/pricing", label: "Pricing", match: (loc) => loc === "/pricing" },
  { href: "/enterprise", label: "Enterprise", match: (loc) => loc === "/enterprise" },
];

// Focused-launch nav: guided learner journey through the platform.
const focusedNavLinks: NavLink[] = [
  {
    href: "/learn",
    label: "Home",
    match: (loc) => loc === "/learn",
  },
  {
    href: "/become-a-tech",
    label: "My Path",
    match: (loc) => loc === "/become-a-tech",
  },
  {
    href: "/labs",
    label: "Practice",
    match: (loc) => loc.startsWith("/labs") || loc === "/simulator",
  },
  {
    href: "/skills-passport",
    label: "Skills Passport",
    match: (loc) => loc === "/skills-passport",
  },
  {
    href: "/courses",
    label: "Explore",
    match: (loc) => loc.startsWith("/courses") || loc === "/competency" || loc === "/symbols" || loc.startsWith("/reference"),
  },
];

const navLinks: NavLink[] = FOCUSED_LAUNCH ? focusedNavLinks : fullNavLinks;

function HubsNavDropdown({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = link.dropdown ?? [];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
          active
            ? "text-white bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/25%)]"
            : "text-[oklch(0.60_0.005_250)] hover:text-white"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {link.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1 min-w-[10rem] z-50">
          <div className="rounded-lg border border-[oklch(0.20_0.004_250)] bg-[oklch(0.09_0.003_250)] shadow-xl py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="block px-4 py-2.5 min-h-11 text-sm text-[oklch(0.65_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavUserLinks() {
  const { isAuthenticated, loading } = useAuth();
  const teamQuery = trpc.team.getMyTeam.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  if (loading || !isAuthenticated) return null;
  return (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[oklch(0.60_0.005_250)] hover:text-white transition-colors rounded"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="hidden xl:inline">Dashboard</span>
      </Link>
      {teamQuery.data && (
        <Link
          href="/team"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[oklch(0.60_0.005_250)] hover:text-white transition-colors rounded"
        >
          <Users className="w-4 h-4" />
          <span className="hidden xl:inline">Team</span>
        </Link>
      )}
      {teamQuery.data && ["owner", "admin", "manager"].includes(teamQuery.data.role) && (
        <Link
          href="/manager"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[oklch(0.60_0.005_250)] hover:text-white transition-colors rounded"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden xl:inline">Manager</span>
        </Link>
      )}
    </>
  );
}

function NavAuthButton() {
  const { isAuthenticated, user, loading } = useAuth();
  // While auth state is loading, show a placeholder to prevent flicker
  if (loading) {
    return (
      <div className="w-[88px] h-[36px] bg-[oklch(0.12_0.004_250)] rounded-lg animate-pulse" />
    );
  }
  if (isAuthenticated) {
    return (
      <Link
        href="/account"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[oklch(0.12_0.004_250)] hover:bg-[oklch(0.16_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-lg transition-colors"
      >
        <div className="w-5 h-5 rounded-full bg-[oklch(0.25_0.06_155)] flex items-center justify-center text-[10px] text-white font-bold">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <span className="hidden xl:inline">{user?.name?.split(" ")[0] || "Account"}</span>
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="px-5 py-2 text-sm font-medium btn-primary rounded"
    >
      Sign In
    </Link>
  );
}

function MobileAuthSection() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const teamQuery = trpc.team.getMyTeam.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-[oklch(0.20_0.004_250)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[oklch(0.15_0.004_250)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-[oklch(0.15_0.004_250)] rounded animate-pulse" />
            <div className="h-2 w-32 bg-[oklch(0.12_0.004_250)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mt-3 pt-3 border-t border-[oklch(0.20_0.004_250)]">
        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[oklch(0.25_0.06_155)] flex items-center justify-center text-xs text-white font-bold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
            <p className="text-[11px] text-[oklch(0.45_0.006_250)]">{user?.email || ""}</p>
          </div>
        </div>
        {/* Quick links */}
        <div className="flex flex-col gap-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[oklch(0.65_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)] rounded transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/my-certificates"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[oklch(0.65_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)] rounded transition-colors"
          >
            <Award className="w-4 h-4" />
            My Certificates
          </Link>
          {teamQuery.data && ["owner", "admin", "manager"].includes(teamQuery.data.role) && (
            <Link
              href="/manager"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[oklch(0.65_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)] rounded transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Manager Portal
            </Link>
          )}
          <Link
            href="/account"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[oklch(0.65_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)] rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[oklch(0.55_0.06_25)] hover:text-[oklch(0.70_0.10_25)] hover:bg-[oklch(0.14_0.004_250)] rounded transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-[oklch(0.20_0.004_250)] flex flex-col gap-2">
      <Link
        href="/login"
        className="block px-4 py-3 text-sm font-medium btn-primary rounded text-center"
      >
        Sign In
      </Link>
      <Link
        href="/pricing"
        className="block px-4 py-3 text-sm font-medium text-[oklch(0.60_0.005_250)] text-center border border-[oklch(0.20_0.004_250)] rounded hover:border-[oklch(0.30_0.004_250)] transition-colors"
      >
        View Plans
      </Link>
    </div>
  );
}

function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)] ${
        isScrolled
          ? "bg-[oklch(0.10_0.003_250/98%)] backdrop-blur-md border-b border-[oklch(0.20_0.004_250)]"
          : "bg-[oklch(0.10_0.003_250/90%)] backdrop-blur-sm"
      }`}
    >
      <div className="container flex items-center justify-between h-16 lg:h-[68px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 min-h-11">
          <div className="w-8 h-8 rounded bg-[oklch(0.55_0.12_155/15%)] border border-[oklch(0.55_0.12_155/30%)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg leading-none tracking-wide text-white">EAS</span>
            <span className="text-[9px] font-mono-industrial text-[oklch(0.50_0.008_250)] tracking-widest hidden sm:block">
              TRAINING PLATFORM
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = link.match(location);
            if (link.dropdown) {
              return <HubsNavDropdown key={link.href} link={link} active={active} />;
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                  active
                    ? "text-white bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/25%)]"
                    : "text-[oklch(0.60_0.005_250)] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-2">
          <CommandPalette />
          <NavUserLinks />
          <NavAuthButton />
        </div>

        {/* Mobile Toggle — 44px minimum tap target */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-[oklch(0.60_0.005_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)] transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

    </header>
      {/* Mobile Menu — portaled outside header to avoid iOS Safari backdrop-filter containing block */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="lg:hidden fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-sm bg-[oklch(0.09_0.003_250)] border-l border-[oklch(0.20_0.004_250)] shadow-2xl flex flex-col pt-[env(safe-area-inset-top)]"
              >
                <div className="flex items-center justify-between px-4 h-16 border-b border-[oklch(0.18_0.004_250)]">
                  <span className="font-heading text-white tracking-wide">Menu</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-[oklch(0.60_0.005_250)] hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav
                  aria-label="Mobile navigation"
                  className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {navLinks.map((link) => {
                    const active = link.match(location);
                    if (link.dropdown) {
                      return (
                        <div key={link.href} className="space-y-1">
                          <p className="px-4 pt-2 text-[10px] font-mono uppercase tracking-wider text-[oklch(0.45_0.006_250)]">
                            {link.label}
                          </p>
                          {link.dropdown.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`block px-4 py-3.5 min-h-11 text-base font-medium rounded-lg transition-colors ${
                                location.startsWith(item.href)
                                  ? "text-white bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/25%)]"
                                  : "text-[oklch(0.70_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)]"
                              }`}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-4 py-3.5 min-h-11 text-base font-medium rounded-lg transition-colors ${
                          active
                            ? "text-white bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/25%)]"
                            : "text-[oklch(0.70_0.008_250)] hover:text-white hover:bg-[oklch(0.14_0.004_250)]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <MobileAuthSection />
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[oklch(0.18_0.004_250)] bg-[oklch(0.08_0.003_250)]">
      <div className="container py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[oklch(0.55_0.12_155/15%)] border border-[oklch(0.55_0.12_155/30%)] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
              </div>
              <span className="font-heading text-lg text-white tracking-wide">EAS</span>
            </div>
            <p className="text-sm text-[oklch(0.55_0.008_250)] leading-relaxed max-w-xs">
              Electrical Automation Services, Inc.<br />
              Industrial training and troubleshooting simulation built from real plant-floor experience.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-[oklch(0.50_0.008_250)] tracking-wider uppercase">Platform</h4>
            <div className="flex flex-col gap-1">
              <Link href="/" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/courses" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Learn
              </Link>
              <Link href="/labs" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Simulate
              </Link>
              <Link href="/hubs/plc" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                PLC Hub
              </Link>
              <Link href="/hubs/vfd" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                VFD Hub
              </Link>
              <Link href="/pricing" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/enterprise" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Enterprise
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-[oklch(0.50_0.008_250)] tracking-wider uppercase">Company</h4>
            <div className="flex flex-col gap-1">
              <Link href="/about" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/terms" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="inline-flex items-center min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium text-[oklch(0.50_0.008_250)] tracking-wider uppercase">Support</h4>
            <div className="flex flex-col gap-1">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 min-h-11 py-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="divider mt-10 mb-6" />

        {/* System Status Bar — industrial immersion */}
        <div className="flex items-center gap-4 mb-6 text-[10px] font-mono text-[oklch(0.40_0.006_250)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.55_0.12_155)] animate-pulse" />
            Platform Online
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">All Systems Operational</span>
          <span>|</span>
          <span>v2.4.0</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[oklch(0.40_0.006_250)]">
            &copy; {new Date().getFullYear()} Electrical Automation Services, Inc. All rights reserved.
          </p>
          <p className="text-[10px] text-[oklch(0.35_0.006_250)] max-w-md">
            All content, scenarios, training materials, and intellectual property on this platform are protected by U.S. copyright law.
          </p>
        </div>
      </div>
    </footer>
  );
}

function TrialBannerWrapper() {
  const { showTrialBanner, trialDaysRemaining, trialEndsAt, isTrial, trialExpired, status } = useSubscription();
  if (!showTrialBanner) return null;
  return (
    <TrialBanner
      trialDaysRemaining={trialDaysRemaining}
      trialEndsAt={trialEndsAt}
      isTrial={isTrial}
      trialExpired={trialExpired}
      status={status}
    />
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  // Hide chrome when simulator engine is active (it renders its own full-screen UI)
  const isSimulatorRoute = location === "/simulator";
  // Print-friendly lesson pages render their own minimal chrome
  const isPrintRoute = location.endsWith("/print");

  // Defensive cleanup: always remove sim-body-locked when navigating away from simulator
  useEffect(() => {
    if (!isSimulatorRoute) {
      document.body.classList.remove('sim-body-locked');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }, [isSimulatorRoute, location]);

  // Print route: no nav, no footer, just the content
  if (isPrintRoute) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <ScrollToTop />
        <main>
          {children}
        </main>
      </div>
    );
  }

  // For the simulator route, use a simple block layout instead of flex
  // to avoid iOS Safari scroll traps with flex + min-height: 100dvh
  if (isSimulatorRoute) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <ScrollToTop />
        <main>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      <ScrollToTop />
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[oklch(0.55_0.12_155)] focus:text-white focus:rounded focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Navbar />
      <div className="pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-[calc(68px+env(safe-area-inset-top))]"><TrialBannerWrapper /></div>
      <main id="main-content" className="flex-1" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
