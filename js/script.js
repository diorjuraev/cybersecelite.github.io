document.addEventListener('DOMContentLoaded', () => {

    // --- Register Service Worker for PWA ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    // Service worker registered
                })
                .catch(() => {
                    // Service worker registration failed
                });
        });
    }

    // --- Intersection Observer for fade-in animation ---
    // --- Intersection Observer for fade-in animation with Stagger ---
    const sections = document.querySelectorAll('.page-section');

    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Add stagger classes to children (cards, list items)
                const children = entry.target.querySelectorAll('.platform-card, .list-item, .credential-badge, .spotlight-feature');
                children.forEach((child, index) => {
                    const delayClass = `stagger-${(index % 4) + 1}`;
                    child.classList.add(delayClass);
                    // Ensure children also have the transition property if not inhibited by css
                    child.style.opacity = '1';
                    child.style.transform = 'translateY(0)';
                });
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- Mouse Glow Tracking ---
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        document.documentElement.style.setProperty('--mouse-x', `${x}px`);
        document.documentElement.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });

    // Theme is fixed to dark; no toggle code needed.

    // --- Button ripple on click ---
    (function initButtonRipple() {
        function createRipple(e, el) {
            const rect = el.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            // Remove old ripple if any
            const old = el.querySelector('.ripple');
            if (old) old.remove();

            const span = document.createElement('span');
            span.className = 'ripple';
            span.style.width = span.style.height = size + 'px';
            span.style.left = x + 'px';
            span.style.top = y + 'px';
            el.appendChild(span);

            span.addEventListener('animationend', () => span.remove());
        }

        document.addEventListener('click', (e) => {
            const el = e.target.closest('.btn');
            if (!el) return;
            // Skip if user prefers reduced motion
            if (reduceMotion) return;
            createRipple(e, el);
        }, { passive: true });
    })();

    // --- Minimal cyber effects for hero (simplified for Synack style) ---
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Terminal Typing Effect for Hero ---
    (function initHeroAnimation() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        // Initital state
        heroContent.style.opacity = '1'; // Ensure visible for typing
        const subheadline = document.querySelector('.hero-subheadline');

        if (subheadline && !reduceMotion) {
            const text = subheadline.getAttribute('data-typing-text') || subheadline.textContent;
            subheadline.textContent = ''; // Clear text
            subheadline.classList.add('typing-cursor');

            let i = 0;
            const typeDelay = 20; // ms per char

            function typeWriter() {
                if (i < text.length) {
                    subheadline.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, typeDelay);
                } else {
                    // Remove cursor after a delay
                    setTimeout(() => subheadline.classList.remove('typing-cursor'), 2000);
                }
            }

            // Start typing after a brief delay
            setTimeout(typeWriter, 500);
        }

        // Fade in other elements
        const fadeElements = document.querySelectorAll('.hero-headline, .hero-cta-group, .hero-trust-indicators');
        fadeElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            el.style.transition = 'opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s';
        });

        setTimeout(() => {
            fadeElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }, 100);

    })();

    // --- Function to Load Medium Blog Posts ---
    function loadBlogPosts() {
        const container = document.getElementById('blog-posts-container');
        const loadingIndicator = document.getElementById('blog-loading');
        const errorIndicator = document.getElementById('blog-error');

        if (!container) return;

        const mediumUsername = 'diorjuraev';
        const mediumProfile = `https://medium.com/@${mediumUsername}`;
        const allowedHosts = new Set(['medium.com', 'link.medium.com']);
        const safeLink = (url) => {
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== 'https:') return mediumProfile;
                if (!allowedHosts.has(parsed.hostname)) return mediumProfile;
                return parsed.href;
            } catch (e) {
                return mediumProfile;
            }
        };
        const mediumRssFeed = `https://medium.com/feed/@${mediumUsername}`;
        const rss2jsonApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(mediumRssFeed)}`;

        fetch(rss2jsonApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';

                if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
                    throw new Error("No valid blog posts found.");
                }

                container.innerHTML = '';
                const posts = data.items.slice(0, 4); // show up to 4 posts

                posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.classList.add('list-item');

                    const titleElement = document.createElement('h3');
                    const titleLink = document.createElement('a');
                    titleLink.href = safeLink(post.link);
                    titleLink.textContent = post.title;
                    titleLink.target = '_blank';
                    titleLink.rel = 'noopener noreferrer';
                    titleElement.appendChild(titleLink);

                    const dateElement = document.createElement('p');
                    dateElement.classList.add('date');
                    try {
                        const pubDate = new Date(post.pubDate);
                        dateElement.textContent = `Published: ${pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
                    } catch (e) {
                        dateElement.textContent = `Published: ${post.pubDate}`;
                    }

                    const descriptionElement = document.createElement('p');
                    // Safer parsing using DOMParser
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(post.description || '', 'text/html');
                    let snippet = doc.body.textContent || doc.body.innerText || '';
                    snippet = snippet.length > 250 ? snippet.substring(0, 250) + '...' : snippet;
                    descriptionElement.textContent = snippet;

                    const readMoreLink = document.createElement('a');
                    readMoreLink.href = safeLink(post.link);
                    readMoreLink.target = '_blank';
                    readMoreLink.rel = 'noopener noreferrer';
                    // Using innerHTML here for the SVG icon within the anchor tag is acceptable as it's static content
                    readMoreLink.innerHTML = 'Read on Medium <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-external"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>';
                    readMoreLink.classList.add('project-link');

                    postElement.appendChild(titleElement);
                    postElement.appendChild(dateElement);
                    postElement.appendChild(descriptionElement);
                    postElement.appendChild(readMoreLink);

                    container.appendChild(postElement);
                });
            })
<<<<<<< HEAD
            .catch(() => {
=======
            .catch(error => {
                console.error('Error loading Medium posts:', error);
>>>>>>> parent of b411fdd (Remove console error logging and analytics console log for cleaner output)
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                if (errorIndicator) errorIndicator.style.display = 'block';
            });
    }

    // --- Initialize Blog Post Loading ---
    loadBlogPosts();

    // --- Simple analytics (local only) & sticky CTA for Services ---
    (function initAnalyticsAndStickyCTA() {
        const lsKey = 'cse-events';
        function loadStore() {
            try { return JSON.parse(localStorage.getItem(lsKey) || '{}'); } catch { return {}; }
        }
        function saveStore(store) {
            try { localStorage.setItem(lsKey, JSON.stringify(store)); } catch { }
        }
        function track(event, label) {
            const store = loadStore();
            const key = `${event}:${label || ''}`;
            store[key] = (store[key] || 0) + 1;
            saveStore(store);
<<<<<<< HEAD
            if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, label });
=======
            if (window && window.console) console.log('[analytics]', event, label||'', '=>', store[key]);
            if (Array.isArray(window.dataLayer)) window.dataLayer.push({event, label});
>>>>>>> parent of b411fdd (Remove console error logging and analytics console log for cleaner output)
        }

        // Track section views once
        const seen = new Set();
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && e.target.id && !seen.has(e.target.id)) {
                    seen.add(e.target.id);
                    track('view-section', e.target.id);
                }
            });
        }, { threshold: 0.3 });
        document.querySelectorAll('.page-section[id]').forEach(el => io.observe(el));

        // Track CTA clicks
        document.addEventListener('click', (e) => {
            const a = e.target.closest('[data-analytics]');
            if (!a) return;
            track('click', a.getAttribute('data-analytics'));
        }, { passive: true });

        // Sticky CTA (services page only if element exists)
        const sticky = document.getElementById('sticky-cta');
        if (sticky) {
            const onScroll = () => {
                const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
                const p = (window.scrollY || document.documentElement.scrollTop) / Math.max(h, 1);
                if (p > 0.3) sticky.hidden = false; else sticky.hidden = true;
            };
            onScroll();
            document.addEventListener('scroll', onScroll, { passive: true });
        }
    })();

    // --- Contact page enhancements: param parsing + form mailto ---
    (function initContactEnhancements() {
        const url = new URL(window.location.href);
        const serviceParam = (url.searchParams.get('service') || '').toLowerCase();
        const sourceParam = url.searchParams.get('source') || '';
        const serviceMap = {
            'ai-pentesting': 'AI/LLM & Agent Pentesting',
            'pentesting': 'Security Assessments & Pentesting',
            'appsec': 'Application Security',
            'ir': 'Incident Response & Forensics',
            'advisory': 'Consulting & Advisory'
        };
        const serviceLabel = serviceMap[serviceParam] || '';

        const email = 'diorjuraev@cybersecelite.com';
        const mailBtn = document.getElementById('contact-mailto');
        if (mailBtn) {
            const subj = `Request For Consultation${serviceLabel ? ' — ' + serviceLabel : ''}`;
            const body = sourceParam ? `Source: ${sourceParam}%0D%0A%0D%0A` : '';
            mailBtn.href = `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${body}`;
        }

        const form = document.getElementById('contact-form-element');
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const accessKey = '0c3b0244-9655-4c3b-b7d1-020dc694466d';
        const statusEl = document.getElementById('form-status');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            // Honeypot check - if filled, it's likely a bot
            if (formData.get('honeypot')) {
                if (statusEl) {
                    statusEl.textContent = 'Error submitting form.';
                    statusEl.className = 'form-status error';
                }
                return;
            }

            const key = String(accessKey || '').trim();
            if (!key) {
                if (statusEl) {
                    statusEl.textContent = 'Error: missing access key.';
                    statusEl.className = 'form-status error';
                }
                return;
            }
            formData.set('access_key', key);
            formData.set('captcha', 'false');

            // Build subject with service if available
            const service = formData.get('service');
            const subject = service
                ? `Request For Consultation — ${service}`
                : 'Request For Consultation — CyberSecElite';
            formData.set('subject', subject);

            // Normalize to URL-encoded payload (Web3Forms expects plain strings)
            // Exclude honeypot field from submission
            const payload = new URLSearchParams();
            formData.forEach((val, keyName) => {
                if (keyName !== 'honeypot') {
                    payload.append(keyName, typeof val === 'string' ? val : `${val}`);
                }
            });

            const originalText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
            }
            if (statusEl) {
                statusEl.textContent = 'Sending...';
                statusEl.className = 'form-status';
            }

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: payload.toString()
                });
                const data = await response.json();
                if (response.ok) {
                    form.reset();
                    if (statusEl) {
                        statusEl.textContent = 'Success! Your message has been sent.';
                        statusEl.className = 'form-status success';
                    }
                } else {
                    if (statusEl) {
                        statusEl.textContent = 'Error: ' + (data.message || 'Unable to submit.');
                        statusEl.className = 'form-status error';
                    } else {
                        alert('Error: ' + (data.message || 'Unable to submit.'));
                    }
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = 'Something went wrong. Please try again.';
                    statusEl.className = 'form-status error';
                } else {
                    alert('Something went wrong. Please try again.');
                }
            } finally {
                if (submitBtn) {
                    submitBtn.textContent = originalText || 'Submit';
                    submitBtn.disabled = false;
                }
            }
        });

        const serviceSelect = form.querySelector('select[name="service"]');
        if (serviceSelect && serviceLabel) {
            [...serviceSelect.options].forEach(opt => {
                if (opt.textContent.toLowerCase().includes(serviceLabel.toLowerCase().split(' & ')[0])) {
                    opt.selected = true;
                }
            });
        }
    })();

}); // End of DOMContentLoaded listener
