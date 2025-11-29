= User Account Management System
Vungarala Vignesh Ravi Kumar <vungarala@example.com>
:icons: font
:toc:
:toclevels: 2
:sectnums:
:doctype: book
:source-highlighter: highlight.js

image::logo-placeholder.png[Project Logo, width=240]

== Project Summary

A full-stack, serverless **User Account Management System**:
Flask backend (deployed to AWS Lambda + API Gateway) using Redis for persistence, and a React + React-Bootstrap frontend hosted on Netlify.  
Includes user registration, login (JWT), protected dashboard, profile management, password changes, notifications, billing (simulated), plans & add-ons, and secure account deletion.

*Status:* **Production-ready (backend live)**  
*Author:* Vungarala Vignesh Ravi Kumar — Aspiring Backend Developer

== Live URLs (replace placeholders)

* Frontend (Netlify): https://your-netlify-app-url.netlify.app/
* Backend API (API Gateway): https://owf5o8rlm8.execute-api.ap-south-1.amazonaws.com/dev

== Tech Stack

* Backend
** Python 3.9, Flask
** Redis (ElastiCache Serverless)
** AWS Lambda + API Gateway
** Serverless Framework, serverless-wsgi
** JWT authentication

* Frontend
** React.js
** React-Bootstrap
** Axios
** React Router
** Netlify deployment

== Repo Structure

[source,console]
----
user-account-management-project/
├── flask-lambda-redis-api/
│   ├── app.py
│   ├── serverless.yml
│   ├── requirements.txt
│   └── ...
├── user-account-dashboard/
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       └── PasswordInput.js
│   └── ...
└── README.adoc
----

== Features

* Authentication
** Signup with email, first name, last name, password (confirm)
** Login with JWT; protected dashboard routes
** Logout clears local session

* Profile & Security
** View-only profile snapshot
** Secure name edits (require current password)
** Secure password change (old + new + confirm + validation)
** Account deletion with password confirmation

* Preferences & Settings
** Notifications (email / sms / push)
** Billing (simulated: cardholder, card number, expiry, CVV; stores only last4)
** Plans & Add-ons with pricing, total calculation and payment gating

* Dev / Ops
** Serverless deployment to AWS Lambda/APIG
** Frontend deploy to Netlify
** Minimal, testable Redis-backed persistence

== Quick Start — Local (Dev)

=== Backend (Flask local)
[source,bash]
----
cd flask-lambda-redis-api
python -m venv venv
venv\Scripts\activate   # Windows
# OR: source venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
# Make sure Redis is available locally (docker or local install)
python app.py
# API available at http://localhost:5000
----

=== Frontend (React local)
[source,bash]
----
cd user-account-dashboard
npm install
npm start
# Frontend available at http://localhost:3000
----

== Deploy (Production)

=== Backend — Serverless
1. Ensure AWS credentials are configured locally.  
2. Edit `serverless.yml` with VPC / ElastiCache details (if using ElastiCache).  
3. Deploy:
[source,bash]
----
cd flask-lambda-redis-api
serverless deploy --verbose
----

=== Frontend — Netlify (quick)
* Build:
[source,bash]
----
cd user-account-dashboard
npm run build
----
* Drag-and-drop `build/` in https://app.netlify.com/drop or connect GitHub repo in Netlify and set:
** Build command: `npm run build`
** Publish directory: `user-account-dashboard/build`

== API Summary

NOTE: All `auth/*` and `settings/*` routes require `Authorization: Bearer <token>` after login (except signup/login).

[cols="1,1,3",options="header"]
|===
| Method | Path | Description

| POST
| /auth/signup
| Create user: `{ email, first_name, last_name, password, confirm_password }`

| POST
| /auth/login
| Login: `{ email, password }` → returns `{ token, user }`

| GET
| /auth/me
| Get current user profile (from JWT)

| PUT
| /auth/profile
| Update name: `{ first_name, last_name, current_password }`

| POST
| /auth/change-password
| Change password: `{ old_password, new_password, confirm_password }`

| DELETE
| /auth/delete-account
| Delete account: `{ password }`

| GET/PUT
| /settings/notifications
| Get & set `{ email_notifications, sms_notifications, push_notifications }`

| GET/PUT
| /settings/billing
| Get & set billing info. On save backend stores `card_last4` only.

| GET/PUT
| /settings/plans
| Get & set plan & add-ons. Backend enforces payment method for paid plans.
|===

== Design Decisions & Security Notes

* Passwords are hashed (use `werkzeug.security` or `bcrypt`) — never store raw passwords.
* Card numbers are never stored in full; backend stores only the `last4` (demo best practice).
* All protected endpoints require JWT token in `Authorization` header.
* Serverless functions are deployed inside a VPC to access ElastiCache (Redis). Provide correct `subnetIds` and `securityGroupIds` in `serverless.yml`.
* Backend validates:
** Password strength (min 8 chars, 1 uppercase, 1 digit)
** Card number length (16 digits) & CVV length (3–4 digits)
* Frontend prevents selecting paid plans unless a billing method exists; backend double-checks this.

== How to test (manual checklist)

1. Signup → verify response, no duplicate allowed.  
2. Login → receive JWT.  
3. Access `/auth/me` → profile returns.  
4. Open Dashboard — should be protected (redirect to login if no token).  
5. Edit profile (requires current password).  
6. Change password (old + new + confirm) — then re-login with new password.  
7. Billing: add card details → check masked card shown.  
8. Plans: pick paid plan → if no billing method present, save should be blocked.  
9. Delete account: confirm password → user removed from Redis.

== Folder Setup for GitHub (recommended files)

* `.gitignore` — ignore `node_modules/`, `venv/`, `.serverless/`, `build/`, OS files.  
* `README.adoc` — (this file).  
* `LICENSE` — choose MIT or your preferred license.  
* `CONTRIBUTING.md` — optional.

== Example Commands (git)

[source,bash]
----
git init
git add .
git commit -m "Initial commit — user account management system"
git branch -M main
git remote add origin https://github.com/<your-username>/user-account-management-project.git
git push -u origin main
----

== Screenshots & Demo

Add screenshots to `docs/screenshots/` and reference them:

image::docs/screenshots/login.png[Login Page]
image::docs/screenshots/dashboard.png[Dashboard Overview]

== Author & Contact

Vungarala Vignesh Ravi Kumar  
* Aspiring Backend Developer (B.Tech EEE)  
* GitHub: https://github.com/vigneshvungarala  
* LinkedIn: https://linkedin.com/in/your-link

== Changelog

* v1.0 — Initial production-ready submission (Auth, Profile, Notifications, Billing simulation, Plans, Delete account)
* v1.1 — UI improvements, password visibility toggle, billing & plan validation

== Licence

This project is released under the MIT License.
