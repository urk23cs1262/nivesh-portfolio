/* ==========================================================================
   NIVESH PORTFOLIO — GITHUB REST API BACKEND  (api/index.js)
   Storage Model: GitHub Repository Commits (Production) + Local Filesystem (Dev)
   Zero external database required! Uses GitHub REST API to persist changes.
   ========================================================================== */

'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const app = express();

// ── Environment Variables ─────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_PIN      = process.env.ADMIN_PIN      || '';
const JWT_SECRET     = process.env.JWT_SECRET     || '';

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN  || '';
const GITHUB_OWNER  = process.env.GITHUB_OWNER  || '';
const GITHUB_REPO   = process.env.GITHUB_REPO   || '';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || '';
const PORT          = process.env.PORT          || 3000;

const IS_GITHUB_STORAGE = Boolean(GITHUB_TOKEN && GITHUB_TOKEN.trim().length > 0);

// ── Startup Safety Checks ─────────────────────────────────────────────────────
// Fail fast instead of silently running with an insecure/blank secret.
// (A blank JWT_SECRET or blank admin credentials would let anyone forge a
//  valid admin session token, or log in without knowing a real password.)
const missingSecrets = [];
if (!ADMIN_PASSWORD) missingSecrets.push('ADMIN_PASSWORD');
if (!ADMIN_PIN) missingSecrets.push('ADMIN_PIN');
if (!JWT_SECRET) missingSecrets.push('JWT_SECRET');
if (missingSecrets.length > 0) {
    const msg = `[FATAL] Missing required environment variable(s): ${missingSecrets.join(', ')}. ` +
        `Set them in your .env file (local) or Project → Settings → Environment Variables (Vercel).`;
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        // In production, refuse to run with insecure/absent secrets.
        throw new Error(msg);
    } else {
        console.warn('\u001b[33m' + msg + ' Admin login/session features will not work until this is fixed.\u001b[0m');
    }
}

// ── Simple In-Memory Login Rate Limiter ───────────────────────────────────────
// Not a substitute for a proper reverse-proxy/WAF rate limiter, but it stops
// naive automated password/PIN guessing against /api/login.
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map(); // ip -> { count, firstAttempt }

function isLoginRateLimited(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry) return false;
    if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
        loginAttempts.delete(ip);
        return false;
    }
    return entry.count >= LOGIN_MAX_ATTEMPTS;
}

function recordLoginAttempt(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
    } else {
        entry.count += 1;
    }
}

function clearLoginAttempts(ip) {
    loginAttempts.delete(ip);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// ── GitHub REST API Helper Functions ──────────────────────────────────────────

function getGitHubHeaders() {
    return {
        'Authorization': `Bearer ${GITHUB_TOKEN.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Nivesh-Portfolio-CMS-Vercel',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'If-None-Match': ''
    };
}

/**
 * Fetch a file from GitHub repository via REST API.
 * Returns { contentString, sha } or null if not found.
 */
async function getFileFromGitHub(repoPath) {
    const cleanPath = repoPath.replace(/^\//, '');
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${cleanPath}?ref=${GITHUB_BRANCH}&_t=${Date.now()}_${Math.random()}`;

    try {
        const res = await fetch(url, { headers: getGitHubHeaders() });
        if (res.status === 404) return null;
        if (!res.ok) {
            const errText = await res.text();
            console.error(`[GitHub API GET Error ${res.status}]`, errText);
            return null;
        }
        const json = await res.json();
        const contentString = Buffer.from(json.content, 'base64').toString('utf8');
        return { contentString, sha: json.sha };
    } catch (err) {
        console.error('[GitHub API GET Exception]', err.message);
        return null;
    }
}

/**
 * Commit/update a file on GitHub repository via REST API with automatic 409 SHA conflict retries.
 */
async function commitFileToGitHub(repoPath, content, commitMessage, maxRetries = 3) {
    const cleanPath = repoPath.replace(/^\//, '');
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${cleanPath}`;

    let base64Content = '';
    if (Buffer.isBuffer(content)) {
        base64Content = content.toString('base64');
    } else if (typeof content === 'string') {
        if (content.startsWith('data:') || (/^[A-Za-z0-9+/=]+$/.test(content.slice(0, 100)) && content.length % 4 === 0 && !content.includes('{'))) {
            base64Content = content.replace(/^data:[^;]+;base64,/, '');
        } else {
            base64Content = Buffer.from(content, 'utf8').toString('base64');
        }
    } else {
        base64Content = Buffer.from(JSON.stringify(content, null, 2), 'utf8').toString('base64');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const existing = await getFileFromGitHub(cleanPath);
        const sha = existing ? existing.sha : undefined;

        const payload = {
            message: commitMessage || `CMS update: ${cleanPath}`,
            content: base64Content,
            branch: GITHUB_BRANCH
        };
        if (sha) payload.sha = sha;

        const res = await fetch(url, {
            method: 'PUT',
            headers: getGitHubHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const resData = await res.json();
            return { success: true, commit: resData.commit };
        }

        const errJson = await res.json().catch(() => ({ message: res.statusText }));
        if (res.status === 409 && attempt < maxRetries) {
            console.warn(`[GitHub SHA Conflict 409] Retrying commit for ${cleanPath} (attempt ${attempt}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, 500 * attempt));
            continue;
        }

        console.error(`[GitHub API Commit Error ${res.status}]`, errJson);
        throw new Error(errJson.message || `GitHub API error ${res.status}`);
    }
}

// ── Sequential GitHub Commit Queue ────────────────────────────────────────────
let githubQueue = Promise.resolve();

function enqueueGitHubCommit(relativePath, content, commitMessage) {
    githubQueue = githubQueue.then(async () => {
        try {
            return await commitFileToGitHub(relativePath, content, commitMessage);
        } catch (err) {
            console.warn(`[GitHub Queue Warning for ${relativePath}]:`, err.message);
            return { success: false, error: err.message };
        }
    });
    return githubQueue;
}

// ── Local Filesystem Storage Helper Functions ───────────────────────────────

function getLocalFilePath(relativePath) {
    const clean = relativePath.replace(/^\//, '');
    return path.join(__dirname, '..', clean);
}

function readLocalFile(relativePath) {
    try {
        const fullPath = getLocalFilePath(relativePath);
        if (!fs.existsSync(fullPath)) return null;
        return fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
        return null;
    }
}

function writeLocalFile(relativePath, content) {
    const fullPath = getLocalFilePath(relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (Buffer.isBuffer(content)) {
        fs.writeFileSync(fullPath, content);
    } else if (typeof content === 'string') {
        if (content.startsWith('data:')) {
            const base64Data = content.replace(/^data:[^;]+;base64,/, '');
            fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
        } else {
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    } else {
        fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8');
    }
}

// ── Unified Storage Read/Write Wrappers ───────────────────────────────────────

async function storageReadText(relativePath) {
    if (IS_GITHUB_STORAGE) {
        const gh = await getFileFromGitHub(relativePath);
        if (gh) return gh.contentString;
    }
    return readLocalFile(relativePath);
}

async function storageReadJSON(relativePath, defaultData = null) {
    const raw = await storageReadText(relativePath);
    if (raw) {
        try { return JSON.parse(raw); } catch (e) { }
    }
    return defaultData;
}

async function storageWrite(relativePath, content, commitMessage) {
    // 1. Always write locally first for instant local server response
    try {
        writeLocalFile(relativePath, content);
    } catch (e) { }

    // 2. If GitHub storage is enabled, queue commit to GitHub
    if (IS_GITHUB_STORAGE) {
        return await enqueueGitHubCommit(relativePath, content, commitMessage);
    }
    return { success: true, mode: 'local' };
}

// ── Auth Middleware ───────────────────────────────────────────────────────────
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

// ── Schema Validation ─────────────────────────────────────────────────────────
function validateSchema(data) {
    if (!data || typeof data !== 'object') return { valid: false, message: 'Root JSON must be an object.' };
    if (!data.about || typeof data.about !== 'object') return { valid: false, message: 'Missing or invalid "about" section.' };
    return { valid: true };
}

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * POST /api/login or /login
 */
router.post('/login', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    if (isLoginRateLimited(ip)) {
        return res.status(429).json({
            success: false,
            message: 'Too many failed login attempts. Please try again in a few minutes.'
        });
    }

    const { password, pin } = req.body || {};
    if (!password || !pin) {
        return res.status(400).json({ success: false, message: 'Password and PIN are required.' });
    }
    if (!ADMIN_PASSWORD || !ADMIN_PIN || !JWT_SECRET) {
        return res.status(503).json({ success: false, message: 'Admin login is not configured on the server yet.' });
    }

    const passwordValid = password === ADMIN_PASSWORD;
    const pinValid      = pin      === ADMIN_PIN;

    // Intentionally generic: don't reveal which of the two credentials was
    // wrong, so an attacker can't brute-force them one at a time.
    if (!passwordValid || !pinValid) {
        recordLoginAttempt(ip);
        return res.status(401).json({ success: false, message: 'Admin Password or Security PIN is incorrect.' });
    }

    clearLoginAttempts(ip);
    const token = jwt.sign(
        { role: 'admin', iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
    return res.json({ success: true, token });
});

/**
 * GET /api/portfolio or /portfolio
 * Public — returns current portfolio data from GitHub / local file.
 */
router.get('/portfolio', async (req, res) => {
    try {
        const data = await storageReadJSON('public/data/niveshr_portfolio.json');
        if (data) return res.json(data);

        // Ultimate fallback: static read from disk
        const raw = readLocalFile('public/data/niveshr_portfolio.json');
        if (raw) return res.json(JSON.parse(raw));

        return res.status(404).json({ error: 'Portfolio data file not found.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to read portfolio data.', details: err.message });
    }
});

/**
 * POST /api/messages or /messages
 * Public — save contact message.
 */
router.post('/messages', async (req, res) => {
    try {
        const { name, email, message } = req.body || {};
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
        }
        const messages = await storageReadJSON('public/data/messages.json', []);
        const newMsg = {
            id: 'msg_' + Date.now(),
            name,
            email,
            message,
            status: 'unread',
            createdAt: new Date().toISOString()
        };
        messages.unshift(newMsg);
        await storageWrite('public/data/messages.json', messages, `New contact message from ${name}`);
        return res.json({ success: true, message: 'Message sent successfully!', id: newMsg.id });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to save message.', details: err.message });
    }
});

/**
 * PATCH /api/analytics or /analytics
 * Public — increment analytics counter.
 */
router.patch('/analytics', async (req, res) => {
    try {
        const { field } = req.body || {};
        const allowed = ['pageViews', 'uniqueVisitors', 'resumeDownloads', 'resumeViews'];
        if (!field || !allowed.includes(field)) {
            return res.status(400).json({ success: false, message: 'Invalid analytics field.' });
        }
        const analytics = await storageReadJSON('public/data/analytics.json', {
            pageViews: 1247,
            uniqueVisitors: 893,
            resumeDownloads: 127,
            resumeViews: 312
        });
        analytics[field] = (analytics[field] || 0) + 1;
        analytics.lastUpdated = new Date().toISOString();
        await storageWrite('public/data/analytics.json', analytics, `Increment analytics: ${field}`);
        return res.json({ success: true, [field]: analytics[field] });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

// =============================================================================
// PROTECTED ADMIN ROUTES
// =============================================================================

/**
 * PUT /api/portfolio or /portfolio
 * Admin — update full portfolio data.
 */
router.put('/portfolio', authenticateAdmin, async (req, res) => {
    try {
        const newData = req.body;
        const validation = validateSchema(newData);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.message });
        }
        newData.lastUpdated = new Date().toISOString();

        await storageWrite(
            'public/data/niveshr_portfolio.json',
            newData,
            'Update portfolio CMS data'
        );

        return res.json({ success: true, message: 'Portfolio data updated successfully.', data: newData });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to save portfolio data.', details: err.message });
    }
});

/**
 * POST /api/portfolio/import or /portfolio/import
 * Admin — import JSON file.
 */
router.post('/portfolio/import', authenticateAdmin, async (req, res) => {
    try {
        const importedData = req.body;
        const validation = validateSchema(importedData);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation Error: ' + validation.message });
        }
        importedData.lastUpdated = new Date().toISOString();

        await storageWrite(
            'public/data/niveshr_portfolio.json',
            importedData,
            'Import portfolio JSON data'
        );

        return res.json({ success: true, message: 'Import successful!', data: importedData });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to import JSON.', details: err.message });
    }
});

/**
 * GET /api/portfolio/export or /portfolio/export
 * Admin — export portfolio JSON.
 */
router.get('/portfolio/export', authenticateAdmin, async (req, res) => {
    try {
        const data = await storageReadJSON('public/data/niveshr_portfolio.json', {});
        res.setHeader('Content-Disposition', 'attachment; filename="niveshr_portfolio.json"');
        res.setHeader('Content-Type', 'application/json');
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to export portfolio data.', details: err.message });
    }
});

// =============================================================================
// FILE UPLOADS (Resume & Images via Base64 JSON payload)
// =============================================================================

/**
 * POST /api/upload/resume or /upload/resume
 * Admin — upload resume PDF file.
 * Accepts: { filename, fileBase64 }
 */
router.post('/upload/resume', authenticateAdmin, async (req, res) => {
    try {
        const { filename, fileBase64 } = req.body || {};
        if (!fileBase64) {
            return res.status(400).json({ success: false, message: 'Missing fileBase64 data.' });
        }

        const safeFilename = (filename || 'NIVESH_R_RESUME.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
        if (filename && !filename.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({ success: false, message: 'Invalid format! Only PDF files (.pdf) are allowed.' });
        }

        const repoPath = 'public/assets/pdf/resume/NIVESH_R_RESUME.pdf';

        // Clean base64 string
        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Write/Commit to single target resume PDF file
        await storageWrite(repoPath, buffer, `Update resume PDF: NIVESH_R_RESUME.pdf`);

        const originalName = (filename || 'NIVESH_R_RESUME.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
        const displayFilename = originalName.toLowerCase().endsWith('.pdf') ? originalName : originalName + '.pdf';

        const timestamp = Date.now();
        const resumeData = {
            id: 'res-' + timestamp,
            filename: displayFilename,
            original_name: filename || displayFilename,
            file_size: (buffer.length / 1024).toFixed(0) + ' KB',
            upload_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            url: `assets/pdf/resume/NIVESH_R_RESUME.pdf?v=${timestamp}`,
            is_active: true
        };

        // Update portfolio.json
        const portfolio = await storageReadJSON('public/data/niveshr_portfolio.json', {});
        portfolio.resume = resumeData;
        portfolio.lastUpdated = new Date().toISOString();

        await storageWrite('public/data/niveshr_portfolio.json', portfolio, `Link resume PDF in portfolio.json`);

        return res.json({
            success: true,
            message: 'Resume PDF uploaded & updated successfully!',
            resume: resumeData
        });
    } catch (err) {
        console.error('[Upload Resume Error]', err);
        return res.status(500).json({ success: false, message: 'Resume upload failed.', details: err.message });
    }
});

/**
 * DELETE /api/upload/resume or /upload/resume
 * Admin — delete/deactivate active resume.
 */
router.delete('/upload/resume', authenticateAdmin, async (req, res) => {
    try {
        const portfolio = await storageReadJSON('public/data/niveshr_portfolio.json', {});
        portfolio.resume = { is_active: false };
        portfolio.lastUpdated = new Date().toISOString();
        await storageWrite('public/data/niveshr_portfolio.json', portfolio, 'Deactivate resume');
        return res.json({ success: true, message: 'Resume deactivated.' });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

/**
 * POST /api/upload/image or /upload/image
 * Admin — upload project or certificate image.
 * Accepts: { filename, fileBase64, folder }
 */
router.post('/upload/image', authenticateAdmin, async (req, res) => {
    try {
        const { filename, fileBase64, folder } = req.body || {};
        if (!fileBase64) {
            return res.status(400).json({ success: false, message: 'Missing fileBase64 image data.' });
        }

        const ext = (filename || 'image.png').split('.').pop() || 'png';
        const timestamp = Date.now();
        const cleanName = (filename || 'img')
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_');
        const finalFilename = `${cleanName}_${timestamp}.${ext}`;
        const targetFolder = (folder || 'projects').replace(/[^a-zA-Z0-9_-]/g, '');
        const repoPath = `public/assets/${targetFolder}/${finalFilename}`;

        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        await storageWrite(repoPath, buffer, `Upload project image: ${finalFilename}`);

        const publicUrl = `/assets/${targetFolder}/${finalFilename}`;
        return res.json({
            success: true,
            url: publicUrl,
            filename: finalFilename
        });
    } catch (err) {
        console.error('[Upload Image Error]', err);
        return res.status(500).json({ success: false, message: 'Image upload failed.', details: err.message });
    }
});

// =============================================================================
// MESSAGES ROUTES
// =============================================================================

/**
 * GET /api/messages or /messages
 */
router.get('/messages', authenticateAdmin, async (req, res) => {
    try {
        const messages = await storageReadJSON('public/data/messages.json', []);
        return res.json({ success: true, messages });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

/**
 * PATCH /api/messages/:id or /messages/:id
 */
router.patch('/messages/:id', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body || {};
        const messages = await storageReadJSON('public/data/messages.json', []);
        const msg = messages.find(m => m.id === req.params.id);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

        msg.status = status || (msg.status === 'unread' ? 'read' : 'unread');
        await storageWrite('public/data/messages.json', messages, `Update message status: ${req.params.id}`);
        return res.json({ success: true, message: msg });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

/**
 * DELETE /api/messages/:id or /messages/:id
 */
router.delete('/messages/:id', authenticateAdmin, async (req, res) => {
    try {
        let messages = await storageReadJSON('public/data/messages.json', []);
        messages = messages.filter(m => m.id !== req.params.id);
        await storageWrite('public/data/messages.json', messages, `Delete message: ${req.params.id}`);
        return res.json({ success: true, message: 'Message deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

// =============================================================================
// LOGS ROUTES
// =============================================================================

/**
 * GET /api/logs or /logs
 */
router.get('/logs', authenticateAdmin, async (req, res) => {
    try {
        const logs = await storageReadJSON('public/data/logs.json', []);
        return res.json({ success: true, logs });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

/**
 * POST /api/logs or /logs
 */
router.post('/logs', authenticateAdmin, async (req, res) => {
    try {
        const logEntry = req.body || {};
        const logs = await storageReadJSON('public/data/logs.json', []);
        logs.unshift({ ...logEntry, id: 'log_' + Date.now() });
        if (logs.length > 100) logs.pop();
        await storageWrite('public/data/logs.json', logs, `Add audit log entry`);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

/**
 * DELETE /api/logs or /logs
 */
router.delete('/logs', authenticateAdmin, async (req, res) => {
    try {
        await storageWrite('public/data/logs.json', [], `Clear audit logs`);
        return res.json({ success: true, message: 'Logs cleared.' });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

// =============================================================================
// ANALYTICS ROUTES
// =============================================================================

/**
 * GET /api/analytics or /analytics
 */
router.get('/analytics', authenticateAdmin, async (req, res) => {
    try {
        const analytics = await storageReadJSON('public/data/analytics.json', {
            pageViews: 1247,
            uniqueVisitors: 893,
            resumeDownloads: 127,
            resumeViews: 312
        });
        return res.json({ success: true, analytics });
    } catch (err) {
        return res.status(500).json({ success: false, details: err.message });
    }
});

// =============================================================================
// MIGRATION ROUTE
// =============================================================================

/**
 * POST /api/migrate or /migrate
 * Admin — Migrate localStorage data payload to GitHub/local storage.
 */
router.post('/migrate', authenticateAdmin, async (req, res) => {
    try {
        const { portfolioData, messages, logs, analytics } = req.body || {};
        const results = {};

        if (portfolioData && portfolioData.about) {
            await storageWrite('public/data/niveshr_portfolio.json', portfolioData, 'Migrate portfolio data');
            results.portfolio = 'migrated';
        }
        if (Array.isArray(messages) && messages.length > 0) {
            await storageWrite('public/data/messages.json', messages, 'Migrate messages');
            results.messages = `${messages.length} messages migrated`;
        }
        if (Array.isArray(logs) && logs.length > 0) {
            await storageWrite('public/data/logs.json', logs, 'Migrate logs');
            results.logs = `${logs.length} logs migrated`;
        }
        if (analytics && typeof analytics === 'object') {
            await storageWrite('public/data/analytics.json', analytics, 'Migrate analytics');
            results.analytics = 'migrated';
        }

        return res.json({ success: true, message: 'Migration completed successfully!', results });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Migration failed.', details: err.message });
    }
});

// =============================================================================
// STATUS / HEALTH ROUTE
// =============================================================================

router.get('/status', (req, res) => {
    res.json({
        api: 'ok',
        timestamp: new Date().toISOString(),
        storageMode: IS_GITHUB_STORAGE ? 'github_api' : 'local_filesystem',
        githubRepo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        githubBranch: GITHUB_BRANCH,
        configured: {
            githubToken: IS_GITHUB_STORAGE
        }
    });
});

// Mount router on both /api prefix and root / prefix to ensure compatibility
app.use('/api', router);
app.use('/', router);

// Serve static public files in local dev mode
const staticPath = path.join(__dirname, '..', 'public');
app.use(express.static(staticPath));

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\u001b[32m🚀 Nivesh Portfolio API running at http://localhost:${PORT}\u001b[0m`);
        console.log(`   Storage mode: \u001b[36m${IS_GITHUB_STORAGE ? 'GitHub REST API (' + GITHUB_OWNER + '/' + GITHUB_REPO + ')' : 'Local Filesystem'}\u001b[0m`);
        console.log(`   Admin CMS  → http://localhost:${PORT}/admin.html`);
        console.log(`   Public     → http://localhost:${PORT}/`);
        console.log(`   Status     → http://localhost:${PORT}/api/status`);
    });
}
