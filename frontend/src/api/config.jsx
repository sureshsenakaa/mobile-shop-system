const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

export const API_BASE_URL = (() => {
    const configured = import.meta.env.VITE_API_URL;
    if (configured && configured.trim()) {
        return configured.replace(/\/$/, '');
    }

    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }

    return DEFAULT_API_BASE_URL;
})();

export const apiUrl = (path = '') => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};

export const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${backendOrigin}${cleanPath}`;
};