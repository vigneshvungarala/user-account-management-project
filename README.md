# User Account Management System
**Author:** Vungarala Vignesh Ravi Kumar  
**Email:** vungaralavignesh4184@gmail.com  

## Project Summary

A full-stack, serverless **User Account Management System** built using:
- Flask backend (AWS Lambda + API Gateway)
- Redis 
- React + React-Bootstrap frontend (Netlify)

Features include signup, login (JWT), dashboard, profile editing, password changes, billing (simulated), notifications, plans & add-ons, and secure account deletion.

**Status:** Production-ready (backend live)  
**Author:** Vungarala Vignesh Ravi Kumar — Aspiring Backend Developer

## Live URLs 

- **Frontend (Netlify):** [https://your-netlify-app-url.netlify.app/](https://user-account-creation.netlify.app/)
- **Backend API (API Gateway):** https://owf5o8rlm8.execute-api.ap-south-1.amazonaws.com/dev

## Tech Stack

### Backend
- Python 3.9  
- Flask  
- Redis (ElastiCache Serverless)  
- AWS Lambda + API Gateway  
- Serverless Framework, serverless-wsgi  
- JWT authentication  

### Frontend
- React.js  
- React-Bootstrap  
- Axios  
- React Router  
- Netlify deployment  

## Repo Structure

```
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
└── README.md
```

## Features

### Authentication
- Signup (email, first name, last name, password + confirm)
- Login with JWT
- Protected routes
- Logout clears local session

### Profile & Security
- View-only profile snapshot
- Edit names (requires current password)
- Change password (old + new + confirm)
- Delete account with confirmation

### Preferences & Settings
- Email/SMS/Push notifications
- Billing (simulated card details; only last4 stored)
- Plans & add-ons with pricing and payment checks

### Dev / Ops
- Serverless AWS Lambda
- Netlify frontend
- Redis-backed persistence

## Quick Start — Local Development

### Backend (Flask Local)

```bash
cd flask-lambda-redis-api
python -m venv venv
venv\Scripts\activate   # Windows
# OR: source venv/bin/activate  # macOS / Linux
pip install -r requirements.txt

# Ensure Redis is running locally (Docker/local install)
python app.py
# API runs at http://localhost:5000
```

### Frontend (React Local)

```bash
cd user-account-dashboard
npm install
npm start
# Frontend at http://localhost:3000
```

## Deploy (Production)

### Backend — Serverless AWS

1. Configure AWS credentials  
2. Update `serverless.yml` VPC + ElastiCache details  
3. Deploy:

```bash
cd flask-lambda-redis-api
serverless deploy --verbose
```

### Frontend — Netlify

Build:

```bash
npm run build
```

Deploy:
- Drag-drop `build/` to https://app.netlify.com/drop  
**OR** configure GitHub → Netlify with:
- Build: `npm run build`
- Publish: `user-account-dashboard/build`

## API Routes Summary

| Method | Path                      | Description |
|--------|----------------------------|-------------|
| POST   | /auth/signup              | Create user |
| POST   | /auth/login               | Login, returns JWT |
| GET    | /auth/me                  | Current user via JWT |
| PUT    | /auth/profile             | Update first/last name |
| POST   | /auth/change-password     | Change password |
| DELETE | /auth/delete-account      | Delete user |
| GET/PUT| /settings/notifications   | Notification settings |
| GET/PUT| /settings/billing         | Billing details (stores only last4) |
| GET/PUT| /settings/plans           | Plans & add-ons |

## Security Notes & Design Decisions

- Password hashing using bcrypt/werkzeug  
- Never store raw card numbers; only last4  
- All protected APIs require JWT in `Authorization: Bearer <token>`  
- Lambda inside VPC for Redis access  
- Validations:
  - Password strength  
  - Card number length (16 digits)  
  - CVV (3–4 digits)  
- Frontend & backend double-check paid plan access

## Manual Testing Checklist

1. Signup  
2. Login → receive JWT  
3. `/auth/me` works  
4. Dashboard is protected  
5. Edit profile (current password required)  
6. Change password and re-login  
7. Add billing → masked card shown  
8. Choose paid plan → blocked without billing  
9. Delete account  


```

## Recommended GitHub Files

- `.gitignore`  
- `README.md`  
- `LICENSE`  
- `CONTRIBUTING.md` (optional)

## Git Commands

```bash
git init
git add .
git commit -m "Initial commit — user account management system"
git branch -M main
git remote add origin https://github.com/<your-username>/user-account-management-project.git
git push -u origin main
```

## Author

**Vungarala Vignesh Ravi Kumar**  
Aspiring software Developer (B.Tech EEE)  
GitHub: https://github.com/vigneshvungarala  
LinkedIn: [https://linkedin.com/in/](https://www.linkedin.com/in/vigneshvungarala/)

