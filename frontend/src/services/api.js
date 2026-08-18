import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    // Don't set a global Content-Type here — let requests or the browser decide.
    headers: {},
});

// ✅ Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('jwtToken');
        
        // ✅ ALWAYS add token if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // IMPORTANT: For FormData, let browser set Content-Type with boundary.
        // Remove any Content-Type header in a robust, case-insensitive way so
        // the browser can set the proper multipart/form-data boundary header.
        if (config.data instanceof FormData) {
            const removeContentType = (hdrs) => {
                if (!hdrs) return;
                Object.keys(hdrs).forEach((k) => {
                    if (k.toLowerCase() === 'content-type') delete hdrs[k];
                });
            };

            // Top-level headers
            removeContentType(config.headers);
            // Axios stores method-specific and common headers here
            removeContentType(config.headers && config.headers.common);
            removeContentType(config.headers && config.headers.post);
            removeContentType(config.headers && config.headers.put);
            removeContentType(config.headers && config.headers.patch);
        }
        
        console.log('🚀 Request:', (config.method || '').toUpperCase(), config.url);
        console.log('📤 Headers (top-level):', config.headers);
        console.log('📤 Headers (common):', config.headers && config.headers.common);
        console.log('📤 Data type:', config.data instanceof FormData ? 'FormData' : typeof config.data);
        
        return config;
    },
    (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
    }
);

// ✅ Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('✅ Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ Error:', error.response?.status, error.response?.config?.url);
        console.error('❌ Error data:', error.response?.data);
        console.error('❌ Error headers:', error.response?.headers);
        
        // ✅ Only redirect on 401 Unauthorized, not 403
        if (error.response?.status === 401) {
            console.log('🔴 Authentication error. Redirecting to login...');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;