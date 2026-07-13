import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

async function callTRPC(procedure, input) {
  const inputStr = input ? encodeURIComponent(JSON.stringify({ json: input })) : '{}';
  const url = `${BASE_URL}/api/trpc/${procedure}?input=${inputStr}`;
  const res = await fetch(url);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data };
}

async function main() {
  console.log('=== COURSE MODULE LOADING TEST ===\n');
  
  // Get all modules
  const modulesRes = await callTRPC('courses.listModules');
  if (modulesRes.status !== 200) {
    console.log('❌ Failed to list modules:', JSON.stringify(modulesRes.data).substring(0, 200));
    return;
  }
  
  const modules = modulesRes.data?.result?.data?.json || [];
  console.log(`Found ${modules.length} modules\n`);
  
  // Test getting each module
  let moduleFailures = [];
  for (const mod of modules) {
    const res = await callTRPC('courses.getModule', { slug: mod.slug });
    if (res.status !== 200) {
      moduleFailures.push({ slug: mod.slug, title: mod.title, error: 'Failed to load' });
      console.log(`❌ Module: ${mod.slug} - FAILED`);
    } else {
      const moduleData = res.data?.result?.data?.json;
      const lessons = moduleData?.lessons || [];
      console.log(`✅ Module: ${mod.slug} - ${lessons.length} lessons`);
      
      // Test first and last lesson of each module
      if (lessons.length > 0) {
        const firstLesson = lessons[0];
        const lessonRes = await callTRPC('courses.getLesson', { moduleSlug: mod.slug, lessonSlug: firstLesson.slug });
        if (lessonRes.status !== 200) {
          moduleFailures.push({ slug: mod.slug, lesson: firstLesson.slug, error: 'First lesson failed to load' });
          console.log(`   ❌ First lesson: ${firstLesson.slug} - FAILED`);
        } else {
          const lessonData = lessonRes.data?.result?.data?.json;
          const contentLen = lessonData?.content?.length || 0;
          if (contentLen < 50) {
            moduleFailures.push({ slug: mod.slug, lesson: firstLesson.slug, error: `Empty content (${contentLen} chars)` });
            console.log(`   ❌ First lesson: ${firstLesson.slug} - EMPTY (${contentLen} chars)`);
          } else {
            console.log(`   ✅ First lesson: ${firstLesson.slug} - ${contentLen} chars`);
          }
        }
        
        if (lessons.length > 1) {
          const lastLesson = lessons[lessons.length - 1];
          const lessonRes2 = await callTRPC('courses.getLesson', { moduleSlug: mod.slug, lessonSlug: lastLesson.slug });
          if (lessonRes2.status !== 200) {
            moduleFailures.push({ slug: mod.slug, lesson: lastLesson.slug, error: 'Last lesson failed to load' });
            console.log(`   ❌ Last lesson: ${lastLesson.slug} - FAILED`);
          } else {
            const lessonData2 = lessonRes2.data?.result?.data?.json;
            const contentLen2 = lessonData2?.content?.length || 0;
            if (contentLen2 < 50) {
              moduleFailures.push({ slug: mod.slug, lesson: lastLesson.slug, error: `Empty content (${contentLen2} chars)` });
              console.log(`   ❌ Last lesson: ${lastLesson.slug} - EMPTY (${contentLen2} chars)`);
            } else {
              console.log(`   ✅ Last lesson: ${lastLesson.slug} - ${contentLen2} chars`);
            }
          }
        }
      }
    }
  }
  
  console.log('\n=== SIMULATOR SCENARIOS TEST ===\n');
  
  // Check scenarios router
  const scenariosRes = await callTRPC('scenarios.list');
  if (scenariosRes.status !== 200) {
    // Try alternative
    const scenariosRes2 = await callTRPC('scenarios.getAll');
    if (scenariosRes2.status !== 200) {
      console.log('❌ Failed to list scenarios (tried list and getAll)');
      console.log('   Trying to find correct procedure...');
    } else {
      const scenarios = scenariosRes2.data?.result?.data?.json || [];
      console.log(`✅ Found ${scenarios.length} scenarios`);
    }
  } else {
    const scenarios = scenariosRes.data?.result?.data?.json || [];
    console.log(`✅ Found ${scenarios.length} scenarios`);
  }
  
  console.log('\n=== QUIZ TEST ===\n');
  
  // Quiz requires auth, so just check the endpoint exists
  const quizRes = await callTRPC('quiz.getQuestions', { moduleId: 1 });
  if (quizRes.status === 401) {
    console.log('✅ Quiz endpoint exists (requires auth - expected)');
  } else if (quizRes.status === 200) {
    const questions = quizRes.data?.result?.data?.json || [];
    console.log(`✅ Quiz: ${questions.length} questions for module 1`);
  } else {
    console.log(`❌ Quiz endpoint error: ${quizRes.status}`);
  }
  
  console.log('\n=== SUMMARY ===\n');
  console.log(`Modules tested: ${modules.length}`);
  console.log(`Failures: ${moduleFailures.length}`);
  if (moduleFailures.length > 0) {
    console.log('\nFailed items:');
    for (const f of moduleFailures) {
      console.log(`  ❌ ${f.slug}${f.lesson ? '/' + f.lesson : ''}: ${f.error}`);
    }
  }
}

main().catch(console.error);
