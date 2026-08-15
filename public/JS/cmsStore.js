/* ==========================================================================
   NIVESH PORTFOLIO — CMS STORE ENGINE (JS/cmsStore.js)
   Source of Truth: /api/portfolio (GitHub REST API or Local File)
   localStorage is used as a UI cache for instant zero-flicker re-renders.
   ========================================================================== */

(function () {
    'use strict';

    // NOTE: this key must stay in sync with the cache key used in script.js
    // (the public site's read-only fallback cache) — otherwise the public
    // page and the admin CMS can drift out of sync when the API is unreachable.
    const STORAGE_KEY = 'nivesh_portfolio_cache_v7';
    const AUTH_TOKEN_KEY = 'nivesh_admin_auth_token';

    function safeGetSessionStorage(key) {
        try { return sessionStorage.getItem(key) || ''; } catch (e) { return ''; }
    }
    function safeSetSessionStorage(key, val) {
        try { sessionStorage.setItem(key, val); } catch (e) { }
    }
    function safeGetLocalStorage(key) {
        try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
    }
    function safeSetLocalStorage(key, val) {
        try { localStorage.setItem(key, val); } catch (e) { }
    }

    function getAuthToken() {
        return safeGetSessionStorage(AUTH_TOKEN_KEY);
    }

    function authHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getAuthToken()
        };
    }

    /**
     * Wraps fetch() for authenticated admin endpoints. If the server responds
     * 401 (expired/invalid session), clears the stale token and broadcasts a
     * 'cms_session_expired' event so the admin UI can show the login screen
     * instead of silently failing every subsequent save.
     */
    async function apiFetch(url, options) {
        const res = await fetch(url, options);
        if (res.status === 401) {
            try { sessionStorage.removeItem(AUTH_TOKEN_KEY); } catch (e) { }
            window.dispatchEvent(new CustomEvent('cms_session_expired'));
        }
        return res;
    }

    let currentPortfolioData = null;
    let isInitialized = false;

    // ── Init CMS Store ────────────────────────────────────────────────────────
    async function initCMSStore() {
        if (isInitialized && currentPortfolioData) return currentPortfolioData;

        // Step 1: Render local cache immediately for instant UI
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
            try {
                currentPortfolioData = JSON.parse(localRaw);
            } catch (e) { }
        }

        // Step 2: Fetch fresh data from API (/api/portfolio)
        try {
            const res = await fetch('/api/portfolio');
            if (res.ok) {
                const apiData = await res.json();
                if (apiData && apiData.about) {
                    currentPortfolioData = apiData;
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(apiData)); } catch (e) { }
                }
            }
        } catch (err) {
            console.warn('[CMS] Could not reach /api/portfolio. Using cache.', err.message);
        }

        // Step 3: Fallback to bundled window.PORTFOLIO_INITIAL_DATA if present
        if (!currentPortfolioData) {
            currentPortfolioData = window.PORTFOLIO_INITIAL_DATA || getEmptyState();
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
            quickLinks: [],
            resume: {},
            navigation: [],
            lastUpdated: new Date().toISOString()
        };
    }

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

    // ── Save State ─────────────────────────────────────────────────────────────
    async function saveState(state, actionDesc, sectionName, recordTitle) {
        if (window.updateSaveIndicator) window.updateSaveIndicator(true);

        state.lastUpdated = new Date().toISOString();
        currentPortfolioData = state;

        // Update local cache
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) { }

        // Broadcast to tabs
        window.dispatchEvent(new CustomEvent('cms_data_updated', { detail: state }));

        // Persist via PUT /api/portfolio
        let persisted = false;
        try {
            const res = await apiFetch('/api/portfolio', {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(state)
            });
            if (res.ok) {
                persisted = true;
                console.log('[CMS] Portfolio persisted successfully.');
            } else if (res.status !== 401) {
                // 401 is already handled by apiFetch (session-expired event)
                const errJson = await res.json().catch(() => ({}));
                console.warn('[CMS] API save failed:', res.status, errJson.message || errJson.error || '');
                if (window.showAdminToast) {
                    window.showAdminToast('⚠️ Changes saved locally but failed to sync to the server. Check your connection and try again.', 'error');
                }
            }
        } catch (e) {
            console.warn('[CMS] API save failed:', e.message);
            if (window.showAdminToast) {
                window.showAdminToast('⚠️ Changes saved locally but failed to sync to the server. Check your connection and try again.', 'error');
            }
        }

        if (actionDesc && sectionName) {
            logAdminActivity(actionDesc, sectionName, 'UPDATE', recordTitle);
        }

        setTimeout(() => {
            if (window.updateSaveIndicator) window.updateSaveIndicator(false);
        }, 400);

        return persisted;
    }

    // ── Export JSON ────────────────────────────────────────────────────────────
    function exportJSON() {
        const state = getStateSync();
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
        const a = document.createElement('a');
        a.setAttribute('href', dataStr);
        a.setAttribute('download', 'niveshr_portfolio.json');
        document.body.appendChild(a);
        a.click();
        a.remove();
        logAdminActivity('Exported niveshr_portfolio.json', 'System', 'EXPORT');
    }

    // ── Activity Logging ───────────────────────────────────────────────────────
    function logAdminActivity(action, section, actionType, recordTitle) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const entry = {
            action,
            section: section || 'Portfolio CMS',
            recordTitle: recordTitle || '',
            actionType: actionType || 'UPDATE',
            adminName: 'Nivesh R',
            timestamp: `${formattedDate}, ${formattedTime}`
        };

        apiFetch('/api/logs', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(entry)
        }).catch(() => { });
    }

    async function getAdminLogs() {
        try {
            const res = await apiFetch('/api/logs', { headers: authHeaders() });
            if (res.ok) {
                const json = await res.json();
                return json.logs || [];
            }
        } catch (e) { }
        return [];
    }

    async function clearAdminLogs() {
        try {
            await apiFetch('/api/logs', { method: 'DELETE', headers: authHeaders() });
        } catch (e) { }
        window.dispatchEvent(new CustomEvent('cms_data_updated'));
    }

    // ── Messages ──────────────────────────────────────────────────────────────
    async function getMessages() {
        try {
            const res = await apiFetch('/api/messages', { headers: authHeaders() });
            if (res.ok) {
                const json = await res.json();
                return (json.messages || []).map(m => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    message: m.message,
                    status: m.status || 'unread',
                    createdAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    }) : ''
                }));
            }
        } catch (e) { }
        return [];
    }

    async function saveMessage(name, email, message) {
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            if (res.ok) {
                const json = await res.json();
                return { id: json.id, name, email, message, status: 'unread' };
            }
        } catch (e) { }
        return null;
    }

    async function updateMessageStatus(id, status) {
        try {
            await apiFetch('/api/messages/' + id, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status })
            });
        } catch (e) { }
    }

    async function deleteMessage(id) {
        try {
            await apiFetch('/api/messages/' + id, {
                method: 'DELETE',
                headers: authHeaders()
            });
        } catch (e) { }
    }

    // ── Security Logs (Local Storage) ──────────────────────────────────────────
    const SECURITY_KEY = 'nivesh_admin_security_logs';

    function getSecurityLogs() {
        const raw = localStorage.getItem(SECURITY_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function logSecurityEvent(eventType, ip, status) {
        const logs = getSecurityLogs();
        logs.unshift({
            id: 'sec-' + Date.now(),
            eventType,
            ip: ip || '127.0.0.1',
            status: status || 'SUCCESS',
            timestamp: new Date().toLocaleString()
        });
        if (logs.length > 50) logs.pop();
        localStorage.setItem(SECURITY_KEY, JSON.stringify(logs));
    }

    // ── Schema Validation & Import ─────────────────────────────────────────────
    function validatePortfolioSchema(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { valid: false, message: 'JSON root must be an Object.' };
        }
        if (!data.about || typeof data.about !== 'object') {
            return { valid: false, message: 'Missing or invalid "about" section object.' };
        }
        return { valid: true, message: 'JSON Schema is valid.' };
    }

    async function importJSON(jsonData, fileName) {
        const validation = validatePortfolioSchema(jsonData);
        if (!validation.valid) {
            return { success: false, error: validation.message };
        }

        try {
            const res = await apiFetch('/api/portfolio/import', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(jsonData)
            });
            if (res.ok) {
                console.log('[CMS] Import persisted.');
            }
        } catch (e) { }

        await saveState(jsonData, 'Imported portfolio JSON', 'Portfolio CMS', fileName || 'niveshr_portfolio.json');
        return { success: true, data: jsonData, message: 'Import successful & all changes saved!' };
    }

    // ── One-Time Migration from localStorage ──────────────────────────────────
    async function migrateFromLocalStorage() {
        const portfolioRaw = localStorage.getItem('nivesh_portfolio_file_cms_data_v3') ||
            localStorage.getItem('nivesh_admin_portfolio_data');
        const portfolioData = portfolioRaw ? JSON.parse(portfolioRaw) : null;

        const messagesRaw = localStorage.getItem('nivesh_admin_messages');
        const messages = messagesRaw ? JSON.parse(messagesRaw) : [];

        const logsRaw = localStorage.getItem('nivesh_admin_activity_logs');
        const logs = logsRaw ? JSON.parse(logsRaw) : [];

        const analyticsRaw = localStorage.getItem('nivesh_admin_analytics');
        const analytics = analyticsRaw ? JSON.parse(analyticsRaw) : null;

        try {
            const res = await apiFetch('/api/migrate', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ portfolioData, messages, logs, analytics })
            });
            const json = await res.json();
            if (json && json.success) {
                console.log('[CMS] Migration complete:', json.results);
                return { success: true, results: json.results };
            }
            return { success: false, message: json.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    // ── Expose Global API ─────────────────────────────────────────────────────
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
        migrateFromLocalStorage: migrateFromLocalStorage,
        resetToDefaults: async function () {
            const defaultData = window.PORTFOLIO_INITIAL_DATA || getEmptyState();
            await saveState(defaultData, 'Reset Portfolio Data to Defaults', 'Portfolio CMS', 'Defaults');
            return defaultData;
        }
    };

    // Auto-init on script load
    initCMSStore();
})();
