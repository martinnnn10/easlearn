import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(dbUrl);
  
  // Get all modules
  const [modules] = await connection.execute(
    'SELECT id, slug, title, path, totalLessons, isPublished, orderIndex FROM course_modules ORDER BY path, orderIndex'
  );
  
  console.log(`\n=== COURSE MODULES (${modules.length} total) ===\n`);
  console.log('ID | Slug | Title | Path | TotalLessons | Published');
  console.log('-'.repeat(120));
  for (const m of modules) {
    console.log(`${m.id} | ${m.slug} | ${m.title} | ${m.path} | ${m.totalLessons} | ${m.isPublished}`);
  }
  
  // Get all lessons with content length
  const [lessons] = await connection.execute(
    `SELECT cl.id, cl.moduleId, cl.slug, cl.title, cl.orderIndex, cl.isPublished, 
     LENGTH(cl.content) as contentLength,
     LEFT(cl.content, 100) as contentPreview
     FROM course_lessons cl 
     ORDER BY cl.moduleId, cl.orderIndex`
  );
  
  console.log(`\n\n=== LESSONS (${lessons.length} total) ===\n`);
  
  // Group by module
  const lessonsByModule = {};
  for (const l of lessons) {
    if (!lessonsByModule[l.moduleId]) lessonsByModule[l.moduleId] = [];
    lessonsByModule[l.moduleId].push(l);
  }
  
  // Check for issues
  const issues = [];
  
  for (const m of modules) {
    const moduleLessons = lessonsByModule[m.id] || [];
    console.log(`\n--- Module: ${m.title} (ID: ${m.id}, slug: ${m.slug}) ---`);
    console.log(`  Declared lessons: ${m.totalLessons} | Actual lessons: ${moduleLessons.length}`);
    
    if (m.totalLessons !== moduleLessons.length) {
      issues.push({
        type: 'LESSON_COUNT_MISMATCH',
        course: m.title,
        module: m.slug,
        expected: m.totalLessons,
        actual: moduleLessons.length,
        url: `/courses/${m.slug}`
      });
    }
    
    for (const l of moduleLessons) {
      const contentLen = l.contentLength || 0;
      const hasContent = contentLen > 50; // More than 50 chars means real content
      const isPlaceholder = l.contentPreview && (
        l.contentPreview.includes('placeholder') ||
        l.contentPreview.includes('coming soon') ||
        l.contentPreview.includes('TODO') ||
        l.contentPreview.includes('Lorem ipsum') ||
        l.contentPreview.includes('Content will be')
      );
      
      if (!hasContent) {
        issues.push({
          type: 'EMPTY_LESSON',
          course: m.title,
          module: m.slug,
          lesson: l.title,
          lessonSlug: l.slug,
          contentLength: contentLen,
          url: `/courses/${m.slug}/${l.slug}`
        });
      }
      
      if (isPlaceholder) {
        issues.push({
          type: 'PLACEHOLDER_CONTENT',
          course: m.title,
          module: m.slug,
          lesson: l.title,
          lessonSlug: l.slug,
          preview: l.contentPreview,
          url: `/courses/${m.slug}/${l.slug}`
        });
      }
      
      console.log(`  ${l.orderIndex}. ${l.title} (${l.slug}) - ${contentLen} chars ${!hasContent ? '⚠️ EMPTY' : ''} ${isPlaceholder ? '⚠️ PLACEHOLDER' : ''}`);
    }
    
    if (moduleLessons.length === 0) {
      issues.push({
        type: 'NO_LESSONS',
        course: m.title,
        module: m.slug,
        url: `/courses/${m.slug}`
      });
    }
  }
  
  console.log(`\n\n=== ISSUES FOUND (${issues.length}) ===\n`);
  if (issues.length === 0) {
    console.log('No issues found! All courses have content.');
  } else {
    for (const issue of issues) {
      console.log(`[${issue.type}]`);
      console.log(`  Course: ${issue.course}`);
      console.log(`  Module: ${issue.module}`);
      if (issue.lesson) console.log(`  Lesson: ${issue.lesson}`);
      if (issue.lessonSlug) console.log(`  Lesson Slug: ${issue.lessonSlug}`);
      console.log(`  URL: ${issue.url}`);
      if (issue.expected) console.log(`  Expected: ${issue.expected} | Actual: ${issue.actual}`);
      if (issue.contentLength !== undefined) console.log(`  Content Length: ${issue.contentLength}`);
      if (issue.preview) console.log(`  Preview: ${issue.preview}`);
      console.log('');
    }
  }
  
  await connection.end();
}

main().catch(console.error);
