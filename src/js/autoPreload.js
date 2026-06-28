// autoPreload.js - Lightweight Infinite scroll for U-Cursos pagination

(async function() {
    'use strict';

    if (window.autoPreloadLoaded) return;
    window.autoPreloadLoaded = true;

    // ── 1. Settings check ────────────────────────────────────────────────────
    try {
        const result = await browser.storage.sync.get(['settings']);
        if (result.settings && result.settings.features && result.settings.features.autoPreloadPages === false) {
            return;
        }
    } catch (error) {
        console.error('Error loading autoPreload settings:', error);
    }

    // ── 2. Locate Pagination & List Elements ─────────────────────────────────
    const pager = document.querySelector('.paginar');
    const itemSelector = 'ul[class^="c_"] > li, div[id^="raiz_"]';
    const existingItems = document.querySelectorAll(itemSelector);
    
    if (!pager || existingItems.length === 0) return;

    const visitedUrls = new Set([window.location.href.split('#')[0]]);
    const urlsToLoad = [];

    function queuePaginationLinks(context) {
        const links = Array.from(context.querySelectorAll('.paginas.no-movil a'))
            .map(a => a.href.split('#')[0])
            .filter(href => href && !href.includes('javascript'));
        
        links.forEach(url => {
            if (!visitedUrls.has(url) && !urlsToLoad.includes(url)) {
                urlsToLoad.push(url);
            }
        });
    }

    queuePaginationLinks(document);
    if (urlsToLoad.length === 0) return;

    let isFetching = false;

    // ── 3. Sentinel Setup ────────────────────────────────────────────────────
    const sentinel = document.createElement('div');
    sentinel.id = 'ucursednt-preload-sentinel';
    sentinel.style.height = '40px';
    
    const lastItem = existingItems[existingItems.length - 1];
    lastItem.parentNode.insertBefore(sentinel, lastItem.nextSibling);

    // ── 4. Fetch and Append Logic ────────────────────────────────────────────
    async function fetchNextPage() {
        if (isFetching || urlsToLoad.length === 0) return;
        isFetching = true;
        
        const nextUrl = urlsToLoad.shift();
        visitedUrls.add(nextUrl);

        try {
            pager.style.opacity = '0.5';
            
            const response = await fetch(nextUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
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
            
            newItems.forEach(item => {
                let isDuplicate = false;
                if (item.id && document.getElementById(item.id)) {
                    isDuplicate = true;
                } else {
                    const anchor = item.querySelector('a');
                    if (anchor && document.querySelector(`a[href="${anchor.getAttribute('href')}"]`)) {
                        isDuplicate = true;
                    }
                }
                if (!isDuplicate) {
                    sentinel.parentNode.insertBefore(item.cloneNode(true), sentinel);
                }
            });

            queuePaginationLinks(doc);

            const searchInput = document.querySelector('#__fuzzy_q');
            if (searchInput && searchInput.value.trim() !== '') {
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

        } catch (err) {
            console.error('U-Cursedn\'t Preload Error:', err);
        } finally {
            pager.style.opacity = '1';
            
            if (urlsToLoad.length === 0) {
                pager.style.display = 'none';
                observer.disconnect(); // ✅ Clean up: no more pages, no need to observe
                return;
            }

            // ✅ THE FIX: Force the observer to re-evaluate the sentinel's
            // intersection state by disconnecting and re-observing.
            // This is necessary because inserting nodes before the sentinel
            // moves it in the DOM without triggering a new intersection event.
            setTimeout(() => {
                isFetching = false;
                observer.unobserve(sentinel);
                observer.observe(sentinel);
            }, 150); // Small delay to let the DOM paint before re-evaluating
        }
    }

    // ── 5. Intersection Observer ─────────────────────────────────────────────
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isFetching) {
            fetchNextPage();
        }
    }, {
        rootMargin: '300px',
        threshold: 0
    });

    observer.observe(sentinel);
})();