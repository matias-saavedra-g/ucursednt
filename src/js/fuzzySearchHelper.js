// fuzzySearchHelper.js - Core fuzzy matching algorithm
// Checks if the characters of the query appear sequentially in the target text.

(function() {
    'use strict';

    if (window.FuzzySearchUtils) return;

    window.FuzzySearchUtils = {
        match: function(query, text) {
            if (!query) return true; // Empty query matches everything
            
            // Normalize inputs: lowercase and remove spaces for the query
            query = query.toLowerCase().replace(/\s+/g, '');
            text = text.toLowerCase();
            
            let qIndex = 0;
            for (let i = 0; i < text.length; i++) {
                if (text[i] === query[qIndex]) {
                    qIndex++;
                    // If we've matched all characters in the query, it's a hit
                    if (qIndex === query.length) return true;
                }
            }
            return false;
        }
    };
})();