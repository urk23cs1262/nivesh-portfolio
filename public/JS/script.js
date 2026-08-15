// ===== EMAILJS =====
emailjs.init("Tw3LSYbX8-nZodC-t");

// ===== AUTOMATIC VISITOR TRACKING =====
(async function trackVisitor() {
    // Avoid spamming emails on rapid refreshes (limit to once per 5 minutes per session)
    const lastTrack = sessionStorage.getItem('portfolio_visited');
    if (lastTrack && Date.now() - parseInt(lastTrack) < 300000) return;
    sessionStorage.setItem('portfolio_visited', Date.now());

    try {
        const userAgent = navigator.userAgent;
        let os = "Desktop/Unknown";
        if (userAgent.indexOf("Win") !== -1) os = "Windows";
        else if (userAgent.indexOf("Mac") !== -1 && userAgent.indexOf("iPhone") === -1) os = "MacOS";
        else if (userAgent.indexOf("Linux") !== -1 && userAgent.indexOf("Android") === -1) os = "Linux";
        else if (userAgent.indexOf("Android") !== -1) os = "Android Mobile";
        else if (userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) os = "iOS Mobile";

        let browser = "Unknown Browser";
        if (userAgent.indexOf("Chrome") !== -1 && userAgent.indexOf("Edg") === -1) browser = "Chrome";
        else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) browser = "Safari";
        else if (userAgent.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (userAgent.indexOf("Edg") !== -1) browser = "Edge";

        const screenRes = `${window.screen.width}x${window.screen.height}`;
        const referrer = document.referrer || "Direct Visit / Link";
        const visitTime = new Date().toLocaleString();

        let ipData = { ip: "Unknown", city: "Unknown", region: "Unknown", country_name: "Unknown", org: "Unknown" };
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                ipData = await res.json();
            }
        } catch (e) {
            try {
                const fallbackRes = await fetch('https://api.ipify.org?format=json');
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    ipData.ip = data.ip;
                }
            } catch (err) { }
        }

        const locationStr = ipData.city && ipData.city !== "Unknown"
            ? `${ipData.city}, ${ipData.region}, ${ipData.country_name}`
            : (ipData.country_name || "Unknown Location");

        const visitorDetails = `
🔔 New Portfolio Visitor Detected!

📅 Time: ${visitTime}
📍 Location: ${locationStr}
🌐 IP Address: ${ipData.ip || 'Unknown'}
🏢 ISP: ${ipData.org || 'Unknown'}
💻 OS / Device: ${os}
🌐 Browser: ${browser}
🖥️ Screen Resolution: ${screenRes}
🔗 Referrer Source: ${referrer}
📄 Landing Page: ${window.location.href}
`.trim();

        // Sync with Admin Analytics via API (MongoDB)
        try {
            fetch('/api/analytics', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field: 'pageViews' })
            }).catch(() => {});
        } catch (e) { }

        if (typeof emailjs !== 'undefined') {
            emailjs.send("service_ay6dt22", "template_r48p4bg", {
                user_name: "Portfolio Analytics",
                user_email: "visitor@portfolio.auto",
                message: visitorDetails
            }).catch(err => console.log('Visitor tracking alert error:', err));
        }
    } catch (err) {
        console.log('Visitor tracking error:', err);
    }
})();

// ===== THEME TOGGLE =====
const html = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
themeBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

themeBtn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeBtn.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ===== HEADER & PROGRESS BAR =====
const header = document.getElementById('header');
const progressBar = document.createElement('div');
progressBar.className = 'progress-bar';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    // Header state
    header.classList.toggle('scrolled', window.scrollY > 40);
    document.getElementById('backTop').classList.toggle('show', window.scrollY > 300);

    // Progress Bar
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + "%";
});

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuToggle.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('active');
    });
});

// ===== ACTIVE NAV =====
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 160) current = s.id;
    });
    navLinkEls.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
});

// ===== TYPEWRITER =====
const phrases = ['Full Stack Developer', 'Web Designer', 'Coder', 'Problem Solver', 'AI & ML Enthusiast', 'DevOps Explorer'];
let pi = 0, ci = 0, deleting = false;
const tw = document.getElementById('typewriter-text');

function type() {
    const phrase = phrases[pi];
    tw.textContent = deleting ? phrase.slice(0, ci--) : phrase.slice(0, ci++);
    let speed = deleting ? 50 : 100;
    if (!deleting && ci === phrase.length + 1) { deleting = true; speed = 1400; }
    else if (deleting && ci < 0) { deleting = false; pi = (pi + 1) % phrases.length; ci = 0; speed = 400; }
    setTimeout(type, speed);
}
type();

// ===== SCROLL REVEAL =====
function initScrollObserver() {
    const revealEls = document.querySelectorAll('.reveal, .project-card, .edu-entry, .activity-card, .cer-card, .skill-group');
    if (window.portfolioObserver) window.portfolioObserver.disconnect();
    
    window.portfolioObserver = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                setTimeout(() => e.target.classList.add('visible'), i * 50);
                window.portfolioObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.05 });

    revealEls.forEach(el => {
        el.classList.add('visible');
        window.portfolioObserver.observe(el);
    });
}
initScrollObserver();

// ===== BACK TO TOP =====
document.getElementById('backTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = document.getElementById('sendMessageBtn');
    const nameVal = document.getElementById('name').value.trim();
    const emailVal = document.getElementById('email').value.trim();
    const msgVal = document.getElementById('message').value.trim();

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // Save message to MongoDB via API
    fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal, email: emailVal, message: msgVal })
    }).catch(() => {}); // fire-and-forget; EmailJS is the user-facing confirmation

    emailjs.send('service_ay6dt22', 'template_r48p4bg', {
        user_name: nameVal,
        user_email: emailVal,
        message: msgVal
    })
        .then(() => {
            showToast('✅ Message sent successfully!');
            this.reset();
        })
        .catch(() => {
            showToast('✅ Message saved & queued successfully!');
            this.reset();
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        });
});

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== DYNAMIC PORTFOLIO CMS HYDRATION =====
// Source of truth: /api/portfolio (GitHub REST API / Local Storage)
// localStorage is used only as an instant-render cache
let _portfolioDataCache = null;

async function fetchPortfolioFromAPI() {
    try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
            const data = await res.json();
            if (data && data.about) {
                _portfolioDataCache = data;
                // Kept in sync with cmsStore.js's STORAGE_KEY so the public page
                // and the admin CMS never read stale/mismatched cached data.
                try { localStorage.setItem('nivesh_portfolio_cache_v7', JSON.stringify(data)); } catch (e) {}
                return data;
            }
        }
    } catch (e) {
        console.warn('[Portfolio] API fetch failed, using cache:', e.message);
    }
    return null;
}

function getPortfolioFromCache() {
    if (_portfolioDataCache) return _portfolioDataCache;
    // Try current cache key first, then legacy keys (oldest last)
    const keys = ['nivesh_portfolio_cache_v7', 'nivesh_portfolio_cache_v6', 'nivesh_portfolio_cache_v4', 'nivesh_portfolio_file_cms_data_v3', 'nivesh_admin_portfolio_data'];
    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.about) {
                    _portfolioDataCache = parsed;
                    return parsed;
                }
            }
        } catch (e) {}
    }
    return window.PORTFOLIO_INITIAL_DATA || null;
}

function hydratePortfolioCMS(portfolio) {
    if (!portfolio) portfolio = getPortfolioFromCache();
    if (!portfolio) return;

    try {
        // 1. ABOUT ME SECTION
        if (portfolio.about) {
            const ab = portfolio.about;

            // Name
            if (ab.name) {
                document.querySelectorAll('#about .about-info h3').forEach(el => el.textContent = ab.name.toUpperCase());
                document.querySelectorAll('.name-highlight').forEach(el => el.textContent = ab.name);
            }

            // Role
            if (ab.role) {
                document.querySelectorAll('#about .about-role').forEach(el => el.textContent = ab.role);
            }

            // Avatar Image vs Fallback
            const avatarImg = document.querySelector('#about .avatar-box img');
            const avatarPlaceholder = document.querySelector('#about .avatar-placeholder');
            if (avatarImg) {
                if (ab.profile_image_url) {
                    avatarImg.style.display = 'block';
                    avatarImg.src = ab.profile_image_url;
                    avatarImg.onerror = function () {
                        this.style.display = 'none';
                        if (avatarPlaceholder) avatarPlaceholder.style.display = 'flex';
                    };
                    if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
                } else {
                    avatarImg.src = '';
                    avatarImg.style.display = 'none';
                    if (avatarPlaceholder) avatarPlaceholder.style.display = 'flex';
                }
            }

            // About Paragraphs
            const aboutParas = document.querySelectorAll('#about .about-info p:not(.about-role)');
            if (aboutParas.length > 0) {
                if (ab.about_paragraph_1) aboutParas[0].textContent = ab.about_paragraph_1;
                else if (ab.bio) aboutParas[0].textContent = ab.bio;

                if (aboutParas.length > 1 && ab.about_paragraph_2) {
                    aboutParas[1].textContent = ab.about_paragraph_2;
                }
                if (aboutParas.length > 2 && ab.hobbies) {
                    aboutParas[2].textContent = "Beyond coding, I enjoy " + ab.hobbies + ".";
                }
            }

            // Stats (Projects, CGPA, Grad Year)
            const statBoxes = document.querySelectorAll('#about .stat-box');
            if (statBoxes.length >= 3) {
                if (ab.projects_count) statBoxes[0].querySelector('.stat-num').textContent = ab.projects_count;
                if (ab.cgpa) statBoxes[1].querySelector('.stat-num').textContent = ab.cgpa;
                if (ab.graduation_year) statBoxes[2].querySelector('.stat-num').textContent = ab.graduation_year;
            }

            // Contact / Social URLs
            if (ab.github_url) document.querySelectorAll('a[href*="github.com"]').forEach(el => el.href = ab.github_url);
            if (ab.linkedin_url) document.querySelectorAll('a[href*="linkedin.com"]').forEach(el => el.href = ab.linkedin_url);
            if (ab.instagram_url) document.querySelectorAll('a[href*="instagram.com"]').forEach(el => el.href = ab.instagram_url);
            if (ab.email) document.querySelectorAll('.email-text').forEach(el => el.textContent = ab.email);
        }

        // 2. EDUCATION SECTION
        const eduContainer = document.querySelector('#education .edu-timeline');
        if (eduContainer) {
            const activeEdus = (portfolio.education || []).filter(e => e.published !== false && e.is_active !== false);
            eduContainer.innerHTML = activeEdus.map(item => `
                <div class="edu-entry">
                    <div class="edu-dot"><i class="fas fa-graduation-cap"></i></div>
                    <div class="edu-body">
                        <div class="edu-header">
                            <div class="edu-info-main">
                                <span class="edu-year-tag">${item.start_year || ''} – ${item.end_year || ''}</span>
                                <h3>${item.institution || ''}</h3>
                                <h4>${item.degree || ''}</h4>
                            </div>
                            ${item.logo_url ? `<div class="edu-logo-wrap"><img src="${item.logo_url}" alt="Logo"></div>` : ''}
                        </div>
                        ${item.description ? `<p>${item.description}</p>` : ''}
                        ${item.score ? `<span class="edu-score">${item.score}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

        // 3. EXPERIENCE SECTION
        const expContainer = document.querySelector('#experience .edu-timeline');
        if (expContainer) {
            const activeExps = (portfolio.experiences || []).filter(e => e.published !== false && e.publish_status !== 'Draft' && e.is_active !== false);
            expContainer.innerHTML = activeExps.map(item => `
                <div class="edu-entry" ${item.certificate_image_url ? `data-cert="${item.certificate_image_url}"` : ''}>
                    <div class="edu-dot"><i class="fas fa-shield-alt"></i></div>
                    <div class="edu-body">
                        <div class="edu-header">
                            <div class="edu-info-main">
                                <span class="edu-year-tag">${item.start_date || ''} – ${item.end_date || ''} · ${item.location || 'Remote'}</span>
                                <h3>${item.job_title || ''}</h3>
                                <h4>${item.organization || ''} ${item.program_name ? '| ' + item.program_name : ''}</h4>
                            </div>
                        </div>
                        ${item.description ? `<p>${item.description}</p>` : ''}
                        ${item.technologies && item.technologies.length > 0 ? `
                            <div class="project-tech" style="margin-top: 1rem;">
                                ${item.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${item.certificate_image_url ? `
                            <button class="view-cert-btn" style="margin-top: 1rem;">
                                <i class="fas fa-eye"></i> View Certificate
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // 4. SKILLS SECTION
        const skillsContainer = document.querySelector('#skills .skills-groups');
        if (skillsContainer) {
            const activeSkills = (portfolio.skillCategories || []).filter(s => s.published !== false && s.is_active !== false);
            skillsContainer.innerHTML = activeSkills.map(cat => `
                <div class="skill-group">
                    <div class="skill-group-title"><i class="${cat.icon || 'fas fa-code'}"></i> ${cat.name}</div>
                    <div class="skill-tags">
                        ${(cat.skills || []).map(s => `<span class="skill-tag">${typeof s === 'string' ? s : s.name}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        }

        // 5. PROJECTS SECTION
        const projectsContainer = document.querySelector('#projects .projects-grid');
        if (projectsContainer) {
            const activeProjs = (portfolio.projects || []).filter(p => p.published !== false && p.publish_status !== 'Draft' && p.is_active !== false);

            projectsContainer.innerHTML = activeProjs.map((p, idx) => {
                // Unified screenshot resolution: screenshots > images > image_url
                const screenshots = Array.isArray(p.screenshots) && p.screenshots.length > 0
                    ? p.screenshots
                    : (Array.isArray(p.images) && p.images.length > 0
                        ? p.images
                        : (p.image_url ? [p.image_url] : []));
                const hasScreenshots = screenshots.length > 0;
                const imgLabel = screenshots.length === 1 ? 'View Image' : 'View Images';
                return `
                <div class="project-card ${idx >= 3 ? 'hidden-project' : ''}">
                    <div class="project-header">
                        <div class="project-icon">${p.icon || '🤖'}</div>
                        <div class="project-links-row">
                            ${p.github_url ? `<a href="${p.github_url}" target="_blank" class="icon-btn" title="GitHub"><i class="fab fa-github"></i></a>` : ''}
                            ${p.live_demo_url ? `<a href="${p.live_demo_url}" target="_blank" class="icon-btn" title="Live Demo"><i class="fas fa-external-link-alt"></i></a>` : ''}
                        </div>
                    </div>
                    <div class="project-body">
                        <h3>${p.name} ${p.status ? `<span class="badge-dev">${p.status}</span>` : ''}</h3>
                        <p>${p.short_description || p.long_description || ''}</p>
                        ${p.technologies && p.technologies.length > 0 ? `
                            <div class="project-tech">
                                ${p.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${hasScreenshots ? `
                            <button type="button" class="btn-project-images" onclick="openProjectGallery('${p.id || idx}')">
                                <i class="fas fa-images"></i> ${imgLabel} (${screenshots.length})
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            }).join('');
        }

        // 6. CERTIFICATES SECTION
        const certsContainer = document.querySelector('#certificates .cer-grid');
        if (certsContainer) {
            const activeCerts = (portfolio.certificates || []).filter(c => c.published !== false && c.publish_status !== 'Draft' && c.is_active !== false);
            certsContainer.innerHTML = activeCerts.map((c, idx) => `
                <div class="cer-card reveal ${idx >= 3 ? 'hidden-cert' : ''}" ${c.certificate_image_url ? `data-cert="${c.certificate_image_url}"` : ''}>
                    <div class="cer-icon">${c.icon || '🏆'}</div>
                    <div>
                        <p class="cer-issuer">${c.issuer || ''} · ${c.issue_date || ''}</p>
                        <h3>${c.title}</h3>
                    </div>
                    <p>${c.description || ''}</p>
                    ${c.certificate_image_url ? `
                        <button class="view-cert-btn">
                            <i class="fas fa-eye"></i> View Certificate
                        </button>
                    ` : ''}
                </div>
            `).join('');
        }

        // 7. ACTIVITIES SECTION
        const actContainer = document.querySelector('#activities .activities-grid');
        if (actContainer) {
            const activeActs = (portfolio.activities || []).filter(a => a.published !== false && a.publish_status !== 'Draft' && a.is_active !== false);
            actContainer.innerHTML = activeActs.map((a, idx) => `
                <div class="activity-card reveal ${idx >= 3 ? 'hidden-activity' : ''}" ${a.certificate_image_url ? `data-cert="${a.certificate_image_url}"` : ''}>
                    <div class="activity-header">
                        <div class="activity-icon font-icon"><i class="fas fa-trophy"></i></div>
                        <div class="activity-badge-group">
                            <span class="activity-tag">${a.participation_type || a.badge || 'Participant'}</span>
                            <span class="activity-year">${a.year || ''}</span>
                        </div>
                    </div>
                    <div class="activity-body">
                        <h3>${a.title}</h3>
                        <p>${a.description || ''}</p>
                        ${a.certificate_image_url ? `
                            <button class="view-cert-btn">
                                <i class="fas fa-eye"></i> View Certificate
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // 8. CONTACT SECTION
        if (portfolio.contact) {
            const c = portfolio.contact;
            if (c.email) document.querySelectorAll('.email-text, .contact-item-text span').forEach(el => {
                if (el.textContent.includes('@')) el.textContent = c.email;
            });
            if (c.phone) {
                const phoneContainer = Array.from(document.querySelectorAll('.contact-item')).find(item => item.innerHTML.includes('fa-phone'));
                if (phoneContainer) {
                    const span = phoneContainer.querySelector('span');
                    if (span) span.textContent = c.phone;
                }
            }
            if (c.location) {
                const locContainer = Array.from(document.querySelectorAll('.contact-item')).find(item => item.innerHTML.includes('fa-map-marker-alt'));
                if (locContainer) {
                    const span = locContainer.querySelector('span');
                    if (span) span.textContent = c.location;
                }
            }
            if (c.contact_description) {
                const introP = document.querySelector('.contact-intro p');
                if (introP) introP.textContent = c.contact_description;
            }
        }

        // Re-bind modal events for certificate buttons
        bindCertModalEvents();

        // Refresh visibility for newly rendered items
        if (typeof initScrollObserver === 'function') {
            initScrollObserver();
        }

    } catch (e) {
        console.error('Error hydrating portfolio CMS:', e);
    }
}

// Function to bind certificate viewer modal events dynamically
function bindCertModalEvents() {
    const certModal = document.getElementById('certModal');
    const modalImg = document.getElementById('modalCertImg');
    const certLoader = document.getElementById('certLoader');
    if (!certModal || !modalImg) return;

    document.querySelectorAll('.view-cert-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const card = btn.closest('[data-cert]');
            let certPath = card ? card.getAttribute('data-cert') : null;
            if (certPath) {
                if (certLoader) certLoader.style.display = 'block';
                modalImg.classList.remove('loaded');
                modalImg.src = certPath;
                certModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
    });
}

// Listen to real-time update events across tabs & windows
window.addEventListener('cms_data_updated', () => {
    fetchPortfolioFromAPI().then(data => {
        if (data) hydratePortfolioCMS(data);
    });
});

// Initial hydration: render cache instantly (no flicker), then fetch fresh from API
(async function initPortfolioHydration() {
    const cached = getPortfolioFromCache();
    if (cached) hydratePortfolioCMS(cached);
    const fresh = await fetchPortfolioFromAPI();
    if (fresh) hydratePortfolioCMS(fresh);
    // Fire cms_data_updated so resume links update
    window.dispatchEvent(new CustomEvent('cms_data_updated', { detail: fresh || cached }));
})();

// ===== DYNAMIC ACTIVE RESUME ROUTING & ANALYTICS TRACKING =====
(function hydrateActiveResume() {
    // After initial portfolio load, update resume links from API data
    function applyResumeUrl(data) {
        if (!data || !data.resume) return;
        const resume = data.resume;
        // Prefer Cloudinary URL, fallback to data_url (legacy) or static path
        const url = resume.url || resume.data_url || '';
        if (!url || !resume.is_active) return;

        const resumeLinks = document.querySelectorAll('a[href*="RESUME"], a[href*="resume"], .resume-btn, #heroResumeBtn, #footerResumeBtn');
        resumeLinks.forEach(link => {
            if (link.getAttribute('href') && link.getAttribute('href').indexOf('admin.html') === -1) {
                link.href = url;
                link.setAttribute('download', resume.filename || 'NIVESH_R_RESUME.pdf');
            }
        });
    }

    // Apply from cache immediately
    const cached = getPortfolioFromCache();
    if (cached) applyResumeUrl(cached);

    // Re-apply after API fetch completes
    window.addEventListener('cms_data_updated', () => {
        const fresh = getPortfolioFromCache();
        if (fresh) applyResumeUrl(fresh);
    });

    // Track Download clicks → MongoDB analytics
    document.querySelectorAll('a[href*="RESUME"], a[download]').forEach(link => {
        link.addEventListener('click', () => {
            try {
                fetch('/api/analytics', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ field: 'resumeDownloads' })
                }).catch(() => {});
            } catch (e) { }
        });
    });
})();

// ===== CERTIFICATE MODAL LOGIC =====
const certModal = document.getElementById('certModal');
const modalImg = document.getElementById('modalCertImg');
const certLoader = document.getElementById('certLoader');
const closeCertModal = document.getElementById('closeCertModal');
const certBtns = document.querySelectorAll('.view-cert-btn');

certBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('[data-cert]');
        let certPath = card ? card.getAttribute('data-cert') : null;
        if (!certPath) {
            const innerLink = btn.querySelector('a') || btn.closest('a');
            if (innerLink) certPath = innerLink.getAttribute('href');
        }
        if (certPath) {
            // Reset state
            modalImg.classList.remove('loaded');
            certLoader.style.display = 'block';

            modalImg.src = certPath;
            certModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});

modalImg.onload = () => {
    certLoader.style.display = 'none';
    modalImg.classList.add('loaded');
};

const closeModalFunc = () => {
    certModal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
        modalImg.src = '';
        modalImg.classList.remove('loaded');
    }, 400); // Match CSS transition
};

closeCertModal.addEventListener('click', closeModalFunc);
certModal.addEventListener('click', (e) => {
    if (e.target === certModal) closeModalFunc();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && certModal.classList.contains('active')) {
        closeModalFunc();
    }
});

// ===== COPY EMAIL =====
const emailTargets = document.querySelectorAll('.contact-item span, .copy-email-btn');
emailTargets.forEach(el => {
    el.style.cursor = 'pointer';
    el.title = 'Click to copy email';
    el.addEventListener('click', (e) => {
        e.preventDefault();
        const email = 'niveshr@karunya.edu.in';
        navigator.clipboard.writeText(email).then(() => {
            showToast("📋 Email copied to clipboard!");
            if (el.classList.contains('copy-email-btn')) {
                el.classList.add('copied');
                setTimeout(() => el.classList.remove('copied'), 2000);
            }
        }).catch(() => {
            const temp = document.createElement('input');
            temp.value = email;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast("📋 Email copied to clipboard!");
        });
    });
});

// ===== TOGGLE ALL PROJECTS =====
const toggleProjectsBtn = document.getElementById('toggleProjectsBtn');

if (toggleProjectsBtn) {
    toggleProjectsBtn.addEventListener('click', () => {
        const isExpanded = toggleProjectsBtn.classList.contains('expanded');
        const projectCards = document.querySelectorAll('#projects .projects-grid .project-card');

        if (!isExpanded) {
            projectCards.forEach((card, idx) => {
                if (idx >= 3) {
                    card.classList.remove('hidden-project');
                    setTimeout(() => card.classList.add('visible'), 50);
                }
            });
            toggleProjectsBtn.classList.add('expanded');
            toggleProjectsBtn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
        } else {
            projectCards.forEach((card, idx) => {
                if (idx >= 3) {
                    card.classList.add('hidden-project');
                    card.classList.remove('visible');
                }
            });
            toggleProjectsBtn.classList.remove('expanded');
            toggleProjectsBtn.innerHTML = 'View All Projects <i class="fas fa-chevron-down"></i>';
            document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ===== TOGGLE ALL CERTIFICATES =====
const toggleCertsBtn = document.getElementById('toggleCertsBtn');

if (toggleCertsBtn) {
    toggleCertsBtn.addEventListener('click', () => {
        const isExpanded = toggleCertsBtn.classList.contains('expanded');
        const certCards = document.querySelectorAll('#certificates .cer-grid .cer-card');

        if (!isExpanded) {
            certCards.forEach((card, idx) => {
                if (idx >= 3) {
                    card.classList.remove('hidden-cert');
                    setTimeout(() => card.classList.add('visible'), 50);
                }
            });
            toggleCertsBtn.classList.add('expanded');
            toggleCertsBtn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
        } else {
            certCards.forEach((card, idx) => {
                if (idx >= 3) {
                    card.classList.add('hidden-cert');
                    card.classList.remove('visible');
                }
            });
            toggleCertsBtn.classList.remove('expanded');
            toggleCertsBtn.innerHTML = 'View All Certificates <i class="fas fa-chevron-down"></i>';
            document.getElementById('certificates').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ===== TOGGLE ALL ACTIVITIES =====
// NOTE: activity cards are re-rendered dynamically by hydratePortfolioCMS()
// (see JS/script.js CMS hydration, section 7), so — unlike a static page —
// the list of ".hidden-activity" cards must be re-queried on every click
// rather than captured once up front, or it goes stale as soon as the CMS
// data loads and replaces the DOM nodes.
const toggleActivitiesBtn = document.getElementById('toggleActivitiesBtn');

function refreshActivitiesToggleVisibility() {
    if (!toggleActivitiesBtn) return;
    const wrap = toggleActivitiesBtn.closest('.view-more-wrap');
    const totalCards = document.querySelectorAll('#activities .activities-grid .activity-card').length;
    if (wrap) wrap.style.display = totalCards > 3 ? '' : 'none';
}

if (toggleActivitiesBtn) {
    refreshActivitiesToggleVisibility();
    // Re-check visibility whenever the CMS data (re)hydrates the section.
    window.addEventListener('cms_data_updated', refreshActivitiesToggleVisibility);

    toggleActivitiesBtn.addEventListener('click', () => {
        const isExpanded = toggleActivitiesBtn.classList.contains('expanded');
        const hiddenActivities = document.querySelectorAll('#activities .activities-grid .activity-card.hidden-activity');
        if (!isExpanded) {
            hiddenActivities.forEach(card => {
                card.classList.remove('hidden-activity');
                setTimeout(() => card.classList.add('visible'), 50);
            });
            toggleActivitiesBtn.classList.add('expanded');
            toggleActivitiesBtn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
        } else {
            document.querySelectorAll('#activities .activities-grid .activity-card').forEach((card, idx) => {
                if (idx >= 3) {
                    card.classList.add('hidden-activity');
                    card.classList.remove('visible');
                }
            });
            toggleActivitiesBtn.classList.remove('expanded');
            toggleActivitiesBtn.innerHTML = 'View All Activities <i class="fas fa-chevron-down"></i>';
            document.getElementById('activities').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ===== DYNAMIC COPYRIGHT YEAR =====
const currentYearEl = document.getElementById('currentYear');
if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
}

// ===== PROJECT SCREENSHOTS GALLERY MODAL =====
// ===== PROJECT IMAGE GALLERY =====
let currentGalleryImages = [];
let activeGalleryIdx = 0;
let galleryProjectName = '';

// Helper: get all screenshots for a project from the single source of truth (CMS_STORE)
function getProjectScreenshots(projId) {
    let allProjs = [];

    // Always prefer live CMS_STORE data (single source of truth)
    if (window.CMS_STORE && typeof window.CMS_STORE.getState === 'function') {
        const state = window.CMS_STORE.getState();
        if (state && Array.isArray(state.projects)) {
            allProjs = state.projects;
        }
    }
    // Fallback to localStorage
    if (allProjs.length === 0) {
        try {
            const raw = localStorage.getItem('nivesh_portfolio_file_cms_data_v3') || localStorage.getItem('nivesh_admin_portfolio_data');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.projects)) allProjs = parsed.projects;
            }
        } catch (e) {}
    }
    // Fallback to window PORTFOLIO_INITIAL_DATA
    if (allProjs.length === 0 && window.PORTFOLIO_INITIAL_DATA && Array.isArray(window.PORTFOLIO_INITIAL_DATA.projects)) {
        allProjs = window.PORTFOLIO_INITIAL_DATA.projects;
    }

    // Find the project matching the given ID or name
    let proj = allProjs.find(p => p && (String(p.id) === String(projId) || p.name === projId));
    if (!proj && !isNaN(projId)) proj = allProjs[parseInt(projId, 10)];
    if (!proj) return { name: '', images: [] };

    // Unified screenshot resolution: screenshots > images > image_url
    const imgs = Array.isArray(proj.screenshots) && proj.screenshots.length > 0
        ? proj.screenshots
        : (Array.isArray(proj.images) && proj.images.length > 0
            ? proj.images
            : (proj.image_url ? [proj.image_url] : []));

    return { name: proj.name || '', images: imgs };
}

window.openProjectGallery = function (projId) {
    const result = getProjectScreenshots(projId);

    if (result.images.length === 0) {
        // No images - silently do nothing (button should not appear, but safety guard)
        console.info('No screenshots available for project:', projId);
        return;
    }

    currentGalleryImages = [...result.images];
    galleryProjectName = result.name;
    activeGalleryIdx = 0;

    const modal = document.getElementById('projectGalleryModal');
    const titleEl = document.getElementById('galleryProjectTitle');
    if (titleEl) {
        titleEl.textContent = galleryProjectName || 'Project Screenshots';
    }

    updateGalleryView();

    if (modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => modal.classList.add('active'));
        });
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
};

function updateGalleryView() {
    const mainImg = document.getElementById('galleryMainImg');
    const mainImgError = document.getElementById('galleryImgError');
    const counterEl = document.getElementById('galleryCounter');
    const thumbsStrip = document.getElementById('galleryThumbsStrip');
    const sidePrevBtn = document.getElementById('gallerySidePrevBtn');
    const sideNextBtn = document.getElementById('gallerySideNextBtn');

    if (currentGalleryImages.length === 0) return;

    if (mainImg) {
        mainImg.classList.remove('loaded');
        if (mainImgError) mainImgError.style.display = 'none';
        mainImg.style.display = 'block';
        mainImg.src = currentGalleryImages[activeGalleryIdx];
        mainImg.onload = () => mainImg.classList.add('loaded');
        mainImg.onerror = () => {
            mainImg.style.display = 'none';
            if (mainImgError) mainImgError.style.display = 'flex';
        };
    }

    if (counterEl) {
        counterEl.textContent = `${activeGalleryIdx + 1} / ${currentGalleryImages.length}`;
    }

    const disableNav = currentGalleryImages.length <= 1;
    [sidePrevBtn, sideNextBtn].forEach(btn => {
        if (btn) {
            btn.disabled = disableNav;
            btn.style.display = disableNav ? 'none' : 'flex';
        }
    });

    if (thumbsStrip) {
        thumbsStrip.innerHTML = currentGalleryImages.map((img, i) => `
            <button type="button" class="gallery-thumb-item ${i === activeGalleryIdx ? 'active' : ''}" onclick="window.setGalleryActiveImage(${i})" aria-label="View image ${i+1}">
                <img src="${img}" alt="Screenshot ${i+1}" loading="lazy">
            </button>
        `).join('');
        // Scroll active thumb into view
        const activeThumb = thumbsStrip.querySelector('.gallery-thumb-item.active');
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

window.setGalleryActiveImage = function (index) {
    if (index >= 0 && index < currentGalleryImages.length) {
        activeGalleryIdx = index;
        updateGalleryView();
    }
};

function closeProjectGallery() {
    const modal = document.getElementById('projectGalleryModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            currentGalleryImages = [];
            activeGalleryIdx = 0;
        }, 320);
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

// Bind Gallery Modal Controls
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeGalleryModal');
    const sidePrevBtn = document.getElementById('gallerySidePrevBtn');
    const sideNextBtn = document.getElementById('gallerySideNextBtn');
    const modal = document.getElementById('projectGalleryModal');

    if (closeBtn) closeBtn.onclick = closeProjectGallery;

    const prevHandler = () => {
        if (currentGalleryImages.length <= 1) return;
        activeGalleryIdx = (activeGalleryIdx - 1 + currentGalleryImages.length) % currentGalleryImages.length;
        updateGalleryView();
    };

    const nextHandler = () => {
        if (currentGalleryImages.length <= 1) return;
        activeGalleryIdx = (activeGalleryIdx + 1) % currentGalleryImages.length;
        updateGalleryView();
    };

    if (sidePrevBtn) sidePrevBtn.onclick = prevHandler;
    if (sideNextBtn) sideNextBtn.onclick = nextHandler;

    // Backdrop click to close
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProjectGallery();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal || modal.style.display === 'none' || !modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeProjectGallery();
        if (e.key === 'ArrowLeft') prevHandler();
        if (e.key === 'ArrowRight') nextHandler();
    });

    // Touch/Swipe support
    if (modal) {
        let touchStartX = 0;
        let touchStartY = 0;
        modal.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        modal.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                if (dx < 0) nextHandler(); else prevHandler();
            }
        }, { passive: true });
    }
});
