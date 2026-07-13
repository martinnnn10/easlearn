import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const tutorials = [
  {
    title: "PowerFlex 525 Fault Codes: Complete Reference Guide & Troubleshooting Steps",
    slug: "powerflex-525-fault-codes-complete-reference-guide",
    metaDescription: "Complete guide to PowerFlex 525 fault codes. Learn practical troubleshooting steps for F004, F005, F007, F012, and more for industrial maintenance technicians.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["PowerFlex 525", "fault codes", "VFD", "troubleshooting"]),
    contentFile: "/home/ubuntu/content/0_mi7PzeuFvtxP8rT2MSO410_1778347916371_na1fn_L2hvbWUvdWJ1bnR1L3Bvd2VyZmxleF81MjVfZmF1bHRfY29kZXM.md"
  },
  {
    title: "Troubleshooting PowerFlex 525 F004 UnderVoltage Faults",
    slug: "troubleshooting-powerflex-525-f004-undervoltage-faults",
    metaDescription: "Complete guide to troubleshooting PowerFlex 525 F004 UnderVoltage faults. Learn practical diagnostic steps, parameter checks, and safety tips for technicians.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 8,
    tags: JSON.stringify(["PowerFlex 525", "fault codes", "VFD", "troubleshooting", "F004"]),
    contentFile: "/home/ubuntu/content/1_NDhZa9TngykbyM77QOlsKT_1778347882397_na1fn_L2hvbWUvdWJ1bnR1L3BmNTI1X2YwMDRfdHV0b3JpYWw.md"
  },
  {
    title: "Troubleshooting PowerFlex 525 F005 OverVoltage Faults",
    slug: "troubleshooting-powerflex-525-f005-overvoltage-faults",
    metaDescription: "Learn how to troubleshoot and fix the PowerFlex 525 F005 OverVoltage fault. Step-by-step guide for maintenance technicians with practical diagnostic tips.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["PowerFlex 525", "F005", "OverVoltage", "VFD", "troubleshooting"]),
    contentFile: "/home/ubuntu/content/2_RfTVPVuiY8osBXZmvkK0cK_1778348675961_na1fn_L2hvbWUvdWJ1bnR1L3R1dG9yaWFs.md"
  },
  {
    title: "Troubleshooting PowerFlex 525 F002 Overcurrent Faults",
    slug: "troubleshooting-powerflex-525-f002-overcurrent-faults",
    metaDescription: "Complete guide to troubleshooting PowerFlex 525 F002 Overcurrent faults. Learn step-by-step diagnosis, parameter checks, and motor testing for maintenance techs.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 8,
    tags: JSON.stringify(["PowerFlex 525", "fault codes", "VFD", "troubleshooting", "F002"]),
    contentFile: "/home/ubuntu/content/3_8nUtn52I0Q5GXRl2zLxiEw_1778347880634_na1fn_L2hvbWUvdWJ1bnR1L3BmNTI1X2YwMDJfdHV0b3JpYWw.md"
  },
  {
    title: "How to Replace a Failed PowerFlex 525 VFD and Upload Parameters",
    slug: "how-to-replace-failed-powerflex-525-vfd-upload-parameters",
    metaDescription: "Learn how to safely diagnose, replace, and upload parameters for a failed Allen-Bradley PowerFlex 525 VFD. A practical guide for maintenance technicians.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["PowerFlex 525", "fault codes", "VFD", "troubleshooting", "replacement"]),
    contentFile: "/home/ubuntu/content/4_psucL6sN4WH3LZGi5HTO0t_1778348618255_na1fn_L2hvbWUvdWJ1bnR1L3Bvd2VyZmxleF81MjVfcmVwbGFjZW1lbnQ.md"
  },
  {
    title: "PowerFlex 525 EtherNet/IP Communication Faults: Diagnosis & Resolution",
    slug: "powerflex-525-ethernet-ip-communication-faults-diagnosis-resolution",
    metaDescription: "Complete guide to diagnosing and resolving PowerFlex 525 EtherNet/IP communication faults like F073 and F074. Learn practical troubleshooting steps for technicians.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["PowerFlex 525", "fault codes", "VFD", "troubleshooting", "EtherNet/IP"]),
    contentFile: "/home/ubuntu/content/5_3HF8vABxBdl9FXIjinhPya_1778347906577_na1fn_L2hvbWUvdWJ1bnR1L3R1dG9yaWFs.md"
  },
  {
    title: "VFD Output Transistor (IGBT) Failure: Symptoms, Testing & Replacement",
    slug: "vfd-output-transistor-igbt-failure-symptoms-testing-replacement",
    metaDescription: "Complete guide to diagnosing and troubleshooting VFD Output Transistor (IGBT) failures. Learn symptoms, static testing steps, and root causes for maintenance.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["VFD", "IGBT", "troubleshooting", "PowerFlex", "fault codes"]),
    contentFile: "/home/ubuntu/content/6_lKCA2j1KvHslSDspylAMTb_1778347888754_na1fn_L2hvbWUvdWJ1bnR1L3ZmZF9pZ2J0X2ZhaWx1cmU.md"
  },
  {
    title: "Understanding V/Hz vs. Sensorless Vector vs. Closed-Loop Vector Control",
    slug: "understanding-vhz-vs-sensorless-vector-vs-closed-loop-vector-control",
    metaDescription: "Complete guide to troubleshooting V/Hz, Sensorless Vector, and Closed-Loop Vector control methods on VFDs. Learn practical diagnosis for maintenance technicians.",
    difficulty: "intermediate",
    category: "VFD Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["VFD", "motor control", "troubleshooting", "PowerFlex", "encoder"]),
    contentFile: "/home/ubuntu/content/7_jAZJUVyOT2061ncKiY2w19_1778348571514_na1fn_L2hvbWUvdWJ1bnR1L3R1dG9yaWFsX3ZmZF9jb250cm9s.md"
  },
  {
    title: "How to Trace Ladder Logic Backward from a Dead Output in Studio 5000",
    slug: "how-to-trace-ladder-logic-backward-dead-output-studio-5000",
    metaDescription: "Learn how to troubleshoot a dead output in Studio 5000 by tracing ladder logic backward. A practical guide for industrial maintenance technicians.",
    difficulty: "intermediate",
    category: "PLC Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["Studio 5000", "ladder logic", "troubleshooting", "PLC", "maintenance"]),
    contentFile: "/home/ubuntu/content/8_DssCzETYbvCGfIaAvZeZ4q_1778347896057_na1fn_L2hvbWUvdWJ1bnR1L3R1dG9yaWFs.md"
  },
  {
    title: "Allen-Bradley I/O Module Faulted: Common Causes & Recovery Steps",
    slug: "allen-bradley-io-module-faulted-common-causes-recovery-steps",
    metaDescription: "A practical troubleshooting guide for maintenance technicians on diagnosing and recovering from Allen-Bradley I/O module faults, including common codes and steps.",
    difficulty: "intermediate",
    category: "PLC Troubleshooting",
    readingTime: 10,
    tags: JSON.stringify(["Allen-Bradley", "I/O module", "fault codes", "troubleshooting", "PLC"]),
    contentFile: "/home/ubuntu/content/9_3CQ9nplbal7kbLV2gVDPsk_1778347904393_na1fn_L2hvbWUvdWJ1bnR1L2FiX2lvX21vZHVsZV9mYXVsdGVk.md"
  }
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  for (const tutorial of tutorials) {
    const content = readFileSync(tutorial.contentFile, 'utf-8');
    
    await connection.execute(
      `INSERT INTO tutorials (title, slug, metaDescription, difficulty, category, content, readingTime, tags, isPublished, publishedAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
       ON DUPLICATE KEY UPDATE content = VALUES(content), metaDescription = VALUES(metaDescription), tags = VALUES(tags), updatedAt = NOW()`,
      [tutorial.title, tutorial.slug, tutorial.metaDescription, tutorial.difficulty, tutorial.category, content, tutorial.readingTime, tutorial.tags]
    );
    
    console.log(`✓ Seeded: ${tutorial.title}`);
  }
  
  await connection.end();
  console.log('\n✅ All 10 tutorials seeded successfully!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
