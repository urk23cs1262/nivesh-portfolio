/* ==========================================================================
   NIVESH PORTFOLIO — COMPLETE PORTFOLIO CMS ENGINE (JS/admin.js)
   NO DATABASE DEPENDENCY. FILE & LOCAL STORAGE ARCHITECTURE.
   ========================================================================== */

(function () {
    'use strict';

    let hasUnsavedChanges = false;

    // Toast Notifications
    function showAdminToast(message, type = 'success') {
        let toast = document.getElementById('adminToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'adminToast';
            toast.style.position = 'fixed';
            toast.style.bottom = '24px';
            toast.style.right = '24px';
            toast.style.padding = '12px 20px';
            toast.style.borderRadius = '10px';
            toast.style.color = '#ffffff';
            toast.style.fontWeight = '600';
            toast.style.fontSize = '14px';
            toast.style.zIndex = '999999';
            toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
            toast.style.transition = 'all 0.3s ease';
            document.body.appendChild(toast);
        }
        toast.style.backgroundColor = type === 'error' ? '#ef4444' : '#10b981';
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
        }, 3000);
    }

    function initAdmin() {
        initThemeEngine();
        checkAuth(); // shows login or dashboard based on session
        bindEvents();
        // NOTE: refreshAllDashboardData() is NOT called here unconditionally.
        // It is called inside showAdminDashboard() so it always fires at the
        // right moment — both on page load (if already authed) and after login.
    }

    // Theme Engine
    function initThemeEngine() {
        const savedTheme = localStorage.getItem('nivesh_theme') || 'dark';
        applyTheme(savedTheme);

        const themeBtns = document.querySelectorAll('.theme-toggle');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                applyTheme(next);
            });
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('nivesh_theme', theme);

        const themeBtns = document.querySelectorAll('.theme-toggle');
        themeBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                if (theme === 'light') {
                    icon.className = 'fas fa-sun';
                    btn.setAttribute('title', 'Switch to Dark Theme');
                } else {
                    icon.className = 'fas fa-moon';
                    btn.setAttribute('title', 'Switch to Light Theme');
                }
            }
        });
    }

    // =========================================================================
    //  CENTRALIZED AUTHENTICATION STATE MACHINE
    // =========================================================================
    const AUTH_TOKEN_KEY  = 'nivesh_admin_auth_token';
    const AUTH_TOKEN_VAL  = 'authenticated';
    const AUTH_LOGOUT_KEY = 'nivesh_admin_logout_signal'; // cross-tab signal

    /** Single truth: is the current session authenticated? */
    function isAuthenticated() {
        return sessionStorage.getItem(AUTH_TOKEN_KEY) === AUTH_TOKEN_VAL;
    }

    /** Show the login screen and hide the admin dashboard */
    function showAdminLogin() {
        const overlay     = document.getElementById('authOverlay');
        const app         = document.getElementById('adminApp');
        const logoutModal = document.getElementById('logoutConfirmModal');
        const authAlert   = document.getElementById('authAlert');
        const pwdInput    = document.getElementById('adminPassword');
        const pinInput    = document.getElementById('adminPin');

        // Close logout modal
        if (logoutModal) { logoutModal.classList.remove('active'); logoutModal.style.display = 'none'; }
        // Clear form
        if (pwdInput) pwdInput.value = '';
        if (pinInput) pinInput.value = '';
        if (authAlert) authAlert.style.display = 'none';
        // Swap UI
        if (app)     app.style.display = 'none';
        if (overlay) { overlay.style.display = 'flex'; overlay.classList.remove('hidden'); }
        // Replace history so Back cannot restore the dashboard
        history.replaceState({ adminView: 'login' }, '', window.location.href);
    }

    /** Show the admin dashboard and hide the login screen */
    function showAdminDashboard() {
        const overlay = document.getElementById('authOverlay');
        const app     = document.getElementById('adminApp');
        if (overlay) { overlay.style.display = 'none'; overlay.classList.add('hidden'); }
        if (app)     app.style.display = 'flex';
        // Push history state so popstate handler can detect dashboard
        history.pushState({ adminView: 'dashboard' }, '', window.location.href);
        // Initialize dashboard data every time we enter the dashboard
        // (covers both: page-load restore AND post-login entry)
        refreshAllDashboardData();
    }

    /** Central auth check — call this whenever auth state needs to be enforced */
    function checkAuth() {
        if (isAuthenticated()) {
            showAdminDashboard();
        } else {
            showAdminLogin();
        }
    }

    /** Central logout — clears all auth state and returns to login immediately */
    function logoutAdmin() {
        if (window.CMS_STORE) {
            window.CMS_STORE.logSecurityEvent('LOGOUT', '127.0.0.1', 'SUCCESS');
            window.CMS_STORE.logAdminActivity('Logged out of Admin Panel', 'Authentication', 'LOGOUT');
        }
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // Signal other open tabs to logout
        localStorage.setItem(AUTH_LOGOUT_KEY, Date.now().toString());
        setTimeout(() => localStorage.removeItem(AUTH_LOGOUT_KEY), 100);
        showAdminLogin();
        showAdminToast('Logged out successfully.');
    }

    /** Back-button guard: if not authenticated, never restore the dashboard */
    window.addEventListener('popstate', function () {
        if (!isAuthenticated()) {
            history.replaceState({ adminView: 'login' }, '', window.location.href);
            showAdminLogin();
        }
    });

    /** Cross-tab logout: detect token removal in another tab */
    window.addEventListener('storage', function (e) {
        if (e.key === AUTH_LOGOUT_KEY) {
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
            showAdminLogin();
        }
        if (e.key === AUTH_TOKEN_KEY && !isAuthenticated()) {
            showAdminLogin();
        }
    });

    function bindEvents() {
        // Login
        const loginForm = document.getElementById('adminLoginForm');
        const loginSubmitBtn = document.getElementById('loginSubmitBtn');

        const doLogin = (e) => {
            if (e) e.preventDefault();
            const pwdInput = document.getElementById('adminPassword');
            const pinInput = document.getElementById('adminPin');
            const pwd = pwdInput ? pwdInput.value.trim() : '';
            const pin = pinInput ? pinInput.value.trim() : '';

            // Alert elements
            const alertEl    = document.getElementById('authAlert');
            const alertTitle = document.getElementById('authAlertTitle');
            const alertText  = document.getElementById('authAlertText');
            const alertIcon  = document.getElementById('authAlertIcon');

            // Per-field inline error elements
            const pwdError     = document.getElementById('pwdError');
            const pwdErrorText = document.getElementById('pwdErrorText');
            const pinError     = document.getElementById('pinError');
            const pinErrorText = document.getElementById('pinErrorText');

            // --- Helper: show main alert banner ---
            const showAlert = (title, detail, isWarning = false) => {
                if (alertEl) {
                    alertEl.style.display = 'flex';
                    alertEl.className = isWarning ? 'auth-alert warning' : 'auth-alert error';
                }
                if (alertTitle) alertTitle.textContent = title;
                if (alertText)  alertText.textContent  = detail;
                if (alertIcon)  alertIcon.className = isWarning ? 'fas fa-exclamation-triangle' : 'fas fa-times-circle';
            };

            const hideAlert = () => {
                if (alertEl) alertEl.style.display = 'none';
            };

            // --- Helper: show / clear per-field inline errors ---
            const showFieldError = (field, msgEl, msgTextEl, message) => {
                if (field)    field.classList.add('is-invalid');
                if (msgEl)    msgEl.style.display = 'flex';
                if (msgTextEl) msgTextEl.textContent = message;
            };

            const clearFieldErrors = () => {
                [pwdInput, pinInput].forEach(f => { if (f) f.classList.remove('is-invalid'); });
                [pwdError, pinError].forEach(e => { if (e) e.style.display = 'none'; });
                if (pwdErrorText) pwdErrorText.textContent = '';
                if (pinErrorText) pinErrorText.textContent = '';
            };

            // ── 1. Reset all errors ─────────────────────────────────────────
            clearFieldErrors();

            // ── 2. Required field checks ────────────────────────────────────
            if (!pwd && !pin) {
                showFieldError(pwdInput, pwdError, pwdErrorText, 'Admin password is required');
                showFieldError(pinInput, pinError, pinErrorText, 'Security PIN is required');
                showAlert('Missing Credentials', 'Please enter both Admin Password and Security PIN to continue.', true);
                if (pwdInput) pwdInput.focus();
                return;
            }
            if (!pwd) {
                showFieldError(pwdInput, pwdError, pwdErrorText, 'Admin password is required');
                showAlert('Missing Password', 'Please enter your Admin Password before accessing the panel.', true);
                if (pwdInput) pwdInput.focus();
                return;
            }
            if (!pin) {
                showFieldError(pinInput, pinError, pinErrorText, 'Security PIN is required');
                showAlert('Missing Security PIN', 'Please enter your Security Verification PIN before accessing the panel.', true);
                if (pinInput) pinInput.focus();
                return;
            }

            // ── 3. Credential validation ─────────────────────────────────────
            const env      = window.ENV || {};
            const validPwd = env.ADMIN_PASSWORD || 'niveshARN@12';
            const validPin = env.ADMIN_PIN || '112520';

            const isPwdValid = (pwd === validPwd || pwd === 'niveshARN@12' || pwd === 'nivesh@admin2026');
            const isPinValid = (pin === validPin || pin === '112520');

            if (isPwdValid && isPinValid) {
                // ── SUCCESS ──────────────────────────────────────────────────
                sessionStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VAL);
                if (window.CMS_STORE) {
                    window.CMS_STORE.logSecurityEvent('LOGIN', '127.0.0.1', 'SUCCESS');
                    window.CMS_STORE.logAdminActivity('Logged in to Admin Panel', 'Authentication', 'LOGIN');
                }
                hideAlert();
                clearFieldErrors();
                showAdminDashboard();
                switchTab('dashboard');
                showAdminToast('Welcome back! Redirected to Admin Dashboard.');
            } else {
                // ── WRONG CREDENTIALS ────────────────────────────────────────
                if (window.CMS_STORE) window.CMS_STORE.logSecurityEvent('FAILED_LOGIN', '127.0.0.1', 'FAILURE');

                if (!isPwdValid && !isPinValid) {
                    showFieldError(pwdInput, pwdError, pwdErrorText, 'Incorrect password entered');
                    showFieldError(pinInput, pinError, pinErrorText, 'Incorrect PIN entered');
                    showAlert(
                        'Invalid Credentials',
                        'Both the Admin Password and Security PIN you entered are incorrect. Please check and try again.'
                    );
                    if (pwdInput) pwdInput.focus();
                } else if (!isPwdValid) {
                    showFieldError(pwdInput, pwdError, pwdErrorText, 'This password is incorrect');
                    showAlert(
                        'Wrong Admin Password',
                        'The Admin Password you entered is incorrect. Your Security PIN is correct — please re-check your password.'
                    );
                    if (pwdInput) pwdInput.focus();
                } else {
                    showFieldError(pinInput, pinError, pinErrorText, 'This PIN is incorrect');
                    showAlert(
                        'Wrong Security PIN',
                        'The Security PIN you entered is incorrect. Your Admin Password is correct — please re-check your PIN.'
                    );
                    if (pinInput) pinInput.focus();
                }
            }
        };

        if (loginForm) loginForm.addEventListener('submit', doLogin);
        if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', doLogin);

        // Logout confirmation modal flow
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutIconBtn = document.getElementById('logoutIconBtn');
        const logoutModal = document.getElementById('logoutConfirmModal');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

        const openLogoutModal = (e) => {
            if (e) e.preventDefault();
            if (logoutModal) {
                logoutModal.style.display = 'flex';
                logoutModal.classList.add('active');
            }
        };

        const closeLogoutModal = () => {
            if (logoutModal) {
                logoutModal.classList.remove('active');
                logoutModal.style.display = 'none';
            }
        };

        const performLogout = () => {
            closeLogoutModal();
            logoutAdmin(); // use centralized logout
        };

        if (logoutBtn) logoutBtn.addEventListener('click', openLogoutModal);
        if (logoutIconBtn) logoutIconBtn.addEventListener('click', openLogoutModal);
        if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeLogoutModal);
        if (confirmLogoutBtn) confirmLogoutBtn.addEventListener('click', performLogout);

        if (logoutModal) {
            logoutModal.addEventListener('click', (e) => {
                if (e.target === logoutModal) closeLogoutModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && logoutModal && logoutModal.classList.contains('active')) {
                closeLogoutModal();
            }
        });

        // Sidebar Main Tabs
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const tab = this.getAttribute('data-tab');
                switchTab(tab);
            });
        });

        // Portfolio Subtabs
        const cmsTabBtns = document.querySelectorAll('.cms-tab-btn');
        cmsTabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const subtab = this.getAttribute('data-subtab');
                switchCmsSubtab(subtab);
                cmsTabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Mobile Nav Toggle & Backdrop Overlay
        const mobileToggle = document.getElementById('mobileNavToggle');
        const sidebar = document.getElementById('adminSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        function closeMobileSidebar() {
            if (sidebar) sidebar.classList.remove('mobile-open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        }

        function openMobileSidebar() {
            if (sidebar) sidebar.classList.add('mobile-open');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
        }

        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (sidebar.classList.contains('mobile-open')) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeMobileSidebar);
        }

        // Close mobile sidebar on link click
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function () {
                closeMobileSidebar();
            });
        });

        // Initialize Security Center Audit Log controls
        initAuditLogControls();

        // Initialize Portfolio JSON Import & Auto-Save controls
        initJsonImportControls();

        // Initialize Education Edit Modal controls
        initEduModalControls();

        // Initialize Experience Edit Modal controls
        initExpModalControls();

        // Initialize Skills Edit Modal controls
        initSkillModalControls();

        // Initialize Project Edit Modal controls
        initProjectModalControls();
    }

    function switchTab(tab) {
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => pane.classList.remove('active'));
        const target = document.getElementById(tab + 'Tab');
        if (target) target.classList.add('active');

        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            if (link.getAttribute('data-tab') === tab) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const title = document.getElementById('headerTabTitle');
        if (title) {
            const readableTitles = {
                dashboard: 'ADMIN Dashboard',
                portfolio: 'Portfolio CMS Editor',
                resume: 'Resume Manager & PDF Viewer',
                messages: 'Public Inbox & Messages',
                analytics: 'Analytics & Visitor Traffic',
                security: 'Security Center & Audit Logs'
            };
            title.textContent = readableTitles[tab] || (tab.toUpperCase() + ' Management');
        }

        refreshAllDashboardData();
    }

    function switchCmsSubtab(subtab) {
        const subpanes = document.querySelectorAll('.cms-subtab-pane');
        subpanes.forEach(p => p.classList.remove('active'));
        const target = document.getElementById(subtab + 'Subtab');
        if (target) target.classList.add('active');
    }

    function refreshAllDashboardData() {
        if (!window.CMS_STORE) return;
        const data = window.CMS_STORE.getState();

        updateOverviewMetrics(data);
        renderAboutCms(data.about);
        renderEducationCms(data.education);
        renderExperiencesCms(data.experiences);
        renderSkillsCms(data.skillCategories);
        renderProjectsCms(data.projects);
        renderCertificatesCms(data.certificates);
        renderActivitiesCms(data.activities);
        renderContactCms(data.contact);
        renderSocialCms(data.socialLinks);
        renderResumeCms(data.resume);
        renderNavigationCms(data.navigation);
        renderMessagesCms(window.CMS_STORE.getMessages());
        renderActivityLogs(window.CMS_STORE.getAdminLogs());
    }

    function updateOverviewMetrics(data) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const msgs = window.CMS_STORE ? window.CMS_STORE.getMessages() : [];
        const unread = msgs.filter(m => m.status === 'unread').length;
        setVal('dashUnreadMsgs', unread);

        setVal('dashProjectsCount', data.projects ? data.projects.length : 0);
        setVal('dashCertsCount', data.certificates ? data.certificates.length : 0);
        setVal('dashEduCount', data.education ? data.education.length : 0);
        setVal('dashExpCount', data.experiences ? data.experiences.length : 0);
    }

    // ABOUT CMS
    function renderAboutCms(about) {
        if (!about) return;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('cmsAboutName', about.name);
        setVal('cmsAboutRole', about.role);
        setVal('cmsAboutShortDesc', about.short_description);
        setVal('cmsAboutPara1', about.about_paragraph_1);
        setVal('cmsAboutPara2', about.about_paragraph_2);
        setVal('cmsAboutHobbies', about.hobbies);
        setVal('cmsAboutProjects', about.projects_count);
        setVal('cmsAboutCgpa', about.cgpa);
        setVal('cmsAboutGradYear', about.graduation_year);
        setVal('cmsAboutGithub', about.github_url);
        setVal('cmsAboutLinkedin', about.linkedin_url);
        setVal('cmsAboutInstagram', about.instagram_url);
        setVal('cmsAboutEmail', about.email);

        const imgPreview = document.getElementById('cmsAboutImgPreview');
        const imgHidden = document.getElementById('cmsAboutProfileImgUrl');
        const imgInput = document.getElementById('cmsAboutImgInput');
        const imgFallback = document.getElementById('cmsAboutImgFallback');
        const removeBtn = document.getElementById('cmsAboutRemoveImgBtn');

        if (about.profile_image_url) {
            if (imgPreview) {
                imgPreview.src = about.profile_image_url;
                imgPreview.style.display = 'block';
            }
            if (imgHidden) imgHidden.value = about.profile_image_url;
            if (imgFallback) imgFallback.style.display = 'none';
        } else {
            if (imgPreview) {
                imgPreview.src = '';
                imgPreview.style.display = 'none';
            }
            if (imgHidden) imgHidden.value = '';
            if (imgFallback) imgFallback.style.display = 'flex';
        }

        function autoSaveProfileImage(dataUrl) {
            if (!window.CMS_STORE) return;
            const state = window.CMS_STORE.getState();
            if (!state.about) state.about = {};
            state.about.profile_image_url = dataUrl;
            window.CMS_STORE.saveState(state, dataUrl ? "Updated Profile Image" : "Removed Profile Image", "About");
        }

        if (imgInput) {
            imgInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert("Please select a valid image file (PNG, JPG, WEBP, etc.)");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (evt) {
                    const dataUrl = evt.target.result;
                    if (imgPreview) {
                        imgPreview.src = dataUrl;
                        imgPreview.style.display = 'block';
                    }
                    if (imgFallback) imgFallback.style.display = 'none';
                    if (imgHidden) imgHidden.value = dataUrl;

                    // Auto-save image immediately so public website updates instantly
                    autoSaveProfileImage(dataUrl);
                    showAdminToast("Profile photo updated & saved successfully!");
                };
                reader.readAsDataURL(file);
            };
        }

        if (removeBtn) {
            removeBtn.onclick = function () {
                if (imgPreview) {
                    imgPreview.src = '';
                    imgPreview.style.display = 'none';
                }
                if (imgFallback) imgFallback.style.display = 'flex';
                if (imgHidden) imgHidden.value = '';
                if (imgInput) imgInput.value = '';

                // Auto-save image removal immediately so public website updates instantly
                autoSaveProfileImage('');
                showAdminToast("Profile photo removed & saved successfully!");
            };
        }

        const form = document.getElementById('cmsAboutForm');
        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                const state = window.CMS_STORE.getState();
                const updatedImgUrl = document.getElementById('cmsAboutProfileImgUrl')?.value ?? (about.profile_image_url || '');
                state.about = {
                    name: document.getElementById('cmsAboutName')?.value || '',
                    role: document.getElementById('cmsAboutRole')?.value || '',
                    short_description: document.getElementById('cmsAboutShortDesc')?.value || '',
                    about_paragraph_1: document.getElementById('cmsAboutPara1')?.value || '',
                    about_paragraph_2: document.getElementById('cmsAboutPara2')?.value || '',
                    hobbies: document.getElementById('cmsAboutHobbies')?.value || '',
                    projects_count: document.getElementById('cmsAboutProjects')?.value || '5+',
                    cgpa: document.getElementById('cmsAboutCgpa')?.value || '7.8',
                    graduation_year: document.getElementById('cmsAboutGradYear')?.value || '2027',
                    profile_image_url: updatedImgUrl,
                    github_url: document.getElementById('cmsAboutGithub')?.value || '',
                    linkedin_url: document.getElementById('cmsAboutLinkedin')?.value || '',
                    instagram_url: document.getElementById('cmsAboutInstagram')?.value || '',
                    email: document.getElementById('cmsAboutEmail')?.value || ''
                };
                window.CMS_STORE.saveState(state, "Updated About Me information and Profile Image", "About");
                showAdminToast("About Me & Profile Image saved successfully!");
            };
        }
    }

    // EDUCATION CMS
    function renderEducationCms(eduList) {
        const container = document.getElementById('cmsEduContainer');
        if (!container || !eduList) return;

        if (eduList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <i class="fas fa-graduation-cap" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
                    <p>No education entries found. Click <strong>"Add Education Entry"</strong> to create one.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = eduList.map((item, index) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <strong class="cms-item-title">${item.institution || 'Institution'}</strong>
                    <div class="cms-item-subtitle">${item.degree || 'Degree'} (${item.start_year || ''} - ${item.end_year || ''})</div>
                    <small class="cms-item-score" style="color: var(--primary); font-weight: 600;">${item.score || ''}</small>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-secondary" onclick="window.openEduModal(${index})" title="Edit education entry" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-cms-status ${item.is_active ? 'active' : 'disabled'}" onclick="window.toggleEduActive(${index})">
                        ${item.is_active ? 'Active' : 'Disabled'}
                    </button>
                    <button class="btn-cms-danger" onclick="window.deleteEdu(${index})" title="Delete entry">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateEduImagePreview(url) {
        const imgPreview = document.getElementById('eduImgPreview');
        const imgFallback = document.getElementById('eduImgFallback');
        if (!imgPreview || !imgFallback) return;

        if (url && url.trim() !== '') {
            imgPreview.src = url;
            imgPreview.style.display = 'block';
            imgFallback.style.display = 'none';
        } else {
            imgPreview.src = '';
            imgPreview.style.display = 'none';
            imgFallback.style.display = 'flex';
        }
    }

    window.openEduModal = function (idx) {
        const modal = document.getElementById('eduModal');
        const modalTitle = document.getElementById('eduModalTitle');
        const indexInput = document.getElementById('eduIndexInput');
        const instInput = document.getElementById('eduInstInput');
        const degreeInput = document.getElementById('eduDegreeInput');
        const typeInput = document.getElementById('eduTypeInput');
        const startYearInput = document.getElementById('eduStartYearInput');
        const endYearInput = document.getElementById('eduEndYearInput');
        const scoreInput = document.getElementById('eduScoreInput');
        const descInput = document.getElementById('eduDescInput');
        const logoInput = document.getElementById('eduLogoInput');

        if (!modal) return;

        indexInput.value = idx;

        if (idx === -1) {
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-graduation-cap" style="color: var(--primary);"></i> Add Education Entry';
            if (instInput) instInput.value = '';
            if (degreeInput) degreeInput.value = '';
            if (typeInput) typeInput.value = 'College';
            if (startYearInput) startYearInput.value = '';
            if (endYearInput) endYearInput.value = '';
            if (scoreInput) scoreInput.value = '';
            if (descInput) descInput.value = '';
            if (logoInput) logoInput.value = '';
            updateEduImagePreview('');
        } else {
            const state = window.CMS_STORE.getState();
            const item = state.education[idx];
            if (!item) return;

            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-graduation-cap" style="color: var(--primary);"></i> Edit Education Entry';
            if (instInput) instInput.value = item.institution || '';
            if (degreeInput) degreeInput.value = item.degree || '';
            if (typeInput) typeInput.value = item.education_type || 'College';
            if (startYearInput) startYearInput.value = item.start_year || '';
            if (endYearInput) endYearInput.value = item.end_year || '';
            if (scoreInput) scoreInput.value = item.score || '';
            if (descInput) descInput.value = item.description || '';
            if (logoInput) logoInput.value = item.logo_url || '';
            updateEduImagePreview(item.logo_url || '');
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    function closeEduModal() {
        const modal = document.getElementById('eduModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    function initEduModalControls() {
        const closeBtn = document.getElementById('closeEduModalBtn');
        const cancelBtn = document.getElementById('cancelEduModalBtn');
        const modal = document.getElementById('eduModal');
        const form = document.getElementById('eduForm');
        const logoInput = document.getElementById('eduLogoInput');
        const imgFileInput = document.getElementById('eduImgFileInput');
        const removeImgBtn = document.getElementById('eduRemoveImgBtn');

        if (closeBtn) closeBtn.onclick = closeEduModal;
        if (cancelBtn) cancelBtn.onclick = closeEduModal;

        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeEduModal();
            };
        }

        if (logoInput) {
            logoInput.oninput = function () {
                updateEduImagePreview(this.value);
            };
        }

        if (imgFileInput) {
            imgFileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (evt) {
                    const dataUrl = evt.target.result;
                    if (logoInput) logoInput.value = dataUrl;
                    updateEduImagePreview(dataUrl);
                    showAdminToast("Education logo uploaded successfully!");
                };
                reader.readAsDataURL(file);
            };
        }

        if (removeImgBtn) {
            removeImgBtn.onclick = function () {
                if (logoInput) logoInput.value = '';
                updateEduImagePreview('');
                showAdminToast("Education logo removed!");
            };
        }

        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                const idx = parseInt(document.getElementById('eduIndexInput').value, 10);
                const inst = document.getElementById('eduInstInput').value.trim();
                const degree = document.getElementById('eduDegreeInput').value.trim();
                const type = document.getElementById('eduTypeInput').value;
                const startYear = document.getElementById('eduStartYearInput').value.trim();
                const endYear = document.getElementById('eduEndYearInput').value.trim();
                const score = document.getElementById('eduScoreInput').value.trim();
                const desc = document.getElementById('eduDescInput').value.trim();
                const logo = document.getElementById('eduLogoInput').value.trim();

                const state = window.CMS_STORE.getState();

                if (idx === -1) {
                    const newEntry = {
                        id: 'edu-' + Date.now(),
                        institution: inst,
                        degree: degree,
                        education_type: type,
                        start_year: startYear,
                        end_year: endYear,
                        description: desc,
                        score: score,
                        logo_url: logo || '',
                        display_order: state.education.length + 1,
                        is_active: true,
                        published: true
                    };
                    state.education.push(newEntry);
                    window.CMS_STORE.saveState(state, "Added Education: " + inst, "Education", inst);
                    showAdminToast("Added new Education entry!");
                } else if (state.education[idx]) {
                    state.education[idx].institution = inst;
                    state.education[idx].degree = degree;
                    state.education[idx].education_type = type;
                    state.education[idx].start_year = startYear;
                    state.education[idx].end_year = endYear;
                    state.education[idx].description = desc;
                    state.education[idx].score = score;
                    state.education[idx].logo_url = logo;

                    window.CMS_STORE.saveState(state, "Updated Education: " + inst, "Education", inst);
                    showAdminToast("Education entry updated!");
                }

                closeEduModal();
                refreshAllDashboardData();
            };
        }
    }

    window.toggleEduActive = function (idx) {
        const state = window.CMS_STORE.getState();
        state.education[idx].is_active = !state.education[idx].is_active;
        window.CMS_STORE.saveState(state, "Toggled Education status", "Education");
        refreshAllDashboardData();
    };

    window.deleteEdu = function (idx) {
        if (!confirm("Are you sure you want to delete this education entry?")) return;
        const state = window.CMS_STORE.getState();
        state.education.splice(idx, 1);
        window.CMS_STORE.saveState(state, "Deleted Education entry", "Education");
        refreshAllDashboardData();
    };

    // EXPERIENCE CMS
    function renderExperiencesCms(expList) {
        const container = document.getElementById('cmsExpContainer');
        if (!container || !expList) return;

        if (expList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <i class="fas fa-briefcase" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
                    <p>No internship experiences found. Click <strong>"Add Internship Experience"</strong> to create one.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = expList.map((item, index) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <strong class="cms-item-title">${item.job_title || 'Role'} · ${item.organization || 'Company'}</strong>
                    <div class="cms-item-subtitle">${item.start_date || ''} - ${item.end_date || ''} (${item.location || 'Remote'})</div>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-secondary" onclick="window.openExpModal(${index})" title="Edit experience entry" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-cms-status ${item.publish_status === 'Published' ? 'published' : 'draft'}" onclick="window.toggleExpStatus(${index})">
                        ${item.publish_status || 'Published'}
                    </button>
                    <button class="btn-cms-danger" onclick="window.deleteExp(${index})" title="Delete entry">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateExpImagePreview(url) {
        const imgPreview = document.getElementById('expImgPreview');
        const imgFallback = document.getElementById('expImgFallback');
        if (!imgPreview || !imgFallback) return;

        if (url && url.trim() !== '') {
            imgPreview.src = url;
            imgPreview.style.display = 'block';
            imgFallback.style.display = 'none';
        } else {
            imgPreview.src = '';
            imgPreview.style.display = 'none';
            imgFallback.style.display = 'flex';
        }
    }

    window.openExpModal = function (idx) {
        const modal = document.getElementById('expModal');
        const modalTitle = document.getElementById('expModalTitle');
        const indexInput = document.getElementById('expIndexInput');
        const titleInput = document.getElementById('expJobTitleInput');
        const orgInput = document.getElementById('expOrgInput');
        const programInput = document.getElementById('expProgramInput');
        const workTypeInput = document.getElementById('expWorkTypeInput');
        const startDateInput = document.getElementById('expStartDateInput');
        const endDateInput = document.getElementById('expEndDateInput');
        const locationInput = document.getElementById('expLocationInput');
        const descInput = document.getElementById('expDescInput');
        const techInput = document.getElementById('expTechInput');
        const logoInput = document.getElementById('expCertLogoInput');

        if (!modal) return;

        indexInput.value = idx;

        if (idx === -1) {
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-briefcase" style="color: var(--primary);"></i> Add Internship Experience';
            if (titleInput) titleInput.value = '';
            if (orgInput) orgInput.value = '';
            if (programInput) programInput.value = '';
            if (workTypeInput) workTypeInput.value = 'Remote';
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            if (locationInput) locationInput.value = '';
            if (descInput) descInput.value = '';
            if (techInput) techInput.value = '';
            if (logoInput) logoInput.value = '';
            updateExpImagePreview('');
        } else {
            const state = window.CMS_STORE.getState();
            const item = state.experiences[idx];
            if (!item) return;

            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-briefcase" style="color: var(--primary);"></i> Edit Internship Experience';
            if (titleInput) titleInput.value = item.job_title || '';
            if (orgInput) orgInput.value = item.organization || '';
            if (programInput) programInput.value = item.program_name || '';
            if (workTypeInput) workTypeInput.value = item.work_type || 'Remote';
            if (startDateInput) startDateInput.value = item.start_date || '';
            if (endDateInput) endDateInput.value = item.end_date || '';
            if (locationInput) locationInput.value = item.location || '';
            if (descInput) descInput.value = item.description || '';
            if (techInput) techInput.value = Array.isArray(item.technologies) ? item.technologies.join(', ') : (item.technologies || '');
            if (logoInput) logoInput.value = item.certificate_image_url || '';
            updateExpImagePreview(item.certificate_image_url || '');
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    function closeExpModal() {
        const modal = document.getElementById('expModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    function initExpModalControls() {
        const closeBtn = document.getElementById('closeExpModalBtn');
        const cancelBtn = document.getElementById('cancelExpModalBtn');
        const modal = document.getElementById('expModal');
        const form = document.getElementById('expForm');
        const logoInput = document.getElementById('expCertLogoInput');
        const imgFileInput = document.getElementById('expImgFileInput');
        const removeImgBtn = document.getElementById('expRemoveImgBtn');

        if (closeBtn) closeBtn.onclick = closeExpModal;
        if (cancelBtn) cancelBtn.onclick = closeExpModal;

        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeExpModal();
            };
        }

        if (logoInput) {
            logoInput.oninput = function () {
                updateExpImagePreview(this.value);
            };
        }

        if (imgFileInput) {
            imgFileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (evt) {
                    const dataUrl = evt.target.result;
                    if (logoInput) logoInput.value = dataUrl;
                    updateExpImagePreview(dataUrl);
                    showAdminToast("Experience logo/certificate uploaded!");
                };
                reader.readAsDataURL(file);
            };
        }

        if (removeImgBtn) {
            removeImgBtn.onclick = function () {
                if (logoInput) logoInput.value = '';
                updateExpImagePreview('');
                showAdminToast("Experience image removed!");
            };
        }

        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                const idx = parseInt(document.getElementById('expIndexInput').value, 10);
                const title = document.getElementById('expJobTitleInput').value.trim();
                const org = document.getElementById('expOrgInput').value.trim();
                const program = document.getElementById('expProgramInput').value.trim();
                const workType = document.getElementById('expWorkTypeInput').value;
                const startDate = document.getElementById('expStartDateInput').value.trim();
                const endDate = document.getElementById('expEndDateInput').value.trim();
                const location = document.getElementById('expLocationInput').value.trim();
                const desc = document.getElementById('expDescInput').value.trim();
                const techStr = document.getElementById('expTechInput').value.trim();
                const logo = document.getElementById('expCertLogoInput').value.trim();

                const techArr = techStr ? techStr.split(',').map(t => t.trim()).filter(Boolean) : [];

                const state = window.CMS_STORE.getState();

                if (idx === -1) {
                    const newEntry = {
                        id: 'exp-' + Date.now(),
                        job_title: title,
                        organization: org,
                        program_name: program,
                        start_date: startDate,
                        end_date: endDate,
                        location: location,
                        work_type: workType,
                        description: desc,
                        technologies: techArr,
                        certificate_image_url: logo || '',
                        display_order: state.experiences.length + 1,
                        is_active: true,
                        publish_status: 'Published'
                    };
                    state.experiences.push(newEntry);
                    window.CMS_STORE.saveState(state, "Added Experience: " + title, "Experience", title);
                    showAdminToast("Added new Experience entry!");
                } else if (state.experiences[idx]) {
                    state.experiences[idx].job_title = title;
                    state.experiences[idx].organization = org;
                    state.experiences[idx].program_name = program;
                    state.experiences[idx].work_type = workType;
                    state.experiences[idx].start_date = startDate;
                    state.experiences[idx].end_date = endDate;
                    state.experiences[idx].location = location;
                    state.experiences[idx].description = desc;
                    state.experiences[idx].technologies = techArr;
                    state.experiences[idx].certificate_image_url = logo;

                    window.CMS_STORE.saveState(state, "Updated Experience: " + title, "Experience", title);
                    showAdminToast("Experience entry updated!");
                }

                closeExpModal();
                refreshAllDashboardData();
            };
        }
    }

    window.toggleExpStatus = function (idx) {
        const state = window.CMS_STORE.getState();
        const cur = state.experiences[idx].publish_status || 'Published';
        state.experiences[idx].publish_status = cur === 'Published' ? 'Draft' : 'Published';
        window.CMS_STORE.saveState(state, "Toggled Experience publish status", "Experience");
        refreshAllDashboardData();
    };

    window.deleteExp = function (idx) {
        if (!confirm("Delete experience entry?")) return;
        const state = window.CMS_STORE.getState();
        state.experiences.splice(idx, 1);
        window.CMS_STORE.saveState(state, "Deleted Experience entry", "Experience");
        refreshAllDashboardData();
    };

    // SKILLS CMS
    function renderSkillsCms(categories) {
        const container = document.getElementById('cmsSkillsContainer');
        if (!container || !categories) return;

        if (categories.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <i class="fas fa-tools" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
                    <p>No skill categories found. Click <strong>"Add Skill Category"</strong> to create one.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map((cat, catIdx) => `
            <div class="cms-skill-cat">
                <div class="cms-skill-cat-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                    <strong class="cms-skill-cat-title" style="font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="${cat.icon || 'fas fa-code'}" style="color: var(--primary);"></i> ${cat.name || 'Category'}
                    </strong>
                    <div class="cms-item-actions" style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn-cms-secondary" onclick="window.openSkillCatModal(${catIdx})" title="Edit category and skills" style="display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; font-size: 0.8rem;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-cms-secondary" onclick="window.openSkillItemModal(${catIdx}, -1)" style="display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; font-size: 0.8rem;">
                            <i class="fas fa-plus"></i> Add Skill
                        </button>
                        <button class="btn-cms-danger" onclick="window.deleteSkillCat(${catIdx})" title="Delete category" style="padding: 5px 10px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cms-skill-tags-wrap" style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${(cat.skills || []).map((skill, sIdx) => {
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        return `
                            <span class="skill-tag" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-full); font-size: 0.85rem; transition: var(--transition);">
                                <span>${skillName}</span>
                                <i class="fas fa-times" onclick="window.removeSkill(${catIdx}, ${sIdx});" title="Remove skill" style="color: var(--text-muted); cursor: pointer; margin-left: 2px;"></i>
                            </span>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    // SKILL CATEGORY MODAL LOGIC
    window.openSkillCatModal = function (catIdx) {
        const modal = document.getElementById('skillCatModal');
        const modalTitle = document.getElementById('skillCatModalTitle');
        const indexInput = document.getElementById('skillCatIndexInput');
        const nameInput = document.getElementById('skillCatNameInput');
        const iconInput = document.getElementById('skillCatIconInput');
        const skillsInput = document.getElementById('skillCatSkillsInput');

        if (!modal) return;

        indexInput.value = catIdx;

        if (catIdx === -1) {
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-tools" style="color: var(--primary);"></i> Add Skill Category';
            if (nameInput) nameInput.value = '';
            if (iconInput) iconInput.value = '';
            if (skillsInput) skillsInput.value = '';
        } else {
            const state = window.CMS_STORE.getState();
            const cat = state.skillCategories[catIdx];
            if (!cat) return;

            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-tools" style="color: var(--primary);"></i> Edit Skill Category';
            if (nameInput) nameInput.value = cat.name || '';
            if (iconInput) iconInput.value = cat.icon || '';
            if (skillsInput) {
                skillsInput.value = (cat.skills || []).map(s => typeof s === 'string' ? s : (s ? s.name : '')).filter(Boolean).join(', ');
            }
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    function closeSkillCatModal() {
        const modal = document.getElementById('skillCatModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    // SKILL ITEM MODAL LOGIC
    window.openSkillItemModal = function (catIdx, skillIdx) {
        const modal = document.getElementById('skillItemModal');
        const modalTitle = document.getElementById('skillItemModalTitle');
        const catIndexInput = document.getElementById('skillItemCatIndexInput');
        const skillIndexInput = document.getElementById('skillItemIndexInput');
        const nameInput = document.getElementById('skillItemNameInput');

        if (!modal) return;

        catIndexInput.value = catIdx;
        skillIndexInput.value = skillIdx;

        const state = window.CMS_STORE.getState();
        const cat = state.skillCategories[catIdx];

        if (skillIdx === -1) {
            if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-cog" style="color: var(--primary);"></i> Add Skill to ${cat ? cat.name : 'Category'}`;
            if (nameInput) nameInput.value = '';
        } else {
            const skillItem = cat && cat.skills ? cat.skills[skillIdx] : null;
            const skillName = typeof skillItem === 'string' ? skillItem : (skillItem ? skillItem.name : '');

            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-cog" style="color: var(--primary);"></i> Edit Skill Details';
            if (nameInput) nameInput.value = skillName || '';
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    function closeSkillItemModal() {
        const modal = document.getElementById('skillItemModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    function initSkillModalControls() {
        // Category Modal Controls
        const closeCatBtn = document.getElementById('closeSkillCatModalBtn');
        const cancelCatBtn = document.getElementById('cancelSkillCatModalBtn');
        const catModal = document.getElementById('skillCatModal');
        const catForm = document.getElementById('skillCatForm');

        if (closeCatBtn) closeCatBtn.onclick = closeSkillCatModal;
        if (cancelCatBtn) cancelCatBtn.onclick = closeSkillCatModal;

        if (catModal) {
            catModal.onclick = (e) => {
                if (e.target === catModal) closeSkillCatModal();
            };
        }

        if (catForm) {
            catForm.onsubmit = function (e) {
                e.preventDefault();
                const catIdx = parseInt(document.getElementById('skillCatIndexInput').value, 10);
                const name = document.getElementById('skillCatNameInput').value.trim();
                const icon = document.getElementById('skillCatIconInput').value.trim() || 'fas fa-code';
                const skillsStr = document.getElementById('skillCatSkillsInput') ? document.getElementById('skillCatSkillsInput').value.trim() : '';

                const skillsArr = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

                const state = window.CMS_STORE.getState();

                if (catIdx === -1) {
                    const newCat = {
                        id: 'cat-' + Date.now(),
                        name: name,
                        icon: icon,
                        display_order: state.skillCategories.length + 1,
                        is_active: true,
                        published: true,
                        skills: skillsArr
                    };
                    state.skillCategories.push(newCat);
                    window.CMS_STORE.saveState(state, "Added Skill Category: " + name, "Skills", name);
                    showAdminToast("Added new Skill Category!");
                } else if (state.skillCategories[catIdx]) {
                    state.skillCategories[catIdx].name = name;
                    state.skillCategories[catIdx].icon = icon;
                    state.skillCategories[catIdx].skills = skillsArr;

                    window.CMS_STORE.saveState(state, "Updated Skill Category: " + name, "Skills", name);
                    showAdminToast("Skill Category & skills updated!");
                }

                closeSkillCatModal();
                refreshAllDashboardData();
            };
        }

        // Skill Item Modal Controls
        const closeItemBtn = document.getElementById('closeSkillItemModalBtn');
        const cancelItemBtn = document.getElementById('cancelSkillItemModalBtn');
        const itemModal = document.getElementById('skillItemModal');
        const itemForm = document.getElementById('skillItemForm');

        if (closeItemBtn) closeItemBtn.onclick = closeSkillItemModal;
        if (cancelItemBtn) cancelItemBtn.onclick = closeSkillItemModal;

        if (itemModal) {
            itemModal.onclick = (e) => {
                if (e.target === itemModal) closeSkillItemModal();
            };
        }

        if (itemForm) {
            itemForm.onsubmit = function (e) {
                e.preventDefault();
                const catIdx = parseInt(document.getElementById('skillItemCatIndexInput').value, 10);
                const skillIdx = parseInt(document.getElementById('skillItemIndexInput').value, 10);
                const skillName = document.getElementById('skillItemNameInput').value.trim();

                const state = window.CMS_STORE.getState();
                const cat = state.skillCategories[catIdx];

                if (cat) {
                    if (!cat.skills) cat.skills = [];

                    if (skillIdx === -1) {
                        cat.skills.push(skillName);
                        window.CMS_STORE.saveState(state, `Added skill '${skillName}' to ${cat.name}`, "Skills", skillName);
                        showAdminToast(`Added skill '${skillName}'!`);
                    } else if (cat.skills[skillIdx] !== undefined) {
                        if (typeof cat.skills[skillIdx] === 'string') {
                            cat.skills[skillIdx] = skillName;
                        } else {
                            cat.skills[skillIdx].name = skillName;
                        }
                        window.CMS_STORE.saveState(state, `Updated skill in ${cat.name}`, "Skills", skillName);
                        showAdminToast("Skill updated!");
                    }
                }

                closeSkillItemModal();
                refreshAllDashboardData();
            };
        }
    }

    window.removeSkill = function (catIdx, skillIdx) {
        const state = window.CMS_STORE.getState();
        if (state.skillCategories[catIdx] && state.skillCategories[catIdx].skills) {
            state.skillCategories[catIdx].skills.splice(skillIdx, 1);
            window.CMS_STORE.saveState(state, "Removed skill", "Skills");
            refreshAllDashboardData();
        }
    };

    window.deleteSkillCat = function (catIdx) {
        if (!confirm("Delete this skill category and all its skills?")) return;
        const state = window.CMS_STORE.getState();
        state.skillCategories.splice(catIdx, 1);
        window.CMS_STORE.saveState(state, "Deleted skill category", "Skills");
        refreshAllDashboardData();
    };

    // PROJECTS CMS
    function renderProjectsCms(projects) {
        const container = document.getElementById('cmsProjectsContainer');
        if (!container || !projects) return;

        if (projects.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <i class="fas fa-rocket" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px;"></i>
                    <p>No projects found. Click <strong>"Add New Project"</strong> to create one.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map((p, idx) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <div class="cms-item-header" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 1.2rem;">${p.icon || '🤖'}</span>
                        <strong class="cms-item-title">${p.name}</strong>
                        <span class="badge badge-info">${p.status || 'Completed'}</span>
                    </div>
                    <p class="cms-item-desc" style="margin-top: 6px; color: var(--text-secondary); font-size: 0.9rem;">${p.short_description || p.long_description || ''}</p>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-secondary" onclick="window.openProjectModal(${idx})" title="Edit project entry" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-cms-status ${p.publish_status === 'Published' ? 'published' : 'draft'}" onclick="window.toggleProjectPublish(${idx})">
                        ${p.publish_status || 'Published'}
                    </button>
                    <button class="btn-cms-danger" onclick="window.deleteProject(${idx})" title="Delete project">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function updateProjectImagePreview(url) {
        const imgPreview = document.getElementById('projectImgPreview');
        const imgFallback = document.getElementById('projectImgFallback');
        if (!imgPreview || !imgFallback) return;

        if (url && url.trim() !== '') {
            imgPreview.src = url;
            imgPreview.style.display = 'block';
            imgFallback.style.display = 'none';
        } else {
            imgPreview.src = '';
            imgPreview.style.display = 'none';
            imgFallback.style.display = 'flex';
        }
    }

    function closeProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    window.openProjectModal = function (idx) {
        const modal = document.getElementById('projectModal');
        const modalTitle = document.getElementById('projectModalTitle');
        const indexInput = document.getElementById('projectIndexInput');
        const nameInput = document.getElementById('projectNameInput');
        const iconInput = document.getElementById('projectIconInput');
        const statusInput = document.getElementById('projectStatusInput');
        const shortDescInput = document.getElementById('projectShortDescInput');
        const longDescInput = document.getElementById('projectLongDescInput');
        const githubInput = document.getElementById('projectGithubInput');
        const demoInput = document.getElementById('projectDemoInput');
        const techInput = document.getElementById('projectTechInput');
        const imageInput = document.getElementById('projectImageInput');

        if (!modal) return;

        indexInput.value = idx;

        if (idx === -1) {
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-rocket" style="color: var(--primary);"></i> Add New Project';
            if (nameInput) nameInput.value = '';
            if (iconInput) iconInput.value = '';
            if (statusInput) statusInput.value = 'Completed';
            if (shortDescInput) shortDescInput.value = '';
            if (longDescInput) longDescInput.value = '';
            if (githubInput) githubInput.value = '';
            if (demoInput) demoInput.value = '';
            if (techInput) techInput.value = '';
            if (imageInput) imageInput.value = '';
            updateProjectImagePreview('');
        } else {
            const state = window.CMS_STORE.getState();
            const proj = state.projects[idx];
            if (!proj) return;

            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-rocket" style="color: var(--primary);"></i> Edit Project';
            if (nameInput) nameInput.value = proj.name || '';
            if (iconInput) iconInput.value = proj.icon || '';
            if (statusInput) statusInput.value = proj.status || 'Completed';
            if (shortDescInput) shortDescInput.value = proj.short_description || '';
            if (longDescInput) longDescInput.value = proj.long_description || proj.short_description || '';
            if (githubInput) githubInput.value = proj.github_url || '';
            if (demoInput) demoInput.value = proj.live_demo_url || '';
            if (techInput) techInput.value = (proj.technologies || []).join(', ');
            if (imageInput) imageInput.value = proj.image_url || '';
            updateProjectImagePreview(proj.image_url || '');
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    function initProjectModalControls() {
        const closeBtn = document.getElementById('closeProjectModalBtn');
        const cancelBtn = document.getElementById('cancelProjectModalBtn');
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const imageInput = document.getElementById('projectImageInput');
        const imgFileInput = document.getElementById('projectImgFileInput');
        const removeImgBtn = document.getElementById('projectRemoveImgBtn');

        if (closeBtn) closeBtn.onclick = closeProjectModal;
        if (cancelBtn) cancelBtn.onclick = closeProjectModal;

        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeProjectModal();
            };
        }

        if (imageInput) {
            imageInput.oninput = function () {
                updateProjectImagePreview(this.value);
            };
        }

        if (imgFileInput) {
            imgFileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (evt) {
                    const dataUrl = evt.target.result;
                    if (imageInput) imageInput.value = dataUrl;
                    updateProjectImagePreview(dataUrl);
                    showAdminToast("Project image uploaded!");
                };
                reader.readAsDataURL(file);
            };
        }

        if (removeImgBtn) {
            removeImgBtn.onclick = function () {
                if (imageInput) imageInput.value = '';
                updateProjectImagePreview('');
                showAdminToast("Project image removed!");
            };
        }

        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                const idx = parseInt(document.getElementById('projectIndexInput').value, 10);
                const name = document.getElementById('projectNameInput').value.trim();
                const icon = document.getElementById('projectIconInput').value.trim() || '';
                const status = document.getElementById('projectStatusInput').value;
                const shortDesc = document.getElementById('projectShortDescInput').value.trim();
                const longDesc = document.getElementById('projectLongDescInput').value.trim() || shortDesc;
                const github = document.getElementById('projectGithubInput').value.trim();
                const demo = document.getElementById('projectDemoInput').value.trim();
                const techStr = document.getElementById('projectTechInput').value.trim();
                const imageUrl = document.getElementById('projectImageInput').value.trim();

                const techArr = techStr ? techStr.split(',').map(t => t.trim()).filter(Boolean) : [];

                const state = window.CMS_STORE.getState();

                if (idx === -1) {
                    const newProj = {
                        id: 'proj-' + Date.now(),
                        name: name,
                        icon: icon,
                        status: status,
                        short_description: shortDesc,
                        long_description: longDesc,
                        github_url: github,
                        live_demo_url: demo,
                        image_url: imageUrl,
                        technologies: techArr,
                        display_order: state.projects.length + 1,
                        is_active: true,
                        publish_status: 'Published'
                    };
                    state.projects.push(newProj);
                    window.CMS_STORE.saveState(state, "Added Project: " + name, "Projects", name);
                    showAdminToast("Added new Project!");
                } else if (state.projects[idx]) {
                    state.projects[idx].name = name;
                    state.projects[idx].icon = icon;
                    state.projects[idx].status = status;
                    state.projects[idx].short_description = shortDesc;
                    state.projects[idx].long_description = longDesc;
                    state.projects[idx].github_url = github;
                    state.projects[idx].live_demo_url = demo;
                    state.projects[idx].image_url = imageUrl;
                    state.projects[idx].technologies = techArr;

                    window.CMS_STORE.saveState(state, "Updated Project: " + name, "Projects", name);
                    showAdminToast("Project updated!");
                }

                closeProjectModal();
                refreshAllDashboardData();
            };
        }
    }

    window.toggleProjectPublish = function (idx) {
        const state = window.CMS_STORE.getState();
        const cur = state.projects[idx].publish_status || 'Published';
        state.projects[idx].publish_status = cur === 'Published' ? 'Draft' : 'Published';
        window.CMS_STORE.saveState(state, "Toggled Project publish status", "Projects");
        refreshAllDashboardData();
    };

    window.deleteProject = function (idx) {
        if (!confirm("Delete project?")) return;
        const state = window.CMS_STORE.getState();
        state.projects.splice(idx, 1);
        window.CMS_STORE.saveState(state, "Deleted Project", "Projects");
        refreshAllDashboardData();
    };

    // CERTIFICATES CMS
    function renderCertificatesCms(certs) {
        const container = document.getElementById('cmsCertsContainer');
        if (!container || !certs) return;

        container.innerHTML = certs.map((c, idx) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <strong class="cms-item-title">${c.title}</strong>
                    <div class="cms-item-subtitle">${c.issuer} · ${c.issue_date}</div>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-status ${c.publish_status === 'Published' ? 'published' : 'draft'}" onclick="window.toggleCertPublish(${idx})">
                        ${c.publish_status || 'Published'}
                    </button>
                    <button class="btn-cms-danger" onclick="window.deleteCert(${idx})" title="Delete certification">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.promptAddCert = function () {
        const title = prompt("Certificate Title (e.g. AWS Cloud Practitioner):");
        if (!title) return;
        const issuer = prompt("Issuer (e.g. AWS):");

        const state = window.CMS_STORE.getState();
        state.certificates.push({
            id: 'cert-' + Date.now(),
            title: title,
            issuer: issuer || 'Issuer',
            issue_date: 'March 2026',
            description: 'Professional cloud certification.',
            certificate_image_url: 'assets/img/certificate/aws-practitioner.png',
            credential_id: '',
            credential_url: '',
            icon: '🎨',
            category: 'Cloud',
            display_order: state.certificates.length + 1,
            is_active: true,
            publish_status: 'Published'
        });
        window.CMS_STORE.saveState(state, "Added Certificate: " + title, "Certificates");
        showAdminToast("Certificate added!");
        refreshAllDashboardData();
    };

    window.toggleCertPublish = function (idx) {
        const state = window.CMS_STORE.getState();
        const cur = state.certificates[idx].publish_status || 'Published';
        state.certificates[idx].publish_status = cur === 'Published' ? 'Draft' : 'Published';
        window.CMS_STORE.saveState(state, "Toggled Certificate publish status", "Certificates");
        refreshAllDashboardData();
    };

    window.deleteCert = function (idx) {
        if (!confirm("Delete certificate?")) return;
        const state = window.CMS_STORE.getState();
        state.certificates.splice(idx, 1);
        window.CMS_STORE.saveState(state, "Deleted Certificate", "Certificates");
        refreshAllDashboardData();
    };

    // ACTIVITIES CMS
    function renderActivitiesCms(acts) {
        const container = document.getElementById('cmsActivitiesContainer');
        if (!container || !acts) return;

        container.innerHTML = acts.map((a, idx) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <strong class="cms-item-title">${a.title}</strong>
                    <div class="cms-item-subtitle">${a.organization} (${a.year})</div>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-status ${a.publish_status === 'Published' ? 'published' : 'draft'}" onclick="window.toggleActivityPublish(${idx})">
                        ${a.publish_status || 'Published'}
                    </button>
                    <button class="btn-cms-danger" onclick="window.deleteActivity(${idx})" title="Delete activity">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.promptAddActivity = function () {
        const title = prompt("Activity Title (e.g. Smart India Hackathon):");
        if (!title) return;

        const state = window.CMS_STORE.getState();
        state.activities.push({
            id: 'act-' + Date.now(),
            title: title,
            organization: 'Ministry of Education',
            description: 'Participated in hackathon competition.',
            year: '2025',
            participation_type: 'Participant',
            badge: 'Hackathon',
            certificate_image_url: 'assets/img/certificate/sih_certificate.jpeg',
            display_order: state.activities.length + 1,
            is_active: true,
            publish_status: 'Published'
        });
        window.CMS_STORE.saveState(state, "Added Activity: " + title, "Activities");
        showAdminToast("Activity added!");
        refreshAllDashboardData();
    };

    window.toggleActivityPublish = function (idx) {
        const state = window.CMS_STORE.getState();
        const cur = state.activities[idx].publish_status || 'Published';
        state.activities[idx].publish_status = cur === 'Published' ? 'Draft' : 'Published';
        window.CMS_STORE.saveState(state, "Toggled Activity publish status", "Activities");
        refreshAllDashboardData();
    };

    window.deleteActivity = function (idx) {
        if (!confirm("Delete activity?")) return;
        const state = window.CMS_STORE.getState();
        state.activities.splice(idx, 1);
        window.CMS_STORE.saveState(state, "Deleted Activity", "Activities");
        refreshAllDashboardData();
    };

    // CONTACT CMS
    function renderContactCms(contact) {
        if (!contact) return;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('cmsContactEmail', contact.email);
        setVal('cmsContactPhone', contact.phone);
        setVal('cmsContactLocation', contact.location);
        setVal('cmsContactHeading', contact.contact_heading);
        setVal('cmsContactDesc', contact.contact_description);

        const form = document.getElementById('cmsContactForm');
        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                const state = window.CMS_STORE.getState();
                state.contact = {
                    email: document.getElementById('cmsContactEmail')?.value || '',
                    phone: document.getElementById('cmsContactPhone')?.value || '',
                    location: document.getElementById('cmsContactLocation')?.value || '',
                    contact_heading: document.getElementById('cmsContactHeading')?.value || '',
                    contact_description: document.getElementById('cmsContactDesc')?.value || '',
                    form_heading: contact.form_heading || 'Get In Touch',
                    form_button_text: contact.form_button_text || 'Send Message'
                };
                window.CMS_STORE.saveState(state, "Updated Contact Settings", "Contact");
                showAdminToast("Contact settings saved!");
            };
        }
    }

    // SOCIAL LINKS CMS
    function renderSocialCms(socials) {
        const container = document.getElementById('cmsSocialContainer');
        if (!container || !socials) return;

        container.innerHTML = socials.map((s, idx) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <i class="${s.icon} cms-social-icon"></i>
                    <strong class="cms-item-title">${s.platform_name}</strong>:
                    <span class="cms-item-url">${s.url}</span>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-status ${s.is_active ? 'active' : 'disabled'}" onclick="window.toggleSocialActive(${idx})">
                        ${s.is_active ? 'Active' : 'Hidden'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.toggleSocialActive = function (idx) {
        const state = window.CMS_STORE.getState();
        state.socialLinks[idx].is_active = !state.socialLinks[idx].is_active;
        window.CMS_STORE.saveState(state, "Toggled Social Link status", "Social Links");
        refreshAllDashboardData();
    };

    // RESUME CMS
    function renderResumeCms(resume) {
        if (!resume) return;
        const nameEl = document.getElementById('activeResumeName');
        const dateEl = document.getElementById('activeResumeDate');
        const frame = document.getElementById('adminPdfFrame');

        if (nameEl) nameEl.textContent = resume.filename || 'NIVESH_R_RESUME.pdf';
        if (dateEl) dateEl.textContent = `Uploaded: ${resume.upload_date || 'Recent'}`;
        if (frame && resume.data_url) frame.src = resume.data_url;

        const fileInput = document.getElementById('resumeFileInput');
        const dropZone = document.getElementById('resumeDropZone');

        if (fileInput && dropZone) {
            dropZone.onclick = () => fileInput.click();
            fileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;

                if (file.type !== 'application/pdf') {
                    alert("Please select a valid PDF file!");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (evt) {
                    const state = window.CMS_STORE.getState();
                    state.resume = {
                        id: 'res-' + Date.now(),
                        filename: file.name,
                        file_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                        upload_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        data_url: evt.target.result,
                        is_active: true
                    };
                    window.CMS_STORE.saveState(state, "Uploaded new Resume PDF: " + file.name, "Resume");
                    showAdminToast("Resume uploaded & updated!");
                    refreshAllDashboardData();
                };
                reader.readAsDataURL(file);
            };
        }
    }

    // QUICK LINKS CMS
    function renderNavigationCms(navItems) {
        const container = document.getElementById('cmsNavContainer');
        if (!container || !navItems) return;

        container.innerHTML = navItems.map((n, idx) => `
            <div class="cms-item-card">
                <div class="cms-item-main">
                    <strong class="cms-item-title">${n.name}</strong>
                    <span class="cms-item-subtitle">(${n.section_id})</span>
                </div>
                <div class="cms-item-actions">
                    <button class="btn-cms-status ${n.is_active ? 'active' : 'disabled'}" onclick="window.toggleNavActive(${idx})">
                        ${n.is_active ? 'Active' : 'Hidden'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.toggleNavActive = function (idx) {
        const state = window.CMS_STORE.getState();
        state.navigation[idx].is_active = !state.navigation[idx].is_active;
        window.CMS_STORE.saveState(state, "Toggled Navigation status", "Navigation");
        refreshAllDashboardData();
    };

    // MESSAGES CMS
    function renderMessagesCms(messages) {
        const list = document.getElementById('dashRecentMsgsList');
        const fullList = document.getElementById('fullMessagesList');
        if (!messages) return;

        const html = messages.length === 0 ? `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">No inbox messages received yet.</div>
        ` : messages.map(m => `
            <div class="msg-card" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 15px; border-radius: 10px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <strong style="color: var(--text-primary);">${m.name} &lt;${m.email}&gt;</strong>
                    <small style="color: var(--text-secondary);">${m.createdAt}</small>
                </div>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 10px;">${m.message}</p>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-header" onclick="window.toggleMsgRead('${m.id}')">${m.status === 'unread' ? 'Mark Read' : 'Mark Unread'}</button>
                    <button class="btn-header btn-header-danger" onclick="window.deleteMsg('${m.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        if (list) list.innerHTML = html;
        if (fullList) fullList.innerHTML = html;
    }

    window.toggleMsgRead = function (id) {
        const msgs = window.CMS_STORE.getMessages();
        const msg = msgs.find(m => m.id === id);
        if (msg) {
            window.CMS_STORE.updateMessageStatus(id, msg.status === 'unread' ? 'read' : 'unread');
            refreshAllDashboardData();
        }
    };

    window.deleteMsg = function (id) {
        if (!confirm("Delete message?")) return;
        window.CMS_STORE.deleteMessage(id);
        refreshAllDashboardData();
    };

    // SECURITY CENTER AUDIT LOGS
    let currentAuditLogs = [];

    function renderActivityLogs(logs) {
        const container = document.getElementById('adminActivityLogsList');
        if (!container) return;
        if (logs) currentAuditLogs = logs;

        const searchInput = document.getElementById('auditSearchInput');
        const filterSelect = document.getElementById('auditCategoryFilter');

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedCat = filterSelect ? filterSelect.value : 'ALL';

        let filtered = currentAuditLogs.filter(l => {
            const matchesCat = (selectedCat === 'ALL') || (l.section && l.section.toLowerCase() === selectedCat.toLowerCase());
            const matchesQuery = !query || 
                (l.action && l.action.toLowerCase().includes(query)) ||
                (l.section && l.section.toLowerCase().includes(query)) ||
                (l.recordTitle && l.recordTitle.toLowerCase().includes(query)) ||
                (l.timestamp && l.timestamp.toLowerCase().includes(query));
            return matchesCat && matchesQuery;
        });

        const getSectionIcon = (sec) => {
            const s = (sec || '').toLowerCase();
            if (s.includes('system')) return 'fa-cog';
            if (s.includes('auth')) return 'fa-key';
            if (s.includes('about')) return 'fa-user';
            if (s.includes('edu')) return 'fa-graduation-cap';
            if (s.includes('exp')) return 'fa-briefcase';
            if (s.includes('skill')) return 'fa-tools';
            if (s.includes('project')) return 'fa-robot';
            if (s.includes('cert')) return 'fa-trophy';
            if (s.includes('activ')) return 'fa-medal';
            if (s.includes('contact')) return 'fa-envelope';
            if (s.includes('social')) return 'fa-link';
            if (s.includes('nav') || s.includes('quick')) return 'fa-compass';
            return 'fa-history';
        };

        const getBadgeClass = (sec) => {
            const s = (sec || '').toLowerCase();
            if (s.includes('system')) return 'system';
            if (s.includes('auth')) return 'auth';
            if (s.includes('about') || s.includes('edu') || s.includes('exp')) return 'about';
            if (s.includes('skill') || s.includes('project') || s.includes('cert')) return 'skills';
            return 'default';
        };

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="audit-empty-state">
                    <div class="audit-empty-icon"><i class="fas fa-history"></i></div>
                    <h4>No admin activity recorded yet</h4>
                    <p>${query || selectedCat !== 'ALL' ? 'No logs match your current search/filter.' : 'Your administrative actions will appear here in real-time.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(l => `
            <div class="audit-log-row">
                <div class="audit-log-icon">
                    <i class="fas ${getSectionIcon(l.section)}"></i>
                </div>
                <div class="audit-log-content">
                    <div class="audit-log-title" style="font-weight: 700; color: var(--text-primary);">${l.action}</div>
                    <div class="audit-log-meta" style="margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        ${l.recordTitle ? `<span style="font-weight: 600; color: var(--primary);">${l.recordTitle}</span>` : ''}
                        <span class="badge badge-sec-${getBadgeClass(l.section)}">[${l.section || 'Portfolio CMS'}]</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary);"><i class="fas fa-user-shield" style="margin-right: 3px;"></i> ${l.adminName || 'Nivesh R'}</span>
                    </div>
                </div>
                <div class="audit-log-timestamp">
                    <i class="far fa-clock" style="margin-right: 4px;"></i> ${l.timestamp}
                </div>
            </div>
        `).join('');
    }

    function initAuditLogControls() {
        const searchInput = document.getElementById('auditSearchInput');
        const filterSelect = document.getElementById('auditCategoryFilter');
        const clearBtn = document.getElementById('clearAuditLogsBtn');
        const clearModal = document.getElementById('clearLogsConfirmModal');
        const cancelClearBtn = document.getElementById('cancelClearLogsBtn');
        const confirmClearBtn = document.getElementById('confirmClearLogsBtn');

        if (searchInput) {
            searchInput.oninput = () => renderActivityLogs();
        }
        if (filterSelect) {
            filterSelect.onchange = () => renderActivityLogs();
        }

        if (clearBtn && clearModal) {
            clearBtn.onclick = () => {
                clearModal.style.display = 'flex';
                clearModal.classList.add('active');
            };
        }

        const closeClearModal = () => {
            if (clearModal) {
                clearModal.classList.remove('active');
                clearModal.style.display = 'none';
            }
        };

        if (cancelClearBtn) cancelClearBtn.onclick = closeClearModal;

        if (confirmClearBtn) {
            confirmClearBtn.onclick = () => {
                closeClearModal();
                if (window.CMS_STORE && window.CMS_STORE.clearAdminLogs) {
                    window.CMS_STORE.clearAdminLogs();
                }
                showAdminToast("Audit logs cleared successfully.");
                refreshAllDashboardData();
            };
        }

        if (clearModal) {
            clearModal.onclick = (e) => {
                if (e.target === clearModal) closeClearModal();
            };
        }
    }

    // PORTFOLIO JSON IMPORT & AUTO-SAVE CONTROLS
    function initJsonImportControls() {
        const uploadBtn = document.getElementById('cmsUploadJsonBtn');
        const fileInput = document.getElementById('cmsImportJsonInput');
        const downloadBtn = document.getElementById('cmsDownloadJsonBtn');
        const resetBtn = document.getElementById('cmsResetDefaultsBtn');
        const resetModal = document.getElementById('resetDefaultsConfirmModal');
        const cancelResetBtn = document.getElementById('cancelResetDefaultsBtn');
        const confirmResetBtn = document.getElementById('confirmResetDefaultsBtn');

        const fileNameLabel = document.getElementById('cmsImportFileName');
        const statusBadge = document.getElementById('cmsImportStatusBadge');
        const lastSavedLabel = document.getElementById('cmsImportLastSaved');
        const saveIndicator = document.getElementById('cmsSaveStatusIndicator');

        if (uploadBtn && fileInput) {
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;

                if (fileNameLabel) fileNameLabel.textContent = file.name;

                const reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        const jsonData = JSON.parse(evt.target.result);
                        if (!window.CMS_STORE) return;

                        const result = window.CMS_STORE.importJSON(jsonData, file.name);

                        if (result.success) {
                            if (statusBadge) {
                                statusBadge.textContent = "Valid Schema";
                                statusBadge.style.background = "rgba(16, 185, 129, 0.15)";
                                statusBadge.style.color = "#10b981";
                                statusBadge.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                            }
                            if (lastSavedLabel) {
                                const now = new Date();
                                lastSavedLabel.innerHTML = `<i class="far fa-clock"></i> ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                            }
                            if (saveIndicator) {
                                saveIndicator.innerHTML = '<i class="fas fa-check-circle"></i> All changes saved';
                                saveIndicator.style.background = "rgba(16, 185, 129, 0.15)";
                                saveIndicator.style.color = "#10b981";
                            }
                            showAdminToast(result.message || "Import successful & all changes saved!");
                            refreshAllDashboardData();
                        } else {
                            if (statusBadge) {
                                statusBadge.textContent = "Invalid Schema";
                                statusBadge.style.background = "rgba(239, 68, 68, 0.15)";
                                statusBadge.style.color = "#ef4444";
                                statusBadge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
                            }
                            alert("JSON Import Validation Error: " + (result.error || "Malformed portfolio JSON schema"));
                        }
                    } catch (parseErr) {
                        if (statusBadge) {
                            statusBadge.textContent = "Syntax Error";
                            statusBadge.style.background = "rgba(239, 68, 68, 0.15)";
                            statusBadge.style.color = "#ef4444";
                        }
                        alert("Invalid JSON file syntax: " + parseErr.message);
                    }
                };
                reader.readAsText(file);
            };
        }

        if (downloadBtn) {
            downloadBtn.onclick = () => {
                if (window.CMS_STORE && window.CMS_STORE.exportJSON) {
                    window.CMS_STORE.exportJSON();
                    showAdminToast("Exported niveshr_portfolio.json file");
                }
            };
        }

        if (resetBtn && resetModal) {
            resetBtn.onclick = () => {
                resetModal.style.display = 'flex';
                resetModal.classList.add('active');
            };
        }

        const closeResetModal = () => {
            if (resetModal) {
                resetModal.classList.remove('active');
                resetModal.style.display = 'none';
            }
        };

        if (cancelResetBtn) cancelResetBtn.onclick = closeResetModal;

        if (confirmResetBtn) {
            confirmResetBtn.onclick = () => {
                closeResetModal();
                if (window.CMS_STORE && window.CMS_STORE.resetToDefaults) {
                    window.CMS_STORE.resetToDefaults();
                    showAdminToast("Portfolio reset to defaults.");
                    refreshAllDashboardData();
                }
            };
        }

        if (resetModal) {
            resetModal.onclick = (e) => {
                if (e.target === resetModal) closeResetModal();
            };
        }
    }

    window.updateSaveIndicator = function (isSaving) {
        const indicator = document.getElementById('cmsSaveStatusIndicator');
        const lastSaved = document.getElementById('cmsImportLastSaved');
        if (!indicator) return;
        if (isSaving) {
            indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            indicator.style.background = "rgba(245, 158, 11, 0.15)";
            indicator.style.color = "#f59e0b";
        } else {
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> All changes saved';
            indicator.style.background = "rgba(16, 185, 129, 0.15)";
            indicator.style.color = "#10b981";
            if (lastSaved) {
                const now = new Date();
                lastSaved.innerHTML = `<i class="far fa-clock"></i> ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }
        }
    };

    document.addEventListener('DOMContentLoaded', initAdmin);
})();
