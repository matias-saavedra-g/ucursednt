// userDataCapture.js - Captures user ID and campus information from U-Cursos URLs (only once)

(async function() {
    // Storage utility functions
    async function setChromeStorageItem(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
        } catch (error) {
            console.error('Error setting Chrome storage item:', error);
        }
    }

    async function getChromeStorageItem(key) {
        try {
            const result = await chrome.storage.sync.get([key]);
            return result[key] || null;
        } catch (error) {
            console.error('Error getting Chrome storage item:', error);
            return null;
        }
    }

    // Check if we already have all necessary user data
    const existingUserId = await getChromeStorageItem('userId');
    const existingCampus = await getChromeStorageItem('campus');
    const userDataCaptured = await getChromeStorageItem('userDataCaptured');

    // If we already have both user ID and campus, or if we've marked data as captured, skip
    if (userDataCaptured || (existingUserId && existingCampus)) {
        console.log('User data already captured, skipping extraction');
        return;
    }

    console.log('First time capturing user data...');

    // Function to extract and store user ID from URL
    async function extractAndStoreUserId() {
        const currentUrl = window.location.href;
        
        // Pattern: https://www.u-cursos.cl/usuario/<user_id>/*
        const userIdPattern = /https:\/\/www\.u-cursos\.cl\/usuario\/([a-f0-9]+)/;
        const userIdMatch = currentUrl.match(userIdPattern);
        
        if (userIdMatch) {
            const userId = userIdMatch[1];
            console.log('User ID detected and stored:', userId);
            await setChromeStorageItem('userId', userId);
            
            // Background worker removed - no notification needed
            
            return userId;
        }
        
        return null;
    }

    // Function to extract and store campus from URL
    async function extractAndStoreCampus() {
        const currentUrl = window.location.href;
        
        // Pattern: https://www.u-cursos.cl/<campus>/<YYYY>/<semester>/<course_id>/<course_sub_id>/*
        const campusPattern = /https:\/\/www\.u-cursos\.cl\/([^\/]+)\/(\d{4})\/([12])\/([^\/]+)\/([^\/]+)/;
        const campusMatch = currentUrl.match(campusPattern);
        
        if (campusMatch) {
            const campus = campusMatch[1];
            const year = campusMatch[2];
            const semester = campusMatch[3];
            const courseId = campusMatch[4];
            const courseSubId = campusMatch[5];
            
            // Skip if campus is 'usuario' (that's for user ID URLs)
            if (campus === 'usuario' || campus === 'ucursednt' || campus === 'logros') {
                return null;
            }
            
            console.log('Campus detected and stored:', campus);
            await setChromeStorageItem('campus', campus);
            
            // Store additional course information
            await setChromeStorageItem('lastCourseInfo', {
                campus: campus,
                year: year,
                semester: semester,
                courseId: courseId,
                courseSubId: courseSubId,
                timestamp: Date.now()
            });
            
            // Background worker removed - no notification needed
            
            return campus;
        }
        
        return null;
    }

    // Function to extract semester based on current date and URL
    function getCurrentSemester() {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; // 1-12
        
        // First semester: March to July (months 3-7)
        // Second semester: August to December (months 8-12)
        // January-February could be either, so we need to check the URL or default to previous year's second semester
        
        if (month >= 3 && month <= 7) {
            return 1;
        } else if (month >= 8 && month <= 12) {
            return 2;
        } else {
            // January-February: assume it's still the second semester of the academic year that started the previous year
            return 2;
        }
    }

    // Function to get the academic year (might be different from calendar year in Jan-Feb)
    function getCurrentAcademicYear() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        // If it's January or February, we might still be in the previous academic year's second semester
        if (month <= 2) {
            return year - 1;
        }
        
        return year;
    }

    // Main execution - only runs if we don't have user data yet
    try {
        let capturedUserId = existingUserId;
        let capturedCampus = existingCampus;
        
        // Try to extract user ID if we don't have it
        if (!capturedUserId) {
            capturedUserId = await extractAndStoreUserId();
        }
        
        // Try to extract campus if we don't have it
        if (!capturedCampus) {
            capturedCampus = await extractAndStoreCampus();
        }
        
        // Store current academic period information
        await setChromeStorageItem('currentAcademicInfo', {
            year: getCurrentAcademicYear(),
            semester: getCurrentSemester(),
            timestamp: Date.now()
        });
        
        // Mark as captured if we have both pieces of data
        if (capturedUserId && capturedCampus) {
            await setChromeStorageItem('userDataCaptured', true);
            console.log('User data capture completed! UserId:', capturedUserId, 'Campus:', capturedCampus);
        } else {
            console.log('Partial user data captured. Still need:', 
                !capturedUserId ? 'userId' : '', 
                !capturedCampus ? 'campus' : '');
        }
        
    } catch (error) {
        console.error('Error in user data capture:', error);
    }
})();
