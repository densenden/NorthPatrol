Product Requirements Document (PRD)
Project Name: NorthPatrol MVP
Version: 1.0
Date: 2025-09-03
Author: Denis Leif Kreuzer
Git Summary: MVP app to scan 20 checkpoints via QR, record OK/Not OK status, and notify admins if notes exist or checkpoints are skipped.

⸻

✨ Objective

Build a minimal, production-ready version (MVP) of the NorthPatrol app. The app enables security personnel to follow a defined route of checkpoints by scanning QR codes and logging each location’s status. It includes a dedicated Scan App for field staff and a simple Admin View for reviewing patrols.

⸻

⚖️ Tech Stack & Specifications
	•	Frontend: React (Vite-based)
	•	QR Scanner: react-qr-reader or equivalent
	•	Database: Supabase (PostgreSQL)
	•	Authentication: Clerk (email-only login via magic link)
	•	Email Notifications: Resend (triggered after patrol completion if issues are logged)
	•	Design Style: iOS 26 / Liquid Glass UI principles, high contrast dark version
	•	Font: Inter (Regular)
	•	Logo: logo_north_20250115_2D_black_bildmarke.svg
  feature SenDev with logo StudioSen2024slim.svg

⸻

📘 Feature Overview

✉️ Login
	•	Email login using Clerk see clerk.md
	•	Role-based access: scanner or admin

📱 Scan App (Field Use)
	•	Linear navigation from checkpoint 1 to 20
	•	Checkpoint scanned via QR code
	•	After scan:
	•	Choose: “OK” or “Not OK”
	•	If “Not OK”: mandatory notes field appears
	•	After last checkpoint:
	•	Session completes
	•	If notes were entered or any checkpoint was missed, Resend sends an email alert to the admin

🖥️ Admin View
	•	Login via Clerk (admin role)
	•	Overview of all completed patrols:
	•	User
	•	Timestamps (start/end)
	•	Which of the 20 checkpoints were scanned
	•	Any missed checkpoints
	•	Notes included
	•	(Optional) Export functionality

🧾 QR Code Generation (Planned for Later)
	•	Each checkpoint entry in Supabase includes a qrcode string field (e.g. “np-cp-01”)
	•	Admin utility function or script (e.g. using qrcode npm package) can generate PNGs or base64 images
	•	QR codes are printed and physically placed at each checkpoint
	•	Scan app matches scanned QR content against checkpoints.qrcode
	•	Optional fallback: QR code could also encode URL for browser-based fallback

_____



⸻

⚙️ Database Schema (Supabase Tables)

users
	•	id
	•	email
	•	role (“scanner”, “admin”)

checkpoints
	•	id
	•	name
	•	order (1–20)
	•	qrcode (encoded value)

scans
	•	id
	•	user_id
	•	checkpoint_id
	•	status (“ok”, “not_ok”)
	•	note (optional)
	•	timestamp

sessions
	•	id
	•	user_id
	•	start_time
	•	end_time
	•	complete (boolean)
	•	has_notes (boolean)

⸻

⏳ Timeline (Suggested)
	1.	Week 1: Project setup (React + Supabase + Clerk + Resend), layout scaffolding
	2.	Week 2: QR scan logic, database connection, checkpoint loop
	3.	Week 3: Admin view, session logic, email notification logic
	4.	Week 4: UI polish, Inter font integration, iOS26 styling, test deployment

⸻

🎯 MVP Outcome

A functioning MVP app for real-world use: 20 QR checkpoints, sequential scan flow, note-taking, and admin reporting with email alerts. Built for future extension (native app, beacon support, map view, exports, etc).

⸻

Note: This PRD is optimized for implementation with Claude Code, Cursor, or any GPT-driven IDE assistant. All components are modular and designed for future scalability.