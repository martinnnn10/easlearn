/**
 * Load lesson content from generated markdown files into the database
 * Run: node server/load-content.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Mapping: index in parallel results -> [module_slug, lesson_slug]
const mapping = [
  // VFD Module (indices 0-4, lesson slugs 2-6 since lesson 1 was done separately)
  ['powerflex-vfd', 'powerflex-parameter-groups'],
  ['powerflex-vfd', 'basic-programming'],
  ['powerflex-vfd', 'fault-codes-diagnostics'],
  ['powerflex-vfd', 'common-failures'],
  ['powerflex-vfd', 'advanced-features'],
  // PLC Module (indices 5-10)
  ['plc-fundamentals', 'plc-architecture'],
  ['plc-fundamentals', 'ladder-logic-basics'],
  ['plc-fundamentals', 'io-troubleshooting'],
  ['plc-fundamentals', 'timers-counters'],
  ['plc-fundamentals', 'communication-faults'],
  ['plc-fundamentals', 'program-troubleshooting'],
  // Fluid Power (indices 11-16)
  ['fluid-power', 'hydraulic-fundamentals'],
  ['fluid-power', 'pneumatic-fundamentals'],
  ['fluid-power', 'circuit-reading'],
  ['fluid-power', 'valve-troubleshooting'],
  ['fluid-power', 'pressure-diagnostics'],
  ['fluid-power', 'fluid-power-maintenance'],
  // Motors (indices 17-22)
  ['motors-controls', 'motor-theory'],
  ['motors-controls', 'motor-control-circuits'],
  ['motors-controls', 'starter-troubleshooting'],
  ['motors-controls', 'overload-protection'],
  ['motors-controls', 'single-three-phase'],
  ['motors-controls', 'motor-testing'],
  // Alignment (indices 23-27)
  ['alignment', 'alignment-fundamentals'],
  ['alignment', 'dial-indicator-method'],
  ['alignment', 'laser-alignment'],
  ['alignment', 'soft-foot'],
  ['alignment', 'thermal-growth'],
  // PM (indices 28-33)
  ['preventative-maintenance', 'pm-program-design'],
  ['preventative-maintenance', 'vibration-analysis'],
  ['preventative-maintenance', 'thermography'],
  ['preventative-maintenance', 'lubrication'],
  ['preventative-maintenance', 'condition-monitoring'],
  ['preventative-maintenance', 'failure-analysis'],
];

// File paths from the parallel generation results
const files = [
  '/home/ubuntu/lesson_content/0_GLGcgnbDWVT3LeS0fvJvXG_1778288735379_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/1_0J7Ja7jEv9ACv9YCOkDdod_1778288731568_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/2_vI5WsM9VNPHlq9cBuQG5Sz_1778288748211_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/3_oY9MruTp9jbX3uAqf55tVg_1778288698301_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl92ZmRfZmFpbHVyZXM.md',
  '/home/ubuntu/lesson_content/4_gQH8rpCCYENtVKnjyiOyE3_1778288720521_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/5_hdArcxykS45A3SDln8mlKz_1778288711693_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/6_FGhr6sx760U0RbtDWxFNtj_1778288705584_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9wbGNfbGFkZGVyX2xvZ2lj.md',
  '/home/ubuntu/lesson_content/7_6svI9izSMoDabEgIxKo6OL_1778288710652_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/8_4TBMsQLv5uIin67cWVGNTl_1778288760593_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/9_CUdOKOdHQY26hRpVVBFyEM_1778288810058_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/10_A1WcA54mCWdZYuW7giZ95e_1778288741319_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/11_R1bil1kMyA1RJGPvTtmwJp_1778288726546_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/12_dG4ixbDaLh2kFezcX9GqED_1778288707887_na1fn_L2hvbWUvdWJ1bnR1L3BuZXVtYXRpY19mdW5kYW1lbnRhbHM.md',
  '/home/ubuntu/lesson_content/13_fHh0h5Kuh1Peler8y7SiMN_1778288742090_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/14_jHK2M37M6T0ZN3rPoM7dRW_1778289555369_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/15_xWnXCrLhN0fp9REPA8E66i_1778288724907_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/16_atOHUOAkI1vW5XTk2RUNyU_1778288731892_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/17_QhmXNXAm6IashDEO8VQhzv_1778288711043_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9hY19kY19tb3Rvcl90aGVvcnk.md',
  '/home/ubuntu/lesson_content/18_O4y2Tcmj6KgOqBLB4l111P_1778288713774_na1fn_L2hvbWUvdWJ1bnR1L21vdG9yX2NvbnRyb2xfbGVzc29u.md',
  '/home/ubuntu/lesson_content/19_7GNMnKTcjPNh0fVqiIEluD_1778288719394_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/20_iuL7kvvZTT23GhzTrxzVNl_1778288978206_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/21_Ufx1I6gdiNR3nz4Lyeb3TX_1778288759426_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/22_V8lAATneKqgSshB6ACD6Gh_1778289076563_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/23_xXh1yUYCIoKYjLTMWYEqcn_1778288801905_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/24_e7Z7ZMRHb0UzPAeZyxBqY2_1778288780705_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9kaWFsX2luZGljYXRvcg.md',
  '/home/ubuntu/lesson_content/25_F3UiqBTH1cL2IEvyeixTEF_1778288751410_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/26_ZCXxHUDHVwVbDIWltbMjNO_1778288760768_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/27_uhQ9JAkyZihfk0snHjTd6A_1778288808828_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/28_IUNGFYRjzGZ9LYa8s70kOV_1778288768681_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9wbV9wcm9ncmFt.md',
  '/home/ubuntu/lesson_content/29_OvEqWJ4UfJBKx7ppqAJEPn_1778288794865_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/30_IUEMcJ5Hq4WTBM8FBWCwyE_1778288763093_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/31_pkY8mvTuGljoXV8onKb4Pn_1778288780048_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/32_SAvfJ573D0l9i6KeZwlt83_1778288776590_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
  '/home/ubuntu/lesson_content/33_7s6mmHNimKSyeyMeAeCHsk_1778288818556_na1fn_L2hvbWUvdWJ1bnR1L2xlc3Nvbl9jb250ZW50.md',
];

// Also load VFD lesson 1 from the manually created file
const vfdLesson1Content = fs.readFileSync('/home/ubuntu/eas-platform/content/vfd-1.md', 'utf-8');

console.log('Loading lesson content into database...');

// First, update VFD lesson 1
const [vfdMod] = await connection.execute('SELECT id FROM course_modules WHERE slug = ?', ['powerflex-vfd']);
if (vfdMod.length > 0) {
  await connection.execute(
    'UPDATE course_lessons SET content = ? WHERE moduleId = ? AND slug = ?',
    [vfdLesson1Content, vfdMod[0].id, 'vfd-fundamentals']
  );
  console.log('  Updated: powerflex-vfd / vfd-fundamentals');
}

// Now load all parallel-generated content
for (let i = 0; i < mapping.length; i++) {
  const [moduleSlug, lessonSlug] = mapping[i];
  const filePath = files[i];
  
  if (!fs.existsSync(filePath)) {
    console.error(`  MISSING: ${filePath}`);
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Get module ID
  const [mods] = await connection.execute('SELECT id FROM course_modules WHERE slug = ?', [moduleSlug]);
  if (mods.length === 0) {
    console.error(`  Module not found: ${moduleSlug}`);
    continue;
  }
  
  const moduleId = mods[0].id;
  
  // Update lesson content
  const [result] = await connection.execute(
    'UPDATE course_lessons SET content = ? WHERE moduleId = ? AND slug = ?',
    [content, moduleId, lessonSlug]
  );
  
  if (result.affectedRows > 0) {
    console.log(`  Updated: ${moduleSlug} / ${lessonSlug}`);
  } else {
    console.error(`  NOT FOUND: ${moduleSlug} / ${lessonSlug}`);
  }
}

console.log('\nDone! All lesson content loaded.');
await connection.end();
