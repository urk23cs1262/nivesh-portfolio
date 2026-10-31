/* NIVESH PORTFOLIO — LIGHT SCROLL STORY INTERACTIONS
   Framework-free, CMS-safe and progressively enhanced. */
(() => {
  const init = () => {
    const sections = [...document.querySelectorAll('main section, body > section, .hero, section[id]')]
      .filter((section, index, all) => section.id && all.indexOf(section) === index);
    if (!sections.length) return;

    document.body.classList.add('motion-ready');
    sections.forEach(section => {
      section.classList.add('story-section');
      const targets = section.querySelectorAll(
        '.section-label, .section-title, .about-grid > *, .edu-entry, .experience-entry, .skill-card, .project-card, .certificate-card, .activity-card, .contact-form, .contact-info, .footer-col'
      );
      targets.forEach((node, index) => {
        node.classList.add('story-reveal');
        node.style.transitionDelay = Math.min(index * 65, 260) + 'ms';
      });
    });

    const dots = document.createElement('nav');
    dots.className = 'story-dots';
    dots.setAttribute('aria-label', 'Section progress');
    sections.forEach(section => {
      const link = document.createElement('a');
      link.href = '#' + section.id;
      link.setAttribute('aria-label', section.getAttribute('aria-label') || section.id.replace(/-/g, ' '));
      link.addEventListener('click', event => {
        event.preventDefault();
        section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
      dots.appendChild(link);
    });
    document.body.appendChild(dots);
    const dotLinks = [...dots.querySelectorAll('a')];

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    document.querySelectorAll('.story-reveal').forEach(node => revealObserver.observe(node));

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const index = sections.indexOf(entry.target);
        dotLinks.forEach((link, i) => {
          if (i === index) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
        document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
          if (link.getAttribute('href') === '#' + entry.target.id) link.classList.add('active');
          else link.classList.remove('active');
        });
      });
    }, { threshold: 0.45 });
    sections.forEach(section => sectionObserver.observe(section));

    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        link.addEventListener('click', event => {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
