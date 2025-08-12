// Configuration for backend URLs
const config = {
    // Change this to switch between local and deployed backend
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080',
    
    // Socket.io connection URL
    SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080',
    
    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: "204761840995-36omp54cntsqs8r5aqud0mu99gqfl1pk.apps.googleusercontent.com"
};

export default config;
