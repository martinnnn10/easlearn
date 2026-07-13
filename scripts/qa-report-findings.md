# EASLearn QA Report Findings - May 19, 2026

## Overall Score: 85% (FAIL)

## Pass/Fail Matrix
- Login & Session Persistence: PASS
- Content Quality & Accuracy: PASS (95/100)
- Progress Tracking & XP: PASS
- Labs (6 of 7): PASS
- Simulator Logic & Scenarios: PASS
- Mobile Tab Bar Fix (#1): PASS
- Simulator Exit Navigation: PASS
- Subscription Gating: FAIL (P0 - race condition locks paying users out)
- Tools Tab Scrolling: FAIL (P2 - scroll resets every 2s due to PLC live tags)
- Electrical Prints Mobile Pan: FAIL (P2 - touch-action: none breaks iOS scrolling)
- VFD Parameters Lab: FAIL (P3 - missing submission feedback UI)

## BUG 1: Subscription Gating Race Condition (P0 - CRITICAL)
- Impact: Paying Pro users blocked from accessing lessons (see "Subscribe to Unlock" paywall)
- Root Cause: In Lesson.tsx, the component renders the paywall before the getSubscription tRPC query resolves. The condition `if (!hasAccess || lessonIndex === 0)` evaluates to false during loading state.
- Fix: Add loading check before paywall:
  ```tsx
  const { data: subscriptionData, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const hasAccess = subscriptionData?.tier === "pro" || subscriptionData?.tier === "team";
  
  // Show skeleton while loading
  if (subLoading && isAuthenticated) {
    return <LessonSkeleton />;
  }
  
  // Only show paywall after loading completes
  if (!hasAccess && lessonIndex !== 0) {
    return <PaywallComponent />;
  }
  ```

## BUG 2: Tools Tab Scroll Reset in Simulator (P2 - HIGH)
- Impact: On mobile landscape, users cannot scroll down to see the bottom of the Tools panel. Scroll position violently snaps back to top every 2 seconds.
- Root Cause: The "PLC LIVE TAGS" component updates every 2000ms. This triggers a React re-render that replaces DOM nodes (childList mutations), causing the browser to reset the parent container's scrollTop to 0.
- Fix (SimulatorEngineV3.tsx / Tools Panel):
  ```tsx
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPos = useRef(0);
  
  // Save position before render
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => { scrollPos.current = el.scrollTop; };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Restore position after render
  useLayoutEffect(() => {
    if (scrollRef.current && scrollPos.current > 0) {
      scrollRef.current.scrollTop = scrollPos.current;
    }
  });
  
  // Apply ref to the scrollable container
  <div ref={scrollRef} className="overflow-y-auto h-full ...">
  ```

## BUG 3: Electrical Prints Schematic Won't Pan on Mobile (P2 - HIGH)
- Impact: iPad and iPhone users cannot use single-finger swipe to pan around the large electrical schematic. They are forced to use the tiny +/- buttons.
- Root Cause: The SVG container has inline CSS `touch-action: none`. This completely disables native iOS Safari scroll/pan gestures.
- Fix: Remove `touch-action: none` and allow native panning (`touch-action: pan-x pan-y`), OR implement a proper touch-compatible pan/zoom wrapper like `react-zoom-pan-pinch`.

## BUG 4: VFD Parameters Lab Missing Feedback (P3 - MEDIUM)
- Impact: Users fill out the 5 parameters based on the work order, click "Submit Configuration", and nothing happens. No score, no validation.
- Root Cause: The submit handler updates state, but there is no conditional UI rendered to display the results.
- Fix: Add a results block below the submit button that maps over the fields and displays field.correct status.
