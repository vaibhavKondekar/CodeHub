// Configuration for backend URLs
const config = {
    // Production backend URL (Render deployment)
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://codehub-backend-s15s.onrender.com',
    
    // Socket.io connection URL (Render deployment)
    SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'https://codehub-backend-s15s.onrender.com',
    
    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID
};

export default config;
