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

        // Only run this code if the blog container exists on the page
        if (!container) {
            return;
        }

        // ★★★ YOUR MEDIUM USERNAME HERE ★★★
        const mediumUsername = 'diorjuraev'; // Replace with your actual Medium @username

        // Construct the RSS feed URL and the rss2json API URL
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

                if (data.status === 'ok') {
                    container.innerHTML = ''; // Clear previous content if any
                    const posts = data.items;

                    posts.forEach(post => {
                        // Create elements for each post
                        const postElement = document.createElement('div');
                        postElement.classList.add('list-item'); // Use existing list-item style

                        const titleElement = document.createElement('h3');
                        const titleLink = document.createElement('a');
                        titleLink.href = post.link;
                        titleLink.textContent = post.title;
                        titleLink.target = '_blank'; // Open Medium post in new tab
                        titleLink.rel = 'noopener noreferrer';
                        titleElement.appendChild(titleLink);

                        const dateElement = document.createElement('p');
                        dateElement.classList.add('date'); // Use existing date style
                        // Format date nicely
                        try {
                            const pubDate = new Date(post.pubDate);
                            dateElement.textContent = `Published: ${pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
                        } catch (e) {
                            dateElement.textContent = `Published: ${post.pubDate}`; // Fallback
                        }

                        // Description/Snippet - Use textContent for security (prevents XSS from feed HTML)
                        const descriptionElement = document.createElement('p');
                        // Create a temporary div to parse potential HTML in description and extract text
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = post.description || ''; // Use description if available
                        // Extract text, limit length for snippet
                        let snippet = tempDiv.textContent || tempDiv.innerText || '';
                        snippet = snippet.length > 250 ? snippet.substring(0, 250) + '...' : snippet;
                        descriptionElement.textContent = snippet;

                        // Link to read on Medium
                        const readMoreLink = document.createElement('a');
                        readMoreLink.href = post.link;
                        readMoreLink.target = '_blank';
                        readMoreLink.rel = 'noopener noreferrer';
                        readMoreLink.textContent = 'Read on Medium [↗]';
                        readMoreLink.classList.add('project-link'); // Reuse project link style

                        // Append elements to the post container
                        postElement.appendChild(titleElement);
                        postElement.appendChild(dateElement);
                        postElement.appendChild(descriptionElement);
                        postElement.appendChild(readMoreLink);

                        container.appendChild(postElement);
                    });

                } else {
                    console.error('Error fetching Medium posts:', data.message);
                    if (errorIndicator) errorIndicator.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error fetching or processing Medium posts:', error);
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                if (errorIndicator) errorIndicator.style.display = 'block';
            });
    }

    // --- Initialize Blog Post Loading ---
    loadBlogPosts();

}); // End of DOMContentLoaded listener