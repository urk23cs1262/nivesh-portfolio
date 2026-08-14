/* ==========================================================================
   NIVESH PORTFOLIO — FILE-BASED CMS STORE ENGINE (JS/cmsStore.js)
   NO DATABASE DEPENDENCY. SINGLE SOURCE OF TRUTH: /data/portfolio.json
   ========================================================================== */

(function () {
    'use strict';

    const STORAGE_KEY  = 'nivesh_portfolio_file_cms_data_v3';
    const LOGS_KEY     = 'nivesh_admin_activity_logs';
    const MESSAGES_KEY = 'nivesh_admin_messages';
    const SECURITY_KEY = 'nivesh_admin_security_logs';
    const AUTH_TOKEN_KEY = 'nivesh_admin_auth_token'; // JWT stored by admin.js

    /** Returns the stored JWT for authenticated API calls, or empty string. */
    function getAuthToken() {
        return sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
    }

    let currentPortfolioData = null;
    let isInitialized = false;

    // Async loader — localStorage (admin saves) always wins over disk file
    async function initCMSStore() {
        if (isInitialized && currentPortfolioData) return currentPortfolioData;

        // Step 1: Read localStorage first — this contains admin's latest saves (including screenshots)
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
            try {
                currentPortfolioData = JSON.parse(localRaw);
                isInitialized = true;
            } catch (e) { }
        }

        // Step 2: Fetch /data/niveshr_portfolio.json from disk
        // Only use it if: (a) localStorage is empty, OR (b) the file is newer AND localStorage has no project screenshots/images
        try {
            const res = await fetch('./data/niveshr_portfolio.json');
            if (res.ok) {
                const fileData = await res.json();
                const localHasImages = currentPortfolioData &&
                    Array.isArray(currentPortfolioData.projects) &&
                    currentPortfolioData.projects.some(p =>
                        (Array.isArray(p.screenshots) && p.screenshots.length > 0) ||
                        (Array.isArray(p.images) && p.images.length > 0) ||
                        (p.image_url && p.image_url.startsWith('data:'))
                    );

                if (!currentPortfolioData) {
                    // No localStorage data at all — use file
                    currentPortfolioData = fileData;
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPortfolioData)); } catch (e) {}
                } else if (!localHasImages && fileData.lastUpdated && new Date(fileData.lastUpdated) > new Date(currentPortfolioData.lastUpdated || 0)) {
                    // File is newer and localStorage has no images — safe to use file
                    currentPortfolioData = fileData;
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPortfolioData)); } catch (e) {}
                }
                // Otherwise: localStorage has admin-uploaded images — keep localStorage data as-is
            }
        } catch (err) {
            console.warn("Could not fetch /data/niveshr_portfolio.json, using localStorage/initial fallback.");
        }

        // Step 3: Final fallback to PORTFOLIO_INITIAL_DATA if nothing else worked
        if (!currentPortfolioData) {
            currentPortfolioData = window.PORTFOLIO_INITIAL_DATA || getEmptyState();
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPortfolioData)); } catch (e) {}
        }

        isInitialized = true;
        return currentPortfolioData;
    }

    function getEmptyState() {
        return {
            about: {},
            education: [],
            experiences: [],
            skillCategories: [],
            projects: [],
            certificates: [],
            activities: [],
            contact: {},
            socialLinks: [],
            resume: {},
            navigation: [],
            lastUpdated: new Date().toISOString()
        };
    }

    // Get Synchronous snapshot
    function getStateSync() {
        if (currentPortfolioData) return currentPortfolioData;
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
            try {
                currentPortfolioData = JSON.parse(localRaw);
                return currentPortfolioData;
            } catch (e) { }
        }
        return window.PORTFOLIO_INITIAL_DATA || getEmptyState();
    }

    // Save Updated State safely handling QuotaExceededError
    function saveState(state, actionDesc, sectionName, recordTitle) {
        if (window.updateSaveIndicator) window.updateSaveIndicator(true);
        state.lastUpdated = new Date().toISOString();
        currentPortfolioData = state;

        // Try saving to localStorage safely
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            localStorage.setItem('nivesh_admin_portfolio_data', JSON.stringify(state));
        } catch (err) {
            console.warn("localStorage quota exceeded for full payload. Clearing old storage & persisting via backend API...", err);
            try {
                localStorage.removeItem('nivesh_admin_audit_logs');
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.warn("Could not write full payload to localStorage due to browser quota limit. Data stored in memory and sent to backend server.");
            }
        }

        // Real-time broadcast to all open browser windows / tabs
        window.dispatchEvent(new CustomEvent('cms_data_updated', { detail: state }));
        try {
            const bc = new BroadcastChannel('portfolio_cms_channel');
            bc.postMessage({ type: 'CMS_UPDATED', state: state });
            bc.close();
        } catch (e) { }

        // Attempt backend API write to api/index.js (when running under Express/Vercel, not Live Server)
        const isExpressServer = window.location.port !== '5500' && window.location.port !== '5501' && window.location.protocol !== 'file:';
        if (isExpressServer) {
            try {
                fetch('/api/portfolio', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + getAuthToken()
                    },
                    body: JSON.stringify(state)
                }).then(r => r.ok ? r.json() : null).then(res => {
                    if (res && res.success) {
                        console.log('[CMS] Portfolio data persisted to disk via API.');
                    }
                }).catch(() => { });
            } catch (e) { }
        }

        if (actionDesc && sectionName) {
            logAdminActivity(actionDesc, sectionName, 'UPDATE', recordTitle);
        }

        setTimeout(() => {
            if (window.updateSaveIndicator) window.updateSaveIndicator(false);
        }, 400);
    }

    // Export / Download niveshr_portfolio.json
    function exportJSON() {
        const state = getStateSync();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "niveshr_portfolio.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        logAdminActivity("Exported data/niveshr_portfolio.json file", "System", "EXPORT");
    }

    // Audit Logging
    function logAdminActivity(action, section, actionType, recordTitle) {
        const logs = getAdminLogs();
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const newLog = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            action: action,
            section: section || 'Portfolio CMS',
            recordTitle: recordTitle || '',
            actionType: actionType || 'UPDATE',
            adminName: 'Nivesh R',
            timestamp: `${formattedDate}, ${formattedTime}`
        };
        logs.unshift(newLog);
        if (logs.length > 100) logs.pop();
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    }

    function getAdminLogs() {
        const raw = localStorage.getItem(LOGS_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function clearAdminLogs() {
        localStorage.removeItem(LOGS_KEY);
        window.dispatchEvent(new CustomEvent('cms_data_updated'));
    }

    // Contact Messages Inbox Store
    function getMessages() {
        const raw = localStorage.getItem(MESSAGES_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function saveMessage(name, email, message) {
        const messages = getMessages();
        const newMsg = {
            id: 'msg-' + Date.now(),
            name: name,
            email: email,
            message: message,
            status: 'unread',
            createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
        messages.unshift(newMsg);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        return newMsg;
    }

    function updateMessageStatus(id, status) {
        const messages = getMessages();
        const msg = messages.find(m => m.id === id);
        if (msg) {
            msg.status = status;
            localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
        }
    }

    function deleteMessage(id) {
        let messages = getMessages();
        messages = messages.filter(m => m.id !== id);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    }

    // Security Logs Store
    function getSecurityLogs() {
        const raw = localStorage.getItem(SECURITY_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function logSecurityEvent(eventType, ip, status) {
        const logs = getSecurityLogs();
        logs.unshift({
            id: 'sec-' + Date.now(),
            eventType: eventType,
            ip: ip || '127.0.0.1',
            status: status || 'SUCCESS',
            timestamp: new Date().toLocaleString()
        });
        if (logs.length > 50) logs.pop();
        localStorage.setItem(SECURITY_KEY, JSON.stringify(logs));
    }

    function validatePortfolioSchema(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { valid: false, message: 'JSON root must be an Object.' };
        }
        if (!data.about || typeof data.about !== 'object') {
            return { valid: false, message: 'Missing or invalid "about" section object.' };
        }
        if (data.education && !Array.isArray(data.education)) {
            return { valid: false, message: '"education" field must be an Array.' };
        }
        if (data.experiences && !Array.isArray(data.experiences) && !Array.isArray(data.experience)) {
            return { valid: false, message: '"experiences" field must be an Array.' };
        }
        if (data.skillCategories && !Array.isArray(data.skillCategories) && !Array.isArray(data.skills)) {
            return { valid: false, message: '"skillCategories" field must be an Array.' };
        }
        if (data.projects && !Array.isArray(data.projects)) {
            return { valid: false, message: '"projects" field must be an Array.' };
        }
        if (data.certificates && !Array.isArray(data.certificates)) {
            return { valid: false, message: '"certificates" field must be an Array.' };
        }
        if (data.activities && !Array.isArray(data.activities)) {
            return { valid: false, message: '"activities" field must be an Array.' };
        }
        return { valid: true, message: 'JSON Schema is valid.' };
    }

    function importJSON(jsonData, fileName) {
        const validation = validatePortfolioSchema(jsonData);
        if (!validation.valid) {
            return { success: false, error: validation.message };
        }

        const fullData = {
            about: jsonData.about || {},
            education: Array.isArray(jsonData.education) ? jsonData.education : [],
            experiences: Array.isArray(jsonData.experiences) ? jsonData.experiences : (Array.isArray(jsonData.experience) ? jsonData.experience : []),
            skillCategories: Array.isArray(jsonData.skillCategories) ? jsonData.skillCategories : (Array.isArray(jsonData.skills) ? jsonData.skills : []),
            projects: Array.isArray(jsonData.projects) ? jsonData.projects : [],
            certificates: Array.isArray(jsonData.certificates) ? jsonData.certificates : [],
            activities: Array.isArray(jsonData.activities) ? jsonData.activities : [],
            contact: jsonData.contact || {},
            socialLinks: Array.isArray(jsonData.socialLinks) ? jsonData.socialLinks : [],
            quickLinks: Array.isArray(jsonData.quickLinks) ? jsonData.quickLinks : [],
            resume: jsonData.resume || {},
            lastUpdated: new Date().toISOString()
        };

        // Also persist import to server disk via authenticated API
        const isExpressServer = window.location.port !== '5500' && window.location.port !== '5501' && window.location.protocol !== 'file:';
        if (isExpressServer) {
            fetch('/api/portfolio/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getAuthToken()
                },
                body: JSON.stringify(fullData)
            }).then(r => r.ok ? r.json() : null).then(res => {
                if (res && res.success) console.log('[CMS] Import persisted to disk via API.');
            }).catch(() => {});
        }

        saveState(fullData, 'Imported portfolio JSON', 'Portfolio CMS', fileName || 'niveshr_portfolio.json');
        return { success: true, data: fullData, message: 'Import successful & all changes saved!' };
    }

    // Expose API globally
    window.CMS_STORE = {
        init: initCMSStore,
        getState: getStateSync,
        saveState: saveState,
        importJSON: importJSON,
        validateSchema: validatePortfolioSchema,
        exportJSON: exportJSON,
        logAdminActivity: logAdminActivity,
        getAdminLogs: getAdminLogs,
        clearAdminLogs: clearAdminLogs,
        getMessages: getMessages,
        saveMessage: saveMessage,
        updateMessageStatus: updateMessageStatus,
        deleteMessage: deleteMessage,
        getSecurityLogs: getSecurityLogs,
        logSecurityEvent: logSecurityEvent,
        resetToDefaults: function () {
            const defaultData = window.PORTFOLIO_INITIAL_DATA || getEmptyState();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            currentPortfolioData = defaultData;
            saveState(defaultData, "Reset Portfolio Data to Defaults", "Portfolio CMS", "Defaults");
            return defaultData;
        }
    };

    // Auto-init on script load
    initCMSStore();
})();
