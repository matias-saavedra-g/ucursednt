// urlUtils.js - Utility functions for building U-Cursos URLs

// Storage utility functions
async function getChromeStorageItem(key) {
    try {
        const result = await chrome.storage.sync.get([key]);
        return result[key] || null;
    } catch (error) {
        console.error('Error getting Chrome storage item:', error);
        return null;
    }
}

// Function to build the correct tasks URL based on stored user data
async function getTasksUrl() {
    const userId = await getChromeStorageItem('userId');
    
    if (userId) {
        return `https://www.u-cursos.cl/usuario/${userId}/tareas_usuario/`;
    }
    
    // No fallback URLs - tasks will ALWAYS be in user ID format
    return null;
}

// Function to build course-specific URLs
async function getCourseUrl(courseId, courseSubId, path = '') {
    const campus = await getChromeStorageItem('campus');
    const academicInfo = await getChromeStorageItem('currentAcademicInfo');
    
    if (campus && academicInfo && courseId && courseSubId) {
        const baseUrl = `https://www.u-cursos.cl/${campus}/${academicInfo.year}/${academicInfo.semester}/${courseId}/${courseSubId}`;
        return path ? `${baseUrl}/${path}` : baseUrl;
    }
    
    return null;
}

// Function to check if current URL matches any tasks page pattern
function isTasksPage(url = window.location.href) {
    // Tasks URLs are ALWAYS in user ID format only
    const tasksUrlPattern = /https:\/\/www\.u-cursos\.cl\/usuario\/[a-f0-9]+\/tareas_usuario/;
    
    return tasksUrlPattern.test(url);
}

// Function to extract user ID from current URL
function extractUserIdFromUrl(url = window.location.href) {
    const userIdPattern = /https:\/\/www\.u-cursos\.cl\/usuario\/([a-f0-9]+)/;
    const match = url.match(userIdPattern);
    return match ? match[1] : null;
}

// Function to extract campus and course info from current URL
function extractCourseInfoFromUrl(url = window.location.href) {
    const coursePattern = /https:\/\/www\.u-cursos\.cl\/([^\/]+)\/(\d{4})\/([12])\/([^\/]+)\/([^\/]+)/;
    const match = url.match(coursePattern);
    
    if (match && match[1] !== 'usuario' && match[1] !== 'ucursednt' && match[1] !== 'logros') {
        return {
            campus: match[1],
            year: match[2],
            semester: match[3],
            courseId: match[4],
            courseSubId: match[5]
        };
    }
    
    return null;
}

// Function to reset user data capture (for debugging)
async function resetUserDataCapture() {
    try {
        await chrome.storage.sync.remove(['userId', 'campus', 'userDataCaptured', 'lastCourseInfo', 'currentAcademicInfo']);
        console.log('User data capture reset - data will be captured again on next page visit');
        return true;
    } catch (error) {
        console.error('Error resetting user data capture:', error);
        return false;
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTasksUrl,
        getCourseUrl,
        isTasksPage,
        extractUserIdFromUrl,
        extractCourseInfoFromUrl,
        resetUserDataCapture
    };
}
