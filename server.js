const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'public', 'data', 'niveshr_portfolio.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (HTML, CSS, JS, Assets) from public/
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and baseline niveshr_portfolio.json exist
function ensureDataFile() {
    const dataDir = path.join(__dirname, 'public', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            about: {
                name: "Nivesh R",
                role: "CSE Student · Full Stack Developer · AI Enthusiast",
                short_description: "B.Tech CSE student at Karunya Institute of Technology and Science. Building full-stack apps, AI-powered platforms & IoT systems.",
                about_paragraph_1: "I'm a passionate B.Tech Computer Science student at Karunya Institute of Technology and Science (2023–27), specializing in building full-stack web applications, AI-powered platforms, and IoT systems.",
                about_paragraph_2: "I love transforming ideas into working digital products — from PHP-MySQL school systems and React-based resume analyzers to ML-powered toll verification and real-time water monitoring platforms.",
                hobbies: "listening to music, reading, and playing the drums.",
                projects_count: "5+",
                cgpa: "7.8",
                graduation_year: "2027",
                profile_image_url: "./assets/img/NIVESH R.jpg",
                github_url: "https://github.com/theniveshr",
                linkedin_url: "https://www.linkedin.com/in/nivesh-r-4646972b3",
                instagram_url: "https://www.instagram.com/______.nivesh_arn.______/?hl=en",
                email: "niveshr@karunya.edu.in"
            },
            education: [],
            experiences: [],
            skillCategories: [],
            projects: [],
            certificates: [],
            activities: [],
            contact: {},
            socialLinks: [],
            quickLinks: [],
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}
ensureDataFile();

// Validation helper
function validateSchema(data) {
    if (!data || typeof data !== 'object') return { valid: false, message: 'Root JSON must be an object' };
    if (!data.about || typeof data.about !== 'object') return { valid: false, message: 'Missing or invalid "about" section' };
    return { valid: true };
}

// GET /api/portfolio - Load current central portfolio data
app.get('/api/portfolio', (req, res) => {
    try {
        ensureDataFile();
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(content));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read niveshr_portfolio.json file', details: err.message });
    }
});

// PUT /api/portfolio - Update central portfolio data
app.put('/api/portfolio', (req, res) => {
    try {
        const newData = req.body;
        const validation = validateSchema(newData);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.message });
        }
        newData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
        res.json({ success: true, message: 'Portfolio data updated on disk', data: newData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to write niveshr_portfolio.json file', details: err.message });
    }
});

// POST /api/portfolio/import - Import and validate portfolio JSON file
app.post('/api/portfolio/import', (req, res) => {
    try {
        const importedData = req.body;
        const validation = validateSchema(importedData);
        if (!validation.valid) {
            return res.status(400).json({ error: 'JSON Validation Failed: ' + validation.message });
        }
        importedData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(importedData, null, 2), 'utf8');
        res.json({ success: true, message: 'Import successful and portfolio data saved', data: importedData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to import JSON file', details: err.message });
    }
});

// GET /api/portfolio/export - Download niveshr_portfolio.json file
app.get('/api/portfolio/export', (req, res) => {
    try {
        ensureDataFile();
        res.download(DATA_FILE, 'niveshr_portfolio.json');
    } catch (err) {
        res.status(500).json({ error: 'Failed to export niveshr_portfolio.json', details: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Nivesh Portfolio CMS Server running at http://localhost:${PORT}`);
});
