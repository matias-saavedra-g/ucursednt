// autoPreload.js - Lightweight Infinite scroll for U-Cursos pagination

(async function() {
    'use strict';

    if (window.autoPreloadLoaded) return;
    window.autoPreloadLoaded = true;

    // ── 1. Settings check ────────────────────────────────────────────────────
    try {
        const result = await browser.storage.sync.get(['settings']);
        if (result.settings && result.settings.features && result.settings.features.autoPreloadPages === false) {
            return; // Feature disabled
        }
    } catch (error) {
        console.error('Error loading autoPreload settings:', error);
    }

    // ── 2. Locate Pagination & List Elements ─────────────────────────────────
    const pager = document.querySelector('.paginar');
    const itemSelector = 'ul[class^="c_"] > li, div[id^="raiz_"]';
    const existingItems = document.querySelectorAll(itemSelector);
    
    if (!pager || existingItems.length === 0) return;

    // Track URLs to prevent duplicate fetching
    const visitedUrls = new Set([window.location.href.split('#')[0]]);
    const urlsToLoad = [];

    // Helper to queue new URLs from paginators
    function queuePaginationLinks(context) {
        const links = Array.from(context.querySelectorAll('.paginas.no-movil a'))
            .map(a => a.href.split('#')[0]) // ignore hash fragments
            .filter(href => href && !href.includes('javascript'));
        
        links.forEach(url => {
            if (!visitedUrls.has(url) && !urlsToLoad.includes(url)) {
                urlsToLoad.push(url);
            }
        });
    }

    // Queue initial links
    queuePaginationLinks(document);
    
    if (urlsToLoad.length === 0) return; // No more pages to load

    let isFetching = false;

    // ── 3. Sentinel Setup for Intersection Observer ──────────────────────────
    const sentinel = document.createElement('div');
    sentinel.id = 'ucursednt-preload-sentinel';
    sentinel.style.height = '40px'; // Slightly larger target for smooth detection
    
    const lastItem = existingItems[existingItems.length - 1];
    lastItem.parentNode.insertBefore(sentinel, lastItem.nextSibling);

    // ── 4. Fetch and Append Logic ────────────────────────────────────────────
    async function fetchNextPage() {
        if (isFetching || urlsToLoad.length === 0) return;
        
        // Lock to prevent race conditions during rapid scrolling
        isFetching = true;
        
        // Grab exactly 1 page from the front of the queue
        const nextUrl = urlsToLoad.shift();
        visitedUrls.add(nextUrl);

        try {
            pager.style.opacity = '0.5';
            
            const response = await fetch(nextUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            // ── ENCODING FIX ──
            // Dynamically decode based on U-Cursos headers to preserve ñ and tildes
            const buffer = await response.arrayBuffer();
            let charset = 'utf-8';
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.toLowerCase().includes('iso-8859-1')) {
                charset = 'iso-8859-1';
            }
            const decoder = new TextDecoder(charset);
            const html = decoder.decode(buffer);
            
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const newItems = doc.querySelectorAll(itemSelector);
            
            // ── ANTI-DUPLICATION & APPENDING ──
            newItems.forEach(item => {
                let isDuplicate = false;
                
                // Check 1: For forum posts with specific IDs (e.g., raiz_12345)
                if (item.id && document.getElementById(item.id)) {
                    isDuplicate = true;
                } 
                // Check 2: For generic list items, check if we already have the main anchor link
                else {
                    const anchor = item.querySelector('a');
                    if (anchor && document.querySelector(`a[href="${anchor.getAttribute('href')}"]`)) {
                        isDuplicate = true;
                    }
                }

                // Append only if it's completely new
                if (!isDuplicate) {
                    sentinel.parentNode.insertBefore(item.cloneNode(true), sentinel);
                }
            });

            // Extract new pagination links from the fetched page to keep infinite scroll going
            queuePaginationLinks(doc);

            // Re-trigger the fuzzy search if there's active text in the search bar
            const searchInput = document.querySelector('#__fuzzy_q');
            if (searchInput && searchInput.value.trim() !== '') {
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

        } catch (err) {
            console.error('U-Cursedn\'t Preload Error:', err);
        } finally {
            pager.style.opacity = '1';
            
            // Hide the paginator entirely if we ran out of pages
            if (urlsToLoad.length === 0) {
                pager.style.display = 'none';
            }
            
            // Release the lock after DOM has settled
            setTimeout(() => {
                isFetching = false;
            }, 100); 
        }
    }

    // ── 5. Intersection Observer ─────────────────────────────────────────────
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            fetchNextPage();
        }
    }, {
        rootMargin: '300px', // Trigger slightly earlier to make it feel instantaneous
        threshold: 0
    });

    observer.observe(sentinel);
})();