/**
 * Direct database audit - bypasses API rate limits
 * Tests: all modules exist, all lessons have content, no placeholder text
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(dbUrl);
  
  console.log('=== FULL DATABASE CONTENT AUDIT ===\n');
  
  // 1. Get all modules
  const [modules] = await connection.execute(
    'SELECT id, slug, title, path, totalLessons, isPublished FROM course_modules ORDER BY path, id'
  );
  console.log(`Total modules: ${modules.length}\n`);
  
  // 2. Check each module has lessons
  const issues = [];
  let totalLessons = 0;
  let emptyLessons = 0;
  let placeholderLessons = 0;
  
  for (const mod of modules) {
    const [lessons] = await connection.execute(
      'SELECT id, slug, title, LENGTH(content) as content_length, LEFT(content, 200) as preview, isPublished FROM course_lessons WHERE moduleId = ? ORDER BY orderIndex',
      [mod.id]
    );
    
    totalLessons += lessons.length;
    
    if (lessons.length === 0) {
      issues.push({
        type: 'NO_LESSONS',
        module: mod.slug,
        title: mod.title,
        url: `/courses/${mod.slug}`,
        issue: 'Module has zero lessons'
      });
      console.log(`❌ ${mod.slug} (${mod.title}) - NO LESSONS`);
      continue;
    }
    
    let moduleOk = true;
    for (const lesson of lessons) {
      if (!lesson.content_length || lesson.content_length < 50) {
        emptyLessons++;
        issues.push({
          type: 'EMPTY_CONTENT',
          module: mod.slug,
          lesson: lesson.slug,
          title: lesson.title,
          url: `/courses/${mod.slug}/${lesson.slug}`,
          issue: `Empty or very short content (${lesson.content_length || 0} chars)`
        });
        moduleOk = false;
        console.log(`  ❌ ${lesson.slug} - EMPTY (${lesson.content_length || 0} chars)`);
      }
      
      // Check for placeholder content
      const preview = lesson.preview || '';
      const placeholderPatterns = [
        'Lorem ipsum',
        'TODO:',
        'PLACEHOLDER',
        'Coming soon',
        '[Content goes here]',
        'This lesson is under development'
      ];
      
      for (const pattern of placeholderPatterns) {
        if (preview.toLowerCase().includes(pattern.toLowerCase())) {
          placeholderLessons++;
          issues.push({
            type: 'PLACEHOLDER',
            module: mod.slug,
            lesson: lesson.slug,
            title: lesson.title,
            url: `/courses/${mod.slug}/${lesson.slug}`,
            issue: `Contains placeholder text: "${pattern}"`
          });
          moduleOk = false;
          console.log(`  ⚠️  ${lesson.slug} - PLACEHOLDER: "${pattern}"`);
        }
      }
      
      if (!lesson.isPublished) {
        issues.push({
          type: 'UNPUBLISHED',
          module: mod.slug,
          lesson: lesson.slug,
          title: lesson.title,
          url: `/courses/${mod.slug}/${lesson.slug}`,
          issue: 'Lesson is not published'
        });
        moduleOk = false;
        console.log(`  ⚠️  ${lesson.slug} - UNPUBLISHED`);
      }
    }
    
    if (moduleOk) {
      console.log(`✅ ${mod.slug} - ${lessons.length} lessons, all have content`);
    } else {
      console.log(`❌ ${mod.slug} - ${lessons.length} lessons, HAS ISSUES`);
    }
    
    // Check totalLessons metadata mismatch
    if (mod.totalLessons !== lessons.length) {
      issues.push({
        type: 'METADATA_MISMATCH',
        module: mod.slug,
        title: mod.title,
        url: `/courses/${mod.slug}`,
        issue: `totalLessons=${mod.totalLessons} but actual=${lessons.length}`
      });
    }
    
    if (!mod.isPublished) {
      issues.push({
        type: 'UNPUBLISHED_MODULE',
        module: mod.slug,
        title: mod.title,
        url: `/courses/${mod.slug}`,
        issue: 'Module is not published'
      });
    }
  }
  
  // 3. Check scenarios
  console.log('\n=== SIMULATOR SCENARIOS ===\n');
  const [scenarios] = await connection.execute(
    'SELECT id, title, description, isPublished, LENGTH(steps) as steps_length FROM scenarios ORDER BY id'
  );
  console.log(`Total scenarios: ${scenarios.length}`);
  
  for (const s of scenarios) {
    if (!s.steps_length || s.steps_length < 10) {
      issues.push({
        type: 'EMPTY_SCENARIO',
        module: 'simulator',
        title: s.title,
        url: '/simulator',
        issue: `Scenario "${s.title}" has empty steps (${s.steps_length || 0} chars)`
      });
      console.log(`  ❌ ${s.title} - EMPTY STEPS`);
    } else {
      console.log(`  ✅ ${s.title} - ${s.steps_length} chars`);
    }
  }
  
  // 4. Check tutorials
  console.log('\n=== TUTORIALS ===\n');
  const [tutorialsData] = await connection.execute(
    'SELECT id, slug, title, isPublished, LENGTH(content) as content_length FROM tutorials ORDER BY id'
  );
  console.log(`Total tutorials: ${tutorialsData.length}`);
  for (const t of tutorialsData) {
    if (!t.content_length || t.content_length < 50) {
      issues.push({
        type: 'EMPTY_TUTORIAL',
        module: 'tutorials',
        lesson: t.slug,
        title: t.title,
        url: `/tutorials/${t.slug}`,
        issue: `Empty tutorial content (${t.content_length || 0} chars)`
      });
      console.log(`  ❌ ${t.slug} - EMPTY`);
    }
  }
  
  // 5. Check assessments
  console.log('\n=== ASSESSMENTS ===\n');
  const [assessments] = await connection.execute(
    'SELECT id, token, candidateName, status FROM assessments ORDER BY id'
  );
  console.log(`Total assessments: ${assessments.length}`);
  
  // Summary
  console.log('\n=== AUDIT SUMMARY ===\n');
  console.log(`Modules: ${modules.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Empty lessons: ${emptyLessons}`);
  console.log(`Placeholder lessons: ${placeholderLessons}`);
  console.log(`Scenarios: ${scenarios.length}`);
  console.log(`Tutorials: ${tutorialsData.length}`);
  console.log(`Assessments: ${assessments.length}`);
  console.log(`\nTotal issues found: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n=== ALL ISSUES ===\n');
    console.log('| Type | Module | Lesson | URL | Issue |');
    console.log('|------|--------|--------|-----|-------|');
    for (const i of issues) {
      console.log(`| ${i.type} | ${i.module} | ${i.lesson || '-'} | ${i.url} | ${i.issue} |`);
    }
  }
  
  await connection.end();
}

main().catch(e => { console.error(e); process.exit(1); });
