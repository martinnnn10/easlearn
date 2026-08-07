# Manager Access Audit — EASLearn Platform

**Date:** 2026-07-26  
**Verdict:** PARTIALLY WORKS — critical gaps prevent real customer deployment

---

## 1. Current Authentication Architecture

| Layer | Implementation | Status |
|-------|---------------|--------|
| Identity provider | Manus OAuth (external) + email/password (local) | Working |
| Session | JWT cookie signed with `JWT_SECRET`, verified in `server/_core/context.ts` | Working |
| Protected routes | `protectedProcedure` middleware injects `ctx.user` | Working |
| Role field | `users.role` enum: `admin` or `user` | Working |
| Team role field | `team_members.role` enum: `owner`, `admin`, `manager`, `member` | Working |

Authentication itself is solid. Users can sign up, log in, and maintain sessions. The `protectedProcedure` middleware correctly gates all sensitive tRPC procedures.

---

## 2. Existing Roles

**Global roles** (on `users` table):
- `admin` — platform owner (you), can access `/admin` routes
- `user` — everyone else

**Team roles** (on `team_members` table):
- `owner` — created the team, billing admin
- `admin` — can manage members
- `manager` — can view reports
- `member` — learner

The team role system exists in the schema and is enforced by `managedMemberIds()` in `server/competencyGraph.ts`, which checks for `owner`, `admin`, or `manager` roles before returning the list of managed user IDs.

---

## 3. Existing Organization/Team Schema

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `teams` | Organization/company container | `id`, `name`, `ownerId`, `maxSeats`, `usedSeats`, `domain`, `industry`, `isActive` |
| `team_members` | Membership join table | `teamId`, `userId`, `role` (owner/admin/manager/member), `invitedEmail`, `inviteToken`, `status` (pending/active/removed) |
| `assigned_paths` | Training assignments | `teamId`, `userId`, `moduleId`, `assignedBy`, `dueAt`, `completed`, `completedAt` |
| `users.companyId` | Nullable FK to a company | Currently unused in any query |

There is **no** separate `organizations` table. The `teams` table serves as both the organization and the team. There is no concept of multiple teams within one organization — each `teams` row is a flat group.

---

## 4. Existing Manager Routes

| Route | Page | What It Shows |
|-------|------|---------------|
| `/manager` | `ManagerDashboard.tsx` | **Logged out:** sample-data preview (fake names, fake scores). **Logged in + is manager:** real Assessment Spine readiness data for managed team members. |
| `/manage` | `ManagerHub.tsx` | Hub page linking to competency, assignments, compliance export. Requires auth + manager role. |
| `/team` | `Team.tsx` | Team member list, invite form, remove member. Requires auth + team ownership. |
| `/team/invite/:token` | `TeamInvite.tsx` | Accept-invite flow. |
| `/team/progress` | `TeamProgress.tsx` | Aggregate team learning progress. |
| `/team/skills` | `SkillMatrix.tsx` | Per-member skill domain scores. |

---

## 5. Existing Invitation Functionality

| Feature | Status | How It Works |
|---------|--------|--------------|
| Create invite | **Working** | `team.createInvite` — owner enters email, system generates a 32-char token, returns a link. Link is copied to clipboard (no email sent). |
| Accept invite | **Working** | `team.acceptInvite` — user with the token link logs in, token is consumed, `team_members` row flips to `active`, user gets `team` subscription tier. |
| Remove member | **Working** | `team.removeMember` — owner-only, sets status to `removed`. |
| Resend invite | **Missing** | No procedure exists. |
| Cancel invite | **Missing** | No procedure exists. |
| Deactivate user | **Missing** | No procedure exists. |
| Change role | **Missing** | No procedure to change a member's role (e.g., promote member → manager). |
| Email notification on invite | **Missing** | Invite link is only clipboard-copied; no email is sent to the invitee. |

---

## 6. Current Database Tables Involved

The full chain of tables that participate in the manager workflow:

```
teams → team_members → users
                     → assigned_paths → course_modules / course_lessons
                     → user_progress
                     → scenario_completions
                     → fault_competency_attempts / fault_competency_mastery
                     → competency_evidence (Assessment Spine)
                     → competency_validations (manager attestations)
                     → open_response_attempts
                     → spaced_review_items
```

---

## 7. What Already Works (Live Today)

| Capability | Works? | Evidence |
|------------|--------|----------|
| Owner creates a team (on checkout) | **Yes** | Team is created during Stripe team-plan checkout via `checkout.session.completed` webhook. |
| Owner invites members by email | **Yes** | `team.createInvite` generates token link. |
| Member accepts invite and joins | **Yes** | `team.acceptInvite` activates membership. |
| Owner removes a member | **Yes** | `team.removeMember` sets status to `removed`. |
| Manager sees real team readiness | **Yes** | `assessment.teamReadiness` returns real Assessment Spine data for all members in teams where caller has owner/admin/manager role. |
| Manager validates a competency | **Yes** | `competencyGraph.validate` inserts a `competency_validations` row after verifying the caller manages a team containing the target user. |
| Manager assigns training | **Yes** | `assignments.assign` assigns a course module to team members with a due date. |
| Manager views assignment status | **Yes** | `assignments.teamAssignments` returns all assignments with live completion %, overdue flags. |
| Manager exports compliance CSV | **Yes** | `ManagerHub.tsx` exports training records as CSV. |
| Tenant isolation (team scoping) | **Partial** | `managedMemberIds()` only returns users in teams where the caller has a management role. A manager cannot see users from other teams. However, there is no organization-level isolation — if a user is a manager in two teams, they see both. |

---

## 8. What Is Only Demo/Sample UI

| Item | Reality |
|------|---------|
| `/manager` when logged out | Shows `ManagerDashboardPreview` component with hardcoded fake team data (fake names, fake scores). Clearly labeled "sample data" but is the only thing a logged-out visitor sees. |
| `/manage` when not a manager | Shows a "Sign in as a team manager" prompt. No sample data. |

The logged-in manager experience at `/manager` and `/manage` shows **real data** — it is not a demo. The confusion arises because the logged-out fallback shows sample data, making it appear that the entire page is fake.

---

## 9. Security and Tenant-Isolation Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| No organization wrapper | Medium | Teams are flat. There is no concept of "Organization X has teams A, B, C." A company with multiple facilities/shifts cannot model that hierarchy. |
| No multi-team scoping for managers | Medium | A manager is assigned to a team, but cannot be scoped to a subset (e.g., "night shift only"). They see all members in all teams they manage. |
| No facility/shift/department fields | Low | `teams` has no `facility`, `shift`, or `department` column. Filtering by these is impossible. |
| No role-change procedure | High | Once a member is added, their role cannot be changed without direct SQL. Owner cannot promote a member to manager or demote a manager to member through the UI. |
| No deactivation (soft-disable) | Medium | `removeMember` sets status to `removed`, but there is no "deactivated" state that preserves history while blocking access. |
| No invite email delivery | Medium | Invites are clipboard-only. The invitee never receives an email. |
| No resend/cancel invite | Low | Pending invites cannot be resent or revoked through the UI. |
| No per-technician detail drill-down | Medium | Manager sees a summary table but cannot click into a technician to see their full attempt history, decision logs, or individual evidence timeline. |
| No filtering (team/facility/shift/domain) | Medium | The manager dashboard shows all managed members in one flat list with no filters. |
| Demo and production share the same route | Low | `/manager` serves both sample-data preview (logged out) and real data (logged in). This is confusing but not a security issue — real data is never exposed to unauthenticated users. |

---

## 10. Exact Missing Pieces Required for Real Manager Access

### Critical (blocks a real customer from using the system):

1. **Role management UI** — Owner must be able to change a team member's role (member → manager, manager → member) from the `/team` page.
2. **Invite email delivery** — When an invite is created, the system must email the invitee with the accept link (Resend is already configured).
3. **Resend / cancel invite** — Owner must be able to resend a pending invite or revoke it.
4. **Per-technician detail page** — Manager clicks a technician name → sees full evidence timeline, attempt history, safety flags, methodology scores.

### Important (needed for a professional pilot):

5. **Organization → Teams hierarchy** — Add an `organizations` table so one company can have multiple teams (shifts, facilities, departments).
6. **Facility / shift / department fields** on teams for filtering.
7. **Manager dashboard filters** — Filter by team, skill domain, readiness level, overdue training.
8. **Deactivate user** — Soft-disable that blocks login but preserves records.
9. **Activity timestamp** — Show "last active" per technician so managers know who is engaged.

### Nice-to-have (polish for enterprise):

10. **Audit log** — Record who changed what (role changes, validations, assignments).
11. **Manager notifications** — Email when a technician completes training, flags safety risk, or goes overdue.
12. **Separate `/manager/demo` route** — Move sample-data preview to a dedicated demo URL.

---

## 11. Recommended Implementation Plan

### Phase 1 — Role Management + Invite Email (2–3 days)

- Add `team.changeRole` procedure (owner-only, validates target is in their team).
- Add `team.resendInvite` and `team.cancelInvite` procedures.
- Wire invite email delivery through existing Resend integration.
- Add role-change UI to `/team` page (dropdown per member).
- Add resend/cancel buttons to pending invites.

### Phase 2 — Technician Detail Page (3–4 days)

- Create `/manager/technician/:userId` route.
- Backend: `assessment.technicianDetail` procedure — returns full evidence timeline, attempt history, safety flags, methodology scores, assigned training, completion status.
- Frontend: Timeline view, competency radar, attempt cards with decision logs.
- Link from manager dashboard table rows.

### Phase 3 — Dashboard Filters + Activity (2 days)

- Add `lastActivityDate` display (already tracked in `user_streaks`).
- Add client-side filters: skill domain, readiness level, overdue training.
- Add team selector if manager manages multiple teams.

### Phase 4 — Organization Hierarchy (3–4 days)

- Create `organizations` table (id, name, ownerId, domain, industry).
- Add `organizationId` FK to `teams`.
- Migrate existing teams to belong to an auto-created organization per owner.
- Update `managedMemberIds` to respect org boundaries.
- Add facility/shift/department fields to teams.
- Update UI to show org → team hierarchy.

### Phase 5 — Separate Demo Route + Polish (1–2 days)

- Move sample-data preview to `/manager/demo`.
- Make `/manager` redirect to login if unauthenticated.
- Add deactivate-user procedure.
- Add audit log table and basic event recording.

**Total estimated effort: 11–15 working days.**

---

## 12. Estimated Effort

| Phase | Days | Dependencies |
|-------|------|--------------|
| Role management + invite email | 2–3 | None |
| Technician detail page | 3–4 | None |
| Dashboard filters + activity | 2 | None |
| Organization hierarchy | 3–4 | Phase 1 |
| Demo separation + polish | 1–2 | Phase 4 |
| **Total** | **11–15** | |

---

## 13. Files and Database Migrations Required

### Server files to create or modify:

| File | Action |
|------|--------|
| `server/routers.ts` (team section) | Add `changeRole`, `resendInvite`, `cancelInvite`, `deactivateMember` |
| `server/assessment.ts` | Add `technicianDetail` procedure |
| `server/email.ts` | Add `sendTeamInviteEmail()` function |
| `drizzle/schema.ts` | Add `organizations` table, add `organizationId` to `teams`, add `facility`/`shift`/`department` to `teams` |

### Client files to create or modify:

| File | Action |
|------|--------|
| `client/src/pages/Team.tsx` | Add role-change dropdown, resend/cancel buttons |
| `client/src/pages/ManagerDashboard.tsx` | Add filters, link rows to detail page |
| `client/src/pages/TechnicianDetail.tsx` | **New** — full technician evidence view |
| `client/src/App.tsx` | Add `/manager/technician/:userId` and `/manager/demo` routes |

### Database migrations:

1. `ALTER TABLE teams ADD COLUMN organizationId INT;`
2. `ALTER TABLE teams ADD COLUMN facility VARCHAR(100);`
3. `ALTER TABLE teams ADD COLUMN shift VARCHAR(50);`
4. `ALTER TABLE teams ADD COLUMN department VARCHAR(100);`
5. `CREATE TABLE organizations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, ownerId INT NOT NULL, domain VARCHAR(255), industry VARCHAR(100), createdAt TIMESTAMP DEFAULT NOW());`

---

## Final Verdict

> **PARTIALLY WORKS** — The core machinery exists (team creation, invite/accept, role-based data scoping, real competency data, training assignments, manager validation). A manager who is correctly set up in the database **can** log in and see real technician progress today. However, the setup requires manual database intervention (no role-change UI), invites don't email, there's no technician drill-down, no filters, and no organization hierarchy. A real customer cannot self-serve the full workflow without engineering support.

### What a customer can do today (with manual setup help):

1. Purchase a Team plan → team is auto-created.
2. Invite technicians via clipboard link → they accept and join.
3. Log into `/manager` → see real readiness data for their team.
4. Assign training via `/manage` → track completion and overdue.
5. Validate competencies from the manager dashboard.

### What a customer cannot do without direct SQL:

1. Promote a team member to manager.
2. Create sub-teams (shifts, facilities).
3. See a technician's full attempt/evidence detail.
4. Filter the dashboard by domain, readiness, or training status.
5. Receive an email when invited (must receive link out-of-band).
6. Resend or cancel a pending invite.
7. Deactivate a user while preserving their records.
