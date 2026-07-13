import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

async function checkRoute(path, description) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const status = res.status;
    const text = await res.text();
    const hasContent = text.length > 500;
    const isHTML = text.includes('<!DOCTYPE') || text.includes('<html');
    return { path, description, status, hasContent, isHTML, contentLength: text.length, error: null };
  } catch (e) {
    return { path, description, status: 0, hasContent: false, isHTML: false, contentLength: 0, error: e.message };
  }
}

async function checkAPI(path, description) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const status = res.status;
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { path, description, status, data, error: null };
  } catch (e) {
    return { path, description, status: 0, data: null, error: e.message };
  }
}

async function main() {
  console.log('=== FRONTEND ROUTE AUDIT ===\n');
  
  // Core pages
  const routes = [
    ['/', 'Homepage'],
    ['/courses', 'Courses catalog'],
    ['/simulator', 'Simulator'],
    ['/labs', 'Interactive Labs'],
    ['/pricing', 'Pricing'],
    ['/about', 'About'],
    ['/contact', 'Contact'],
    ['/programs', 'Programs'],
    ['/learning-path', 'Learning Path'],
    ['/free-training', 'Free Training'],
    ['/enterprise', 'Enterprise'],
    ['/tutorials', 'Tutorials/Knowledge Base'],
    ['/resources', 'Resources'],
    ['/leaderboard', 'Leaderboard'],
    ['/community', 'Community'],
    ['/roadmap', 'Roadmap'],
    ['/reference/symbol-standards', 'Symbol Standards Reference'],
    ['/reference/semiconductor', 'Semiconductor Reference'],
    ['/terms', 'Terms of Service'],
    ['/privacy', 'Privacy Policy'],
  ];
  
  const routeResults = [];
  for (const [path, desc] of routes) {
    const result = await checkRoute(path, desc);
    routeResults.push(result);
    const status = result.status === 200 ? '✅' : '❌';
    console.log(`${status} [${result.status}] ${path} - ${desc} (${result.contentLength} bytes)`);
  }
  
  console.log('\n=== API ENDPOINT AUDIT ===\n');
  
  // Check tRPC endpoints for courses
  const apiChecks = [
    ['/api/trpc/courses.listModules?input={}', 'List all course modules'],
    ['/api/trpc/courses.getModuleBySlug?input=%7B%22slug%22%3A%22electrical-fundamentals%22%7D', 'Get electrical-fundamentals module'],
    ['/api/trpc/courses.getModuleBySlug?input=%7B%22slug%22%3A%22plc-fundamentals%22%7D', 'Get plc-fundamentals module'],
    ['/api/trpc/courses.getModuleBySlug?input=%7B%22slug%22%3A%22powerflex-vfd%22%7D', 'Get powerflex-vfd module'],
    ['/api/trpc/courses.getLessonBySlug?input=%7B%22moduleSlug%22%3A%22electrical-fundamentals%22%2C%22lessonSlug%22%3A%22ohms-law-power%22%7D', 'Get first lesson of electrical-fundamentals'],
    ['/api/trpc/courses.getLessonBySlug?input=%7B%22moduleSlug%22%3A%22plc-fundamentals%22%2C%22lessonSlug%22%3A%22plc-architecture-components%22%7D', 'Get first lesson of plc-fundamentals'],
    ['/api/trpc/simulator.getScenarios?input={}', 'List simulator scenarios'],
    ['/api/trpc/quiz.getQuestions?input=%7B%22moduleId%22%3A1%7D', 'Get quiz questions for module 1'],
  ];
  
  for (const [path, desc] of apiChecks) {
    const result = await checkAPI(path, desc);
    const status = result.status === 200 ? '✅' : '❌';
    let info = '';
    if (result.data && result.data.result && result.data.result.data) {
      const d = result.data.result.data;
      if (Array.isArray(d)) info = `(${d.length} items)`;
      else if (d.json && Array.isArray(d.json)) info = `(${d.json.length} items)`;
      else if (d.json) info = `(has data)`;
    }
    console.log(`${status} [${result.status}] ${desc} ${info}`);
    if (result.status !== 200 && result.data) {
      console.log(`   Error: ${JSON.stringify(result.data).substring(0, 200)}`);
    }
  }
  
  console.log('\n=== COURSE LESSON LOADING TEST (sample) ===\n');
  
  // Test loading a lesson from each major course
  const lessonTests = [
    ['electrical-fundamentals', 'ohms-law-power'],
    ['plc-fundamentals', 'plc-architecture-components'],
    ['powerflex-vfd', 'powerflex-525-overview'],
    ['motors-controls', 'ac-motor-theory'],
    ['fluid-power', 'hydraulic-fundamentals'],
    ['alignment', 'shaft-alignment-fundamentals'],
    ['print-reading', 'electrical-schematic-basics'],
    ['safety-systems', 'machine-safety-fundamentals'],
    ['sensors-instrumentation', 'proximity-sensors-photoeyes'],
    ['industrial-networking', 'ethernet-ip-fundamentals'],
    ['robotics-fundamentals', 'industrial-robot-types'],
    ['process-control', 'pid-control-fundamentals'],
    ['sensor-fundamentals', 'inductive-proximity-sensors'],
    ['plc-connection-fundamentals', 'ethernet-ip-architecture'],
    ['drives-servo-communication', 'vfd-ethernet-ip-setup'],
  ];
  
  for (const [moduleSlug, lessonSlug] of lessonTests) {
    const input = encodeURIComponent(JSON.stringify({ moduleSlug, lessonSlug }));
    const result = await checkAPI(`/api/trpc/courses.getLessonBySlug?input=${input}`, `${moduleSlug}/${lessonSlug}`);
    const status = result.status === 200 ? '✅' : '❌';
    let contentLen = 0;
    if (result.data?.result?.data?.json?.content) {
      contentLen = result.data.result.data.json.content.length;
    }
    console.log(`${status} ${moduleSlug}/${lessonSlug} - ${contentLen} chars`);
    if (result.status !== 200) {
      console.log(`   Error: ${JSON.stringify(result.data).substring(0, 200)}`);
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===\n');
  const failedRoutes = routeResults.filter(r => r.status !== 200);
  console.log(`Routes: ${routeResults.length - failedRoutes.length}/${routeResults.length} passed`);
  if (failedRoutes.length > 0) {
    console.log('Failed routes:');
    for (const r of failedRoutes) {
      console.log(`  ❌ ${r.path} - ${r.description} (status: ${r.status})`);
    }
  }
}

main().catch(console.error);
