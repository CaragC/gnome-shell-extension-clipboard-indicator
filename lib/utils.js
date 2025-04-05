import { EXCLUDED_APPS } from './settings.js';

/**
 * Formats text by removing extra whitespace and newlines
 * @param {string} text - The text to format
 * @returns {string} Formatted text
 */
export function formatText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Remove multiple whitespaces and trim
    let result = text.replace(/\s+/g, ' ').trim();
    
    // Replace newlines with spaces
    result = result.replace(/\n+/g, ' ');
    
    return result;
}

/**
 * Checks if the current application is in the excluded apps list
 * @param {string} appName - The application name to check
 * @returns {boolean} True if app is excluded
 */
export function isAppExcluded(appName) {
    if (!appName || !EXCLUDED_APPS.length) {
        return false;
    }
    
    return EXCLUDED_APPS.some(app => app.toLowerCase() === appName.toLowerCase());
}

/**
 * Truncates text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength) + '...';
}

/**
 * Delays execution
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after specified time
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a debounced function that delays invoking func
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    
    return function(...args) {
        const context = this;
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}