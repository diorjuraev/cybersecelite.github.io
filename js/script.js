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
                console.log("Medium feed raw data:", data);

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

}); // End of DOMContentLoaded listener

tsParticles.load("tsparticles", {
  background: {
    color: "#0a0a0a"
  },
  fullScreen: {
    enable: true,
    zIndex: -1
  },
  interactivity: {
    events: {
      onClick: { enable: true, mode: "push" },
      onHover: { enable: true, mode: "repulse" },
      resize: true
    },
    modes: {
      push: { quantity: 4 },
      repulse: { distance: 100, duration: 0.4 }
    }
  },
  particles: {
    color: { value: "#00ffd5" },
    links: {
      color: "#00ffd5",
      distance: 150,
      enable: true,
      opacity: 0.3,
      width: 1
    },
    collisions: { enable: true },
    move: {
      direction: "none",
      enable: true,
      outModes: { default: "bounce" },
      random: false,
      speed: 1,
      straight: false
    },
    number: {
      density: { enable: true, area: 800 },
      value: 50
    },
    opacity: { value: 0.5 },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 4 } }
  },
  detectRetina: true
});