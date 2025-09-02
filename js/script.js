document.addEventListener('DOMContentLoaded', () => {

    // --- Intersection Observer for fade-in animation ---
    const sections = document.querySelectorAll('.page-section');

    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // trigger when 10% of the element is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animation to save resources
                // observer.unobserve(entry.target);
            }
            // Optional: Remove class if element scrolls out of view
            // else {
            //     entry.target.classList.remove('visible');
            // }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

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

    // --- Minimal cyber effects for hero ---
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scramble-in title effect
    (function initScramble() {
        const el = document.getElementById('hero-title');
        if (!el) return;
        const finalText = el.textContent.trim();
        if (reduceMotion || finalText.length > 80) return; // skip on reduce motion or very long text

        const glyphs = "█▓▒░01<>[]{}#@*-/|\\_~^";
        let frame = 0;
        const totalFrames = Math.max(24, finalText.length * 2 + 10);

        function render() {
            const progress = frame / totalFrames;
            const revealCount = Math.floor(progress * finalText.length);
            let out = '';
            for (let i = 0; i < finalText.length; i++) {
                if (i < revealCount) {
                    out += finalText[i];
                } else if (finalText[i] === ' ') {
                    out += ' ';
                } else {
                    out += glyphs[(Math.random() * glyphs.length) | 0];
                }
            }
            el.textContent = out;
            frame++;
            if (frame <= totalFrames) {
                requestAnimationFrame(render);
            } else {
                el.textContent = finalText; // ensure final
            }
        }
        render();
    })();

    // Typewriter tagline with caret
    (function initTypewriter() {
        const wrap = document.getElementById('hero-tagline');
        if (!wrap) return;
        const caret = wrap.querySelector('.caret');
        const full = wrap.textContent.trim();
        if (reduceMotion || !caret) return; // respect user pref or missing caret

        // Clear and set up nodes: [textNode][caret]
        while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
        const textNode = document.createTextNode('');
        wrap.appendChild(textNode);
        wrap.appendChild(caret);

        let i = 0;
        const step = () => {
            if (i <= full.length) {
                textNode.nodeValue = full.slice(0, i);
                i++;
                setTimeout(step, 22); // ~45 chars/sec
            }
        };
        step();
    })();

    // --- Function to Load Medium Blog Posts ---
    function loadBlogPosts() {
        const container = document.getElementById('blog-posts-container');
        const loadingIndicator = document.getElementById('blog-loading');
        const errorIndicator = document.getElementById('blog-error');

        if (!container) return;

        const mediumUsername = 'diorjuraev';
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
                    titleLink.href = post.link;
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
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = post.description || '';
                    let snippet = tempDiv.textContent || tempDiv.innerText || '';
                    snippet = snippet.length > 250 ? snippet.substring(0, 250) + '...' : snippet;
                    descriptionElement.textContent = snippet;

                    const readMoreLink = document.createElement('a');
                    readMoreLink.href = post.link;
                    readMoreLink.target = '_blank';
                    readMoreLink.rel = 'noopener noreferrer';
                    readMoreLink.textContent = 'Read on Medium [↗]';
                    readMoreLink.classList.add('project-link');

                    postElement.appendChild(titleElement);
                    postElement.appendChild(dateElement);
                    postElement.appendChild(descriptionElement);
                    postElement.appendChild(readMoreLink);

                    container.appendChild(postElement);
                });
            })
            .catch(error => {
                console.error('Error loading Medium posts:', error);
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                if (errorIndicator) errorIndicator.style.display = 'block';
            });
    }

    // --- Initialize Blog Post Loading ---
    loadBlogPosts();

    // --- Simple analytics (local only) & sticky CTA for Services ---
    (function initAnalyticsAndStickyCTA(){
        const lsKey = 'cse-events';
        function loadStore(){
            try { return JSON.parse(localStorage.getItem(lsKey) || '{}'); } catch { return {}; }
        }
        function saveStore(store){
            try { localStorage.setItem(lsKey, JSON.stringify(store)); } catch {}
        }
        function track(event, label){
            const store = loadStore();
            const key = `${event}:${label||''}`;
            store[key] = (store[key]||0) + 1;
            saveStore(store);
            if (window && window.console) console.log('[analytics]', event, label||'', '=>', store[key]);
            if (Array.isArray(window.dataLayer)) window.dataLayer.push({event, label});
        }

        // Track section views once
        const seen = new Set();
        const io = new IntersectionObserver((entries)=>{
            entries.forEach(e=>{
                if (e.isIntersecting && e.target.id && !seen.has(e.target.id)){
                    seen.add(e.target.id);
                    track('view-section', e.target.id);
                }
            });
        }, {threshold: 0.3});
        document.querySelectorAll('.page-section[id]').forEach(el=>io.observe(el));

        // Track CTA clicks
        document.addEventListener('click', (e)=>{
            const a = e.target.closest('[data-analytics]');
            if (!a) return;
            track('click', a.getAttribute('data-analytics'));
        }, {passive:true});

        // Sticky CTA (services page only if element exists)
        const sticky = document.getElementById('sticky-cta');
        if (sticky){
            const onScroll = () => {
                const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
                const p = (window.scrollY || document.documentElement.scrollTop) / Math.max(h, 1);
                if (p > 0.3) sticky.hidden = false; else sticky.hidden = true;
            };
            onScroll();
            document.addEventListener('scroll', onScroll, {passive:true});
        }
    })();

    // --- Contact page enhancements: param parsing + form mailto ---
    (function initContactEnhancements(){
        const url = new URL(window.location.href);
        const serviceParam = (url.searchParams.get('service')||'').toLowerCase();
        const sourceParam = url.searchParams.get('source')||'';
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
        if (mailBtn){
            const subj = `Inquiry${serviceLabel?': '+serviceLabel:''} — CyberSecElite`;
            const body = sourceParam ? `Source: ${sourceParam}%0D%0A%0D%0A` : '';
            mailBtn.href = `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${body}`;
        }

        const form = document.getElementById('contact-form');
        if (!form) return;

        const serviceSelect = form.querySelector('select[name="service"]');
        if (serviceSelect && serviceLabel){
            [...serviceSelect.options].forEach(opt=>{
                if (opt.textContent.toLowerCase().includes(serviceLabel.toLowerCase().split(' & ')[0])){
                    opt.selected = true;
                }
            });
        }

        form.addEventListener('submit', (e)=>{
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            const parts = [];
            if (data.name) parts.push(`Name: ${data.name}`);
            if (data.email) parts.push(`Email: ${data.email}`);
            if (data.service) parts.push(`Service: ${data.service}`);
            if (data.timeline) parts.push(`Timeline: ${data.timeline}`);
            if (data.environment) parts.push(`Environment: ${data.environment}`);
            if (data.message) parts.push(`Message:\n${data.message}`);
            const subject = `Inquiry: ${data.service || serviceLabel || 'CyberSecElite'}`;
            const body = parts.join('\n');
            const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
        });
    })();

}); // End of DOMContentLoaded listener
