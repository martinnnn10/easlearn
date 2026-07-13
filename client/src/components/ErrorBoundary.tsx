import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional: custom fallback for specific contexts (e.g., simulator) */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Report an error to the server-side logging endpoint.
 * Uses raw fetch to avoid depending on React context (class component).
 */
function reportErrorToServer(error: Error, componentName?: string) {
  try {
    const payload = [{
      "0": {
        json: {
          errorMessage: (error.message || "Unknown error").slice(0, 2000),
          errorStack: (error.stack || "").slice(0, 5000),
          componentName: componentName || undefined,
          url: window.location.href,
        },
      },
    }];
    // Fire-and-forget POST to the tRPC batch endpoint
    fetch("/api/trpc/errorLogging.logClientError?batch=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail — we don't want error reporting to cause more errors
    });
  } catch {
    // Silently fail
  }
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging (only visible in dev tools, not shown to user)
    console.error("[ErrorBoundary] Caught error:", error.message, errorInfo.componentStack);

    // Report to server for persistent logging
    const componentName = errorInfo.componentStack
      ?.split("\n")
      .find((line) => line.trim().startsWith("at "))
      ?.trim()
      .replace(/^at /, "")
      .split(" ")[0] || undefined;

    reportErrorToServer(error, componentName);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-[#060a06]">
          <div className="flex flex-col items-center w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-amber-400" />
            </div>

            <h2 className="text-xl mb-3 font-semibold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Something Went Wrong
            </h2>

            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              An unexpected error occurred. This has been logged automatically. 
              Please try reloading the page or return to the dashboard.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                  "bg-emerald-600 text-white",
                  "hover:bg-emerald-500 transition-colors cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>

              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                  "bg-white/5 border border-white/10 text-gray-300",
                  "hover:bg-white/10 transition-colors cursor-pointer"
                )}
              >
                <Home size={16} />
                Dashboard
              </button>
            </div>

            <p className="text-[11px] text-gray-600 mt-8 font-mono">
              If this keeps happening, try clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
