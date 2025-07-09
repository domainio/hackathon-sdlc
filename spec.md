Financial App – Technical Specification

1. Product Overview

A responsive web-based finance application (wrapped with Tauri for installable Android & iOS builds) that lets end-users view aggregated insurance & pension data and book video consultations with company consultants. Managers and Admins oversee staff and assign new appointments to consultants ,automatic  assignments  by round robin (feature flag) . Data is sourced from three external providers (Mislaka, Harhabituah, Gemelnet) and surfaced once per user after an initial 48-hour pull.

⸻

2. User Roles & Capabilities

Role	Capabilities
User	* View finance data (read-only)
	* Book appointments (single general calendar)
	* Receive first-time data-ready notification
	* Manage global notification channel toggles (Email / SMS / In-app)
Consultant	* View own today’s and historical meetings (chronological, shows completed/no-show)
	* View user finance data (read-only)
	* Add/edit/delete rich-text notes (Markdown, Quill editor; bold/italic/bullets/links only)
	* Mark appointment status (Scheduled / Completed / Canceled by User / No-Show / Follow-Up Needed)
	* Trigger data refresh (blocked while one is in progress)
	* Propose & directly book follow-ups on user’s behalf (Calendly)
Manager	* All consultant abilities
	* Assign unassigned bookings to consultants (with Calendly availability check)
	* Create new free-text tags & edit tag colors
	* View tag-based analytics dashboard (real-time, recomputed per date-range)
Admin	* All manager abilities
	* Edit tag colors & delete tags
	* View audit log (newest-first, 50 rows/page) with date-range & exact-match user search (name, phone, ID)
	* No in-app system-settings screen ; global configs via env vars


⸻

3. High-Level Architecture

React (Mantine UI + TanStack Router/Query) → Remult API/Monolith on Railway → PostgreSQL (JSONB finance blobs + relational tables) → Redis (session store, cooldown timers) → External APIs (Mislaka, Harhabituah, Gemelnet) → SendGrid, Twilio, DocuSign, Calendly

	•	Hosting: Railway EU region (Frankfurt) for dev; production will migrate to self-host.
	•	Frontend: Responsive web app; packaged with Tauri-mobile for unsigned IPA/APK artifacts (GitHub Actions, 90-day retention).  No offline cache, no native push.
	•	Backend: Single Remult Node + TypeScript service built to allow future extraction into micro-services.  Background jobs can be queued via Redis (BullMQ) but no hard throttling for first phase.

⸻

4. Data Model (PostgreSQL)

4.1 Core Tables
	1.	users – id UUID (PK), firstName, lastName, phone, email, nationalId (plain text), createdAt, lastLogin, archived BOOLEAN DEFAULT false, language ENUM(‘he’,‘en’) DEFAULT ‘he’.
	2.	finance_snapshots – userId FK ⇒ users.id, payload JSONB (latest overwrite), fetchedAt TIMESTAMP.
	3.	appointments – id UUID PK, userId FK, consultantId nullable FK ⇒ staff.id, calendlyEventId, status ENUM, startTime, endTime, timeZone, meetingUrl, tags ARRAY, createdAt, updatedAt.
	4.	tags – id UUID PK, name TEXT UNIQUE, color HEX, createdBy FK ⇒ staff.id.
	5.	notes – id UUID PK, appointmentId FK, authorId FK ⇒ staff.id, markdown TEXT, createdAt, updatedAt, version INT (soft-overwrite, full history stored but only latest served).
	6.	audit_events – id UUID PK, type ENUM(‘AUTH’,‘ONBOARD’,‘API’), userId FK, actorId FK nullable, apiProvider ENUM nullable, status ENUM nullable, triggeredBy ENUM(‘system’,‘staff’) nullable, ip INET, userAgent TEXT, occurredAt TIMESTAMP.

4.2 Sessions & Tokens
	•	sid (15 min) / rid (30 days) cookies → Redis (sess:, sess:sha256()).  Refresh rotates both ids.  HttpOnly, Secure, SameSite=Strict.

⸻

5. External Integrations

Provider	Auth	Flow	Webhook	Correlation Key
Mislaka	Static company API key (Railway secret)	One-shot POST; await webhook	POST to /api/webhooks/mislaka within 48 h	nationalId
Harhabituah	Same	One-shot POST; await webhook	/api/webhooks/harhabituah	nationalId
Gemelnet	Same	One-shot POST; await webhook	/api/webhooks/gemelnet	nationalId

	•	Webhook auth: IP allow-list.  Payload stored for audit/debug.
	•	DocuSign: Embedded signing from template (signature + locked nationalId).  Signed PDF uploaded to Railway object storage with default SSE; overwrite previous.
	•	Calendly: Single general event-type; unassigned placeholder seat.  Post-booking webhooks → create appointment row (consultantId NULL).  Assignment transfers event via Calendly API.
	•	SendGrid: From noreply@placeholder.local, brand “IntIsrael”.
	•	Twilio: Long-code sender; OTP SMS only.  Template: “IntIsrael: Your verification code is {code}.”
	•	PostHog: Self-hosted on Railway; retain 90 days; page-views only; id=userId; end-users only.

⸻

6. Onboarding & Authentication
	1.	Step 1 – Enter firstName, lastName, phone  → OTP (6 digits, 60 s expiry, 60 s resend cooldown with countdown).  Unlimited resends; each new code invalidates prior.
	2.	Step 2 – Enter nationalId → Embedded DocuSign; after sign success, user redirected to dashboard.
	3.	If user leaves mid-flow, next login resumes at last incomplete step.
	4.	Staff invitation: email link → phone OTP step (Option A immediate) → dashboard.

⸻

7. Finance Data Refresh Logic
	•	Initial pull automatically queued post-signing; pending state shown as “We’re working on it.”  Users notified once on success (banner 5 s, list entry, email, SMS).
	•	Manual refresh: Consultants/Managers/Admins may trigger once current status ≠ “In Progress”.  Only staff see detailed states.
	•	No internal retry; consultant/manager/admin can retry manually.

⸻

8. Notifications

Event	Audience	Channels	Template
OTP	User / Staff	SMS + Email	“IntIsrael: Your verification code is {code}. (60 s)”
Finance data ready (first time)	User	In-app banner + list, Email, SMS	“Your finance data is ready—check the app for tips”
Appointment assigned	Consultant	Email	“New appointment assigned: {userName} on {date}”
Staff refresh success/error	None in phase 1	–	–

Users & staff can toggle Email/SMS/App globally (default ON; env-configurable).  Implement via Remult live queries + SendGrid + Twilio.

⸻

9. Front-End Pages & Components

9.1 Public Flow
	•	Welcome → OTP login → Onboarding wizard.

9.2 User
	•	Dashboard (summary card, action buttons, upcoming appointment tile, latest notifications, tips carousel tbd).
	•	Finance Detail (Insurance & Pension tabs; simple read-only cards).
	•	Appointment Booking (general Calendly embed).
	•	Notification Center (chronological list; implicit read).
	•	Settings (channel toggles, email edit).

9.3 Consultant
	•	Today’s Meetings list (chronological; completed/no-show visible).  Columns: Time, User, Status, Tags, Type (fixed “Consultation (Video)”), Quick actions.
	•	User Profile & Finance Data view.
	•	Notes editor (Quill → Markdown).

9.4 Manager/Admin
	•	Unassigned tab (badge counter) – Table cols: Requested time, User, Type, Tags, Assign dropdown.  Sort: newest-first.
⭐ Open Decision – Pagination vs infinite scroll (page size TBD).
	•	Staff Roster (invite, deactivate, role change).
	•	Tag Management (create, color edit, archive (Admin)).
	•	Analytics Dashboard (date-range picker; Vertical bar per tag total; Pie per-tag conversion).  Real-time recompute; backend returns aggregate payload.
	•	Audit Log (Admin only) – date-range + user search (exact), 50 rows/page, newest-first.

⸻

10. Error Handling Strategy

Layer	Approach
Client	Toasts for API errors; Sentry captureUnhandled (sample 100 %).
API / Remult	Global error filter → HTTP codes + JSON {message, code}.  Known cases: OTP expired, cooldown, DocuSign fail, External API timeout, Calendly transfer fail (slot taken).
External Webhooks	Validate IP allow-list; if invalid → 403 and audit log.
Background Jobs	Job error → retry 0, audit entry status=error.


⸻

11. CI/CD & Dev Prod Parity
	•	GitHub Actions
	•	PRs – Vitest + ESLint/Prettier (back + front).
	•	Push → master – build Docker image, deploy to Railway, attach unsigned IPA & APK artifacts (90 days).
	•	Secrets – Railway secrets for prod; .env.local for dev (.env.example template committed).

⸻

12. Testing Plan
	•	Unit Tests (Vitest)
	•	Auth utils, OTP cooldown logic, session refresh rotation.
	•	Notes Markdown sanitizer.
	•	Tag color generator (WCAG check).
	•	Integration Tests
	•	Remult API endpoints (supertest).
	•	Webhook handlers (mock payload + IP-allow).
	•	E2E Smoke (Playwright) – Core happy-path flows: onboarding, first data ready, book appointment, manager assigns.
	•	Coverage – informational only, collected in CI.

⸻

13. Open Decisions / TODO
	1.	Unassigned Queue Pagination – decide between 25-row pagination or infinite scroll.
	2.	Future Rate-Limit Throttling – add when external API 429s observed.
	3.	Staff Notification Templates for refresh, errors, etc. – deferred.
	4.	Branding / Design System – placeholder palette; real branding post-phase 1.

⸻

14. Glossary & Notes
	•	Finance Snapshot – the latest JSON blob returned from all 3 providers (overwritten on refresh).
	•	Consultation (Video) – fixed label for appointment type/location.
	•	SID / RID – session & refresh identifiers stored in Redis per spec.

⸻

© 2025 IntIsrael phase 1 Spec – v1.0

