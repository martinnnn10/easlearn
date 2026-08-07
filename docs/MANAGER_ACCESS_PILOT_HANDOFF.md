# Manager Access — Pilot Handoff

> Sprint completed 2026-08-04. This document describes what was built, how to use it, and what remains for future sprints.

---

## What Was Built

| Feature | Route / Procedure | Status |
|---------|-------------------|--------|
| Role management (change member → manager → admin) | `team.changeRole` | Live |
| Invite with role selection | `team.createInvite` (accepts `role` param) | Live |
| Invite email delivery via Resend | `sendTeamInviteEmail()` in `server/email.ts` | Live |
| Resend invite | `team.resendInvite` | Live |
| Cancel invite | `team.cancelInvite` | Live |
| Invite expiration (7-day default) | `expiresAt` column on `team_members` | Live |
| Audit events | `audit_events` table, recorded on every team action | Live |
| Manager portal link in nav | Layout.tsx user menu (desktop + mobile) | Live |
| Separate demo route | `/manager/demo` (public, sample data) | Live |
| Authenticated manager route | `/manager` (redirects to demo if logged out) | Live |
| Per-technician detail page | `/manager/technician/:userId` | Live |
| Clickable technician names in matrix | ManagerDashboard.tsx | Live |
| 16 new tests (authorization, input validation) | `server/manager-access.test.ts` | Passing |

---

## How to Set Up a Pilot Customer

### Step 1: Customer signs up
They visit https://easlearn.org and create an account via Manus OAuth.

### Step 2: Customer subscribes to Team plan
They go to `/upgrade` and select the Team plan. This auto-creates a team and makes them the owner.

### Step 3: Customer invites technicians
From `/team`, they:
1. Enter the technician's email
2. Select a role (Member, Manager, or Admin)
3. Click "Send Invite"

The technician receives an email with a join link. The link expires in 7 days.

### Step 4: Technician accepts
The technician clicks the link, signs up (or logs in), and is added to the team with the assigned role.

### Step 5: Manager views dashboard
The customer (owner/manager/admin) clicks "Manager Portal" in their user menu, or navigates to `/manager`. They see:
- Decision cards (Promotion-ready, Needs validation, Needs training, Safety risk)
- Communication readiness attestation
- Team readiness matrix with clickable technician names

### Step 6: Drill into technician detail
Clicking a technician name opens `/manager/technician/:userId` showing:
- Competency readiness per domain
- Assigned training (with overdue flags)
- Manager validations
- Recent scenarios and fault diagnosis attempts
- Communication readiness
- Streak and lesson count

---

## Role Hierarchy

| Role | Can invite | Can change roles | Can validate | Can remove members | Can view dashboard |
|------|-----------|-----------------|-------------|-------------------|-------------------|
| Owner | Yes | Yes (except self) | Yes | Yes | Yes |
| Admin | Yes | Yes (members only) | Yes | Yes (members only) | Yes |
| Manager | Yes | No | Yes | No | Yes |
| Member | No | No | No | No | No |

---

## Audit Trail

Every team action is recorded in `audit_events`:
- `invite_created` — who invited whom, with what role
- `invite_resent` — who resent which invite
- `invite_canceled` — who canceled which invite
- `role_changed` — who changed whose role, from what to what
- `invite_accepted` — who accepted which invite

Query example:
```sql
SELECT * FROM audit_events WHERE teamId = ? ORDER BY createdAt DESC LIMIT 50;
```

---

## Demo vs. Production Routes

| URL | Auth required | Data source |
|-----|--------------|-------------|
| `/manager/demo` | No | Sample data (clearly labeled) |
| `/manager` | Yes | Real Assessment Spine evidence |
| `/manager/technician/:userId` | Yes + must manage that user | Real per-technician data |

Share `/manager/demo` with prospects. Share `/manager` only with authenticated pilot customers.

---

## What Remains (Future Sprints)

| Gap | Priority | Estimated Effort |
|-----|----------|-----------------|
| Organization → Teams hierarchy (multi-team) | Medium | 3–4 days |
| Dashboard filters (team, domain, shift, readiness) | Medium | 2–3 days |
| Deactivate user flow (soft-delete from team) | Low | 1 day |
| Bulk invite (CSV upload) | Low | 1–2 days |
| Notification when technician completes training | Medium | 2 days |
| Audit log viewer in UI | Low | 1–2 days |

---

## Files Changed

### New files
- `client/src/pages/ManagerDemo.tsx` — public demo page
- `client/src/pages/TechnicianDetail.tsx` — per-technician detail
- `server/manager-access.test.ts` — 16 authorization tests

### Modified files
- `drizzle/schema.ts` — added `auditEvents` table, expanded `teamMembers` (invitedRole, expiresAt, canceled status)
- `server/routers.ts` — enhanced `createInvite`, new `resendInvite`, `cancelInvite`, `changeRole` procedures
- `server/assessment.ts` — new `technicianDetail` procedure
- `server/email.ts` — new `sendTeamInviteEmail()` function
- `client/src/pages/Team.tsx` — role-change UI, invite with role, resend/cancel buttons
- `client/src/pages/ManagerDashboard.tsx` — clickable names, redirect logged-out to demo
- `client/src/components/Layout.tsx` — Manager Portal link in nav (desktop + mobile)
- `client/src/App.tsx` — new routes (`/manager/demo`, `/manager/technician/:userId`)
- `server/team.test.ts` — updated error message expectations

---

## Test Results

```
Test Files  58 passed (58)
     Tests  625 passed (625)
```

Production build: clean (15.47s).
