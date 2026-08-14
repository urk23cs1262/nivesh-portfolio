/* ==========================================================================
   NIVESH PORTFOLIO — SECURE SERVER-SIDE API  (api/index.js)
   Runs as a Vercel Serverless Function OR a local Express server.
   Secrets live in process.env ONLY — never in browser JavaScript.
   ========================================================================== */

'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const app = express();

// ── Environment Variables (never sent to browser) ────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PIN      = process.env.ADMIN_PIN;
const JWT_SECRET     = process.env.JWT_SECRET;
const PORT           = process.env.PORT || 3000;

// Guard: warn loudly on startup if required env vars are missing
if (!ADMIN_PASSWORD || !ADMIN_PIN || !JWT_SECRET) {
    console.error(
        '[ERROR] Required environment variables are missing.\n' +
        '        Set ADMIN_PASSWORD, ADMIN_PIN and JWT_SECRET in .env (local)\n' +
        '        or in Vercel Project → Settings → Environment Variables.'
    );
}

// ── Data File Path ────────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, '..', 'data', 'niveshr_portfolio.json');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from project root (index.html, admin.html, CSS, JS, assets)
app.use(express.static(path.join(__dirname, '..')));

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDataFile() {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            about: {
                name: 'Nivesh R',
                role: 'CSE Student · Full Stack Developer · AI Enthusiast',
                short_description: 'B.Tech CSE student at Karunya Institute of Technology and Science.',
                about_paragraph_1: '',
                about_paragraph_2: '',
                hobbies: 'listening to music, reading, and playing the drums.',
                projects_count: '5+',
                cgpa: '7.8',
                graduation_year: '2027',
                profile_image_url: './assets/img/NIVESH R.jpg',
                github_url: 'https://github.com/theniveshr',
                linkedin_url: 'https://www.linkedin.com/in/nivesh-r-4646972b3',
                instagram_url: 'https://www.instagram.com/______.nivesh_arn.______/?hl=en',
                email: 'niveshr@karunya.edu.in'
            },
            education:      [],
            experiences:    [],
            skillCategories:[],
            projects:       [],
            certificates:   [],
            activities:     [],
            contact:        {},
            socialLinks:    [],
            quickLinks:     [],
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}
ensureDataFile();

function validateSchema(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, message: 'Root JSON must be an object.' };
    }
    if (!data.about || typeof data.about !== 'object') {
        return { valid: false, message: 'Missing or invalid "about" section.' };
    }
    return { valid: true };
}

// ── Auth Middleware ───────────────────────────────────────────────────────────
/**
 * Verifies the Bearer JWT from the Authorization header.
 * Attach this to any route that requires admin access.
 */
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized — no token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden — insufficient role.' });
        }

        req.admin = decoded;
        next();

    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }
}

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

/**
 * POST /api/login
 * Body: { password: string, pin: string }
 * Validates credentials server-side — the actual values are NEVER sent to the browser.
 * Returns a signed JWT on success.
 */
app.post('/api/login', (req, res) => {
    const { password, pin } = req.body || {};

    if (!password || !pin) {
        return res.status(400).json({ success: false, message: 'Password and PIN are required.' });
    }

    const passwordValid = password === ADMIN_PASSWORD;
    const pinValid      = pin      === ADMIN_PIN;

    if (!passwordValid && !pinValid) {
        return res.status(401).json({ success: false, message: 'Both Admin Password and Security PIN are incorrect.' });
    }
    if (!passwordValid) {
        return res.status(401).json({ success: false, message: 'Admin Password is incorrect.' });
    }
    if (!pinValid) {
        return res.status(401).json({ success: false, message: 'Security PIN is incorrect.' });
    }

    const token = jwt.sign(
        { role: 'admin', iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.json({ success: true, token });
});

/**
 * GET /api/portfolio
 * Public — returns the current portfolio data.
 */
app.get('/api/portfolio', (req, res) => {
    try {
        ensureDataFile();
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(content));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read portfolio data.', details: err.message });
    }
});

// ── PROTECTED ROUTES (require valid JWT) ──────────────────────────────────────

/**
 * PUT /api/portfolio
 * Protected — saves updated portfolio data to disk.
 */
app.put('/api/portfolio', authenticateAdmin, (req, res) => {
    try {
        const newData = req.body;
        const validation = validateSchema(newData);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.message });
        }
        newData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
        res.json({ success: true, message: 'Portfolio data saved.', data: newData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save portfolio data.', details: err.message });
    }
});

/**
 * POST /api/portfolio/import
 * Protected — imports and validates a portfolio JSON upload.
 */
app.post('/api/portfolio/import', authenticateAdmin, (req, res) => {
    try {
        const importedData = req.body;
        const validation = validateSchema(importedData);
        if (!validation.valid) {
            return res.status(400).json({ error: 'JSON Validation Failed: ' + validation.message });
        }
        importedData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(importedData, null, 2), 'utf8');
        res.json({ success: true, message: 'Import successful — portfolio data saved.', data: importedData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to import JSON.', details: err.message });
    }
});

/**
 * GET /api/portfolio/export
 * Protected — download the current portfolio JSON file.
 */
app.get('/api/portfolio/export', authenticateAdmin, (req, res) => {
    try {
        ensureDataFile();
        res.download(DATA_FILE, 'niveshr_portfolio.json');
    } catch (err) {
        res.status(500).json({ error: 'Failed to export portfolio data.', details: err.message });
    }
});

// ── Local Development Server ──────────────────────────────────────────────────
// module.exports = app MUST come before any app.listen so Vercel can import it.
// app.listen is only called when this file is run directly (local dev).
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\u001b[32m🚀 Nivesh Portfolio API running at http://localhost:${PORT}\u001b[0m`);
        console.log(`   Admin CMS  → http://localhost:${PORT}/admin.html`);
        console.log(`   Public     → http://localhost:${PORT}/`);
    });
}
