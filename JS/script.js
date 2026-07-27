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
            } catch (err) {}
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
        const revealEls = document.querySelectorAll('.reveal, .project-card, .edu-entry, .activity-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) {
                    setTimeout(() => e.target.classList.add('visible'), i * 80);
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => observer.observe(el));

        // ===== BACK TO TOP =====
        document.getElementById('backTop').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // ===== CONTACT FORM =====
        document.getElementById('contactForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = document.getElementById('sendMessageBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            emailjs.send("service_ay6dt22", "template_r48p4bg", {
                user_name: document.getElementById("name").value,
                user_email: document.getElementById("email").value,
                message: document.getElementById("message").value
            })
                .then(() => {
                    showToast("✅ Message sent successfully!");
                    this.reset();
                })
                .catch(() => {
                    showToast("❌ Failed to send. Try again.");
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
        const emailSpan = document.querySelector('.contact-item span');
        if (emailSpan) {
            emailSpan.style.cursor = 'copy';
            emailSpan.title = 'Click to copy email';
            emailSpan.addEventListener('click', () => {
                const email = emailSpan.textContent;
                navigator.clipboard.writeText(email).then(() => {
                    showToast("📋 Email copied to clipboard!");
                });
            });
        }

        // ===== TOGGLE ALL PROJECTS =====
        const toggleProjectsBtn = document.getElementById('toggleProjectsBtn');
        const hiddenProjects = document.querySelectorAll('.project-card.hidden-project');

        if (toggleProjectsBtn) {
            toggleProjectsBtn.addEventListener('click', () => {
                const isExpanded = toggleProjectsBtn.classList.contains('expanded');
                if (!isExpanded) {
                    hiddenProjects.forEach(card => {
                        card.classList.remove('hidden-project');
                        setTimeout(() => card.classList.add('visible'), 50);
                    });
                    toggleProjectsBtn.classList.add('expanded');
                    toggleProjectsBtn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
                } else {
                    hiddenProjects.forEach(card => {
                        card.classList.add('hidden-project');
                        card.classList.remove('visible');
                    });
                    toggleProjectsBtn.classList.remove('expanded');
                    toggleProjectsBtn.innerHTML = 'View All Projects <i class="fas fa-chevron-down"></i>';
                    document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // ===== TOGGLE ALL CERTIFICATES =====
        const toggleCertsBtn = document.getElementById('toggleCertsBtn');
        const hiddenCerts = document.querySelectorAll('.cer-card.hidden-cert');

        if (toggleCertsBtn) {
            toggleCertsBtn.addEventListener('click', () => {
                const isExpanded = toggleCertsBtn.classList.contains('expanded');
                if (!isExpanded) {
                    hiddenCerts.forEach(card => {
                        card.classList.remove('hidden-cert');
                        setTimeout(() => card.classList.add('visible'), 50);
                    });
                    toggleCertsBtn.classList.add('expanded');
                    toggleCertsBtn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
                } else {
                    hiddenCerts.forEach(card => {
                        card.classList.add('hidden-cert');
                        card.classList.remove('visible');
                    });
                    toggleCertsBtn.classList.remove('expanded');
                    toggleCertsBtn.innerHTML = 'View All Certificates <i class="fas fa-chevron-down"></i>';
                    document.getElementById('certificates').scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // ===== TOGGLE ALL ACTIVITIES =====
        const toggleActivitiesBtn = document.getElementById('toggleActivitiesBtn');
        const hiddenActivities = document.querySelectorAll('.activity-card.hidden-activity');

        if (toggleActivitiesBtn) {
            if (hiddenActivities.length === 0) {
                const wrap = toggleActivitiesBtn.closest('.view-more-wrap');
                if (wrap) wrap.style.display = 'none';
            }
            toggleActivitiesBtn.addEventListener('click', () => {
                const isExpanded = toggleActivitiesBtn.classList.contains('expanded');
                if (!isExpanded) {
                    hiddenActivities.forEach(card => {
                        card.classList.remove('hidden-activity');
                        setTimeout(() => card.classList.add('visible'), 50);
                    });
                    toggleActivitiesBtn.classList.add('expanded');
                    toggleActivitiesBtn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
                } else {
                    hiddenActivities.forEach(card => {
                        card.classList.add('hidden-activity');
                        card.classList.remove('visible');
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
