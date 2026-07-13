# SCORM 1.2 / xAPI Architecture Decision Document

## Current Data Model Audit

The EASLearn platform currently tracks the following learner events in its database:

| Event | Table | Key Fields |
|-------|-------|------------|
| Lesson completion | `user_progress` | userId, lessonId, moduleId, completed, completedAt |
| Quiz attempt | `quiz_attempts` | userId, moduleId, score, totalQuestions, passed, answers, completedAt |
| Knowledge check completion | `knowledge_check_completions` | userId, lessonId, knowledgeCheckId, answeredCorrectly, selectedIndex, completedAt |
| Lab/simulator completion | `lab_scores` | userId, labId, correctAnswers, totalQuestions, scorePercent, completedAt |
| Scenario completion | `scenario_completions` | userId, scenarioSlug, score, maxScore, timeSeconds, completedAt |
| Certificate earned | `certificates` | userId, moduleId, certificateCode, quizScore, issuedAt |
| Certification level | `certification_levels` | userId, level, verificationCode, score, earnedAt |

All data needed for xAPI statements and SCORM reporting already exists in the database. No new tracking tables are required for the core events.

---

## Recommended Approach: Option 3 — Both SCORM 1.2 + xAPI

**Rationale:** Enterprise LMS environments are split between legacy SCORM 1.2 systems (Cornerstone, SAP SuccessFactors, older Workday) and modern xAPI-capable platforms (Docebo, TalentLMS, newer Workday). Supporting both maximizes addressable market.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EASLearn Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Learner Events (existing DB tables)                         │
│       │                                                      │
│       ├──► xAPI Statement Builder (server/xapi.ts)           │
│       │         │                                            │
│       │         ├──► Queue to configured LRS endpoint        │
│       │         └──► Local xapi_statements log table         │
│       │                                                      │
│       └──► SCORM Package Generator (server/scorm.ts)         │
│                 │                                            │
│                 └──► .zip download (imsmanifest.xml +        │
│                      SCORM runtime + lesson wrapper)         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Admin Dashboard                                             │
│       ├── Compliance Report (CSV/PDF export)                 │
│       ├── SCORM Export Log                                   │
│       └── xAPI LRS Connection Settings                       │
└─────────────────────────────────────────────────────────────┘
```

---

## xAPI Implementation Design

### Data Points Tracked

| Event | xAPI Verb | Object Type | Result Fields |
|-------|-----------|-------------|---------------|
| Course started | `http://adlnet.gov/expapi/verbs/initialized` | Activity (module) | — |
| Lesson completed | `http://adlnet.gov/expapi/verbs/completed` | Activity (lesson) | completion: true, duration |
| Quiz attempted | `http://adlnet.gov/expapi/verbs/attempted` | Activity (quiz) | score (scaled), completion |
| Quiz passed | `http://adlnet.gov/expapi/verbs/passed` | Activity (quiz) | score (scaled), success: true |
| Quiz failed | `http://adlnet.gov/expapi/verbs/failed` | Activity (quiz) | score (scaled), success: false |
| Lab completed | `http://adlnet.gov/expapi/verbs/completed` | Activity (lab) | score (scaled), duration |
| Course completed | `http://adlnet.gov/expapi/verbs/completed` | Activity (module) | completion: true |
| Certificate earned | `http://adlnet.gov/expapi/verbs/earned` | Activity (certificate) | — |

### Statement Structure

Each statement includes:
- **Actor:** `{ mbox: "mailto:{email}", name: "{name}" }`
- **Verb:** Standard ADL verb IRI
- **Object:** `{ id: "https://easlearn.org/modules/{slug}/lessons/{slug}", definition: { name, description, type } }`
- **Result:** `{ score: { scaled, raw, max }, completion, success, duration (ISO 8601) }`
- **Context:** `{ platform: "EASLearn", contextActivities: { parent: [module], grouping: [course path] } }`

### Delivery Mechanism

- Statements are generated server-side when learner events fire (in existing tRPC procedures)
- Statements are queued in a `xapi_statements` table with status (pending/sent/failed)
- A periodic job (or on-demand flush) sends pending statements to the configured LRS endpoint
- If no LRS is configured, statements are still logged locally for compliance export

---

## SCORM 1.2 Package Export Design

### Package Structure

```
module-slug.zip
├── imsmanifest.xml          (course structure, SCO definitions)
├── adlcp_rootv1p2.xsd       (SCORM 1.2 schema)
├── ims_xml.xsd
├── imscp_rootv1p1p2.xsd
├── imsmd_rootv1p2p1.xsd
├── shared/
│   └── scorm-api.js         (SCORM 1.2 API wrapper using scorm-again)
└── lessons/
    ├── lesson-1.html        (self-contained lesson content + quiz)
    ├── lesson-2.html
    └── ...
```

### SCORM Data Model Mapping

| EASLearn Data | SCORM 1.2 Element |
|---------------|-------------------|
| Lesson completion | `cmi.core.lesson_status` = "completed" or "passed" |
| Quiz score (%) | `cmi.core.score.raw` (0-100) |
| Time spent | `cmi.core.session_time` (HH:MM:SS) |
| Pass/fail | `cmi.core.lesson_status` = "passed" / "failed" |
| Bookmark | `cmi.core.lesson_location` |

### Generation Flow

1. Admin clicks "Export SCORM Package" for a specific module
2. Server fetches all lessons in that module from DB
3. Each lesson's markdown content is rendered to self-contained HTML
4. Quiz questions are embedded as interactive HTML forms with SCORM API calls
5. `imsmanifest.xml` is generated with proper SCO hierarchy
6. Everything is zipped and returned as a download

---

## New Database Tables Required

```sql
-- xAPI statement log (for audit and retry)
CREATE TABLE xapi_statements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  verb VARCHAR(100) NOT NULL,
  objectId VARCHAR(500) NOT NULL,
  objectName VARCHAR(255) NOT NULL,
  statementJson JSON NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending' NOT NULL,
  lrsEndpoint VARCHAR(500),
  sentAt TIMESTAMP NULL,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- SCORM export log (audit trail)
CREATE TABLE scorm_exports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teamId INT NOT NULL,
  exportedBy INT NOT NULL,
  moduleId INT NOT NULL,
  moduleTitle VARCHAR(255) NOT NULL,
  packageFormat ENUM('scorm12', 'xapi') DEFAULT 'scorm12' NOT NULL,
  fileSize INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- LRS connection settings (per team)
CREATE TABLE lrs_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teamId INT NOT NULL,
  endpointUrl VARCHAR(500) NOT NULL,
  authType ENUM('basic', 'oauth') DEFAULT 'basic' NOT NULL,
  username VARCHAR(255),
  password VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  lastSyncAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

---

## Implementation Complexity

| Component | Effort | Dependencies |
|-----------|--------|--------------|
| xAPI statement builder | Medium | None (pure JS) |
| xAPI LRS delivery | Low | fetch + retry logic |
| SCORM manifest generator | Medium | XML builder (fast-xml-parser) |
| SCORM lesson HTML wrapper | Medium | Markdown renderer + SCORM API JS |
| Admin UI (LRS settings, export buttons, logs) | Medium | Existing admin dashboard |
| Pricing gate | Low | Existing subscription tier check |
| **Total estimated effort** | **~6-8 hours** | |

---

## Decision

**Proceed with Option 3 (both SCORM 1.2 + xAPI).** The xAPI layer fires statements to a configured LRS for real-time tracking. The SCORM 1.2 export generates downloadable packages for legacy LMS import. Both are gated to Enterprise plan only.
