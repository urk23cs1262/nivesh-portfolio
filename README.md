# Nivesh R | Professional Portfolio 🚀

Personal portfolio site with a full admin CMS: edit every section (about, education,
experience, skills, projects, certificates, activities, contact) from `/admin.html`,
backed by a small Node/Express API that commits changes straight to this GitHub repo
(or to the local filesystem when developing without GitHub configured).

## 🌟 Key Features

- **Modern Responsive Design**: mobile-first, built with vanilla CSS (Grid/Flexbox).
- **Dynamic Dark/Light Mode** with a persisted theme engine.
- **Full Admin CMS** (`/admin.html`): JWT-protected dashboard to edit every section of
  the site, upload project screenshots/certificates/resume, and review contact messages
  and an audit log — no database required.
- **Zero-database storage**: content lives in `public/data/*.json`. In production the API
  commits updates to this GitHub repo via the GitHub REST API; locally it just writes to
  disk.
- **Interactive project gallery**, certificate viewer modal, and animated scroll reveals.
- **Contact form** that saves messages to the CMS and sends a copy via EmailJS.

## 🛠️ Tech Stack

- **Frontend**: HTML5, vanilla JavaScript (ES6+), vanilla CSS
- **Backend**: Node.js, Express, `jsonwebtoken` (admin auth), GitHub REST API (storage)
- **Icons/Fonts**: FontAwesome 6.4, Google Fonts (Syne, DM Sans)
- **Email**: [EmailJS](https://www.emailjs.com/)
- **Deployment**: Vercel (see `vercel.json`)

## 🚀 Getting Started (local development)

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <this-repo-url>
   cd "NIVESH PORTFOLIO"
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in real values:
   ```bash
   cp .env.example .env
   ```
   - `ADMIN_PASSWORD`, `ADMIN_PIN`, `JWT_SECRET` — required for `/admin.html` login.
     Pick a long, random `JWT_SECRET` (e.g. `openssl rand -hex 32`).
   - `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` — optional. If
     `GITHUB_TOKEN` is left blank, the API falls back to writing directly to the local
     `public/data/` files instead of committing to GitHub, which is the easiest way to
     develop locally.

   **Never commit `.env`** — it's already excluded via `.gitignore`. If a real `.env`
   with live secrets is ever accidentally shared or committed, rotate every value in it
   immediately (revoke the GitHub token, change the admin password/PIN, regenerate the
   JWT secret).

3. **Run the server:**
   ```bash
   npm start
   ```
   - Public site → http://localhost:3000/
   - Admin CMS → http://localhost:3000/admin.html
   - API health check → http://localhost:3000/api/status

4. **Configure EmailJS (optional):**
   The public/private EmailJS IDs used for the contact form and visitor-tracking alerts
   live in `public/JS/script.js` (`emailjs.init(...)`, `service_...`, `template_...`).
   Swap in your own EmailJS account's IDs to receive messages at your own inbox.

## 📁 File Structure

```text
├── api/
│   └── index.js          # Express API: auth, portfolio CRUD, uploads, messages, logs
├── public/
│   ├── index.html         # Public site
│   ├── admin.html         # Admin CMS dashboard
│   ├── CSS/                # style.css (public site), admin.css (CMS)
│   ├── JS/
│   │   ├── script.js       # Public site interactions + CMS hydration
│   │   ├── admin.js        # Admin CMS engine (CRUD, uploads, dashboard)
│   │   ├── cmsStore.js     # Shared data layer: talks to /api/*, caches locally
│   │   └── initialData.js  # Fallback content if the API is unreachable
│   ├── data/                # JSON "database": portfolio, messages, logs, analytics
│   └── assets/               # Images, certificates, resume PDF
├── vercel.json             # Routes /api/* to api/index.js, everything else to /public
└── package.json
```

## ⚠️ Notes on privacy / analytics

`public/JS/script.js` sends an email (via EmailJS) with the visitor's approximate
location, IP, browser, and OS on each new site visit, using a third-party geolocation
API (`ipapi.co`). This is intentional visitor-analytics behavior, but it does share
visitor data with a third party — worth knowing about (and disclosing, e.g. in a privacy
notice) if that matters for your audience.

## 📬 Contact

- **LinkedIn**: [Nivesh R](https://www.linkedin.com/in/nivesh-r-4646972b3)
- **GitHub**: [@theniveshr](https://github.com/theniveshr)
- **Instagram**: [@______.nivesh_arn.______](https://www.instagram.com/______.nivesh_arn.______/?hl=en)
- **Email**: [niveshr@karunya.edu.in](mailto:niveshr@karunya.edu.in)

---
Developed with ❤️ by **Nivesh R**
