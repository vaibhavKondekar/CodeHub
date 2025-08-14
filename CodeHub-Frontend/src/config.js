// Configuration for backend URLs
const config = {
    // Production backend URL (Render deployment)
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://codehub-2e5l.onrender.com',
    
    // Socket.io connection URL (Render deployment)
    SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'https://codehub-2e5l.onrender.com',
    
    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: "204761840995-36omp54cntsqs8r5aqud0mu99gqfl1pk.apps.googleusercontent.com"
};

export default config;
