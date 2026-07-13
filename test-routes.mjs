// Test all public routes for HTTP 200 responses
const BASE = 'http://localhost:3000';

const routes = [
  '/',
  '/courses',
  '/simulator',
  '/about',
  '/contact',
  '/pricing',
  '/labs',
  '/programs',
  '/certifications',
  '/tutorials',
  '/resources',
  '/videos',
  '/enterprise',
  '/community',
  '/free-training',
  '/learning-path',
  '/roadmap',
  '/terms',
  '/privacy',
  '/login',
  '/signup',
  '/forgot-password',
  '/reference/semiconductor',
  '/reference/symbol-standards',
  '/reference/symbol-comparison',
  '/leaderboard',
  '/upgrade',
  '/labs/sandbox',
  // Dynamic routes with sample slugs
  '/courses/electrical-fundamentals',
  '/courses/motor-controls',
  '/courses/plc-fundamentals',
];

const results = [];

for (const route of routes) {
  try {
    const res = await fetch(`${BASE}${route}`, { redirect: 'follow' });
    const status = res.status;
    const ok = status === 200;
    results.push({ route, status, ok });
    if (!ok) {
      console.log(`FAIL: ${route} → ${status}`);
    }
  } catch (err) {
    results.push({ route, status: 'ERROR', ok: false, error: err.message });
    console.log(`ERROR: ${route} → ${err.message}`);
  }
}

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;

console.log(`\n=== ROUTE TEST RESULTS ===`);
console.log(`Total: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log(`\nFailed routes:`);
  results.filter(r => !r.ok).forEach(r => {
    console.log(`  ${r.route} → ${r.status}`);
  });
}

process.exit(failed > 0 ? 1 : 0);
