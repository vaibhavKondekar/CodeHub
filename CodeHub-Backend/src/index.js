const express = require('express');
const DBConnect = require('./DB/connect');
const userRouter = require('./Routes/userRoutes');
const roomRouter = require('./Routes/roomRoutes');
const codeRouter = require('./Routes/codeRoutes');
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require('cors');
const initSocketIO = require('./initSocket');
require('dotenv').config();
const bodyParser = require('body-parser');
const axios = require('axios');

const port = process.env.PORT || 8080;
const app = express();
const httpServer = createServer(app);

// CORS for API - Updated to handle Vercel frontend
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://codehub-frontend-sepia.vercel.app',
            'https://codehub-frontend-sepia.vercel.app/',
            'http://localhost:3000',
            process.env.CLIENT_URL
        ].filter(Boolean); // Remove undefined values
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Additional CORS headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
});

// Body parser
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.json());

// WebSocket setup - Updated CORS for Vercel
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                'https://codehub-frontend-sepia.vercel.app',
                'https://codehub-frontend-sepia.vercel.app/',
                'http://localhost:3000',
                process.env.CLIENT_URL
            ].filter(Boolean);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const connection = {
    count: 0,
    users: []
};
initSocketIO(io, connection);

// Routes
app.use(userRouter);
app.use(roomRouter);
app.use(codeRouter);

// Keep alive ping (to prevent Render from sleeping)
setInterval(() => {
    axios.get(process.env.BASE_URL)
        .then((res) => {
            console.log("Ping successful:", res.data);
        })
        .catch((err) => {
            console.log("Ping failed:", err.message);
        });
}, 300000); // every 5 minutes

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).send(connection);
});

// Database connection + server start
DBConnect().then(() => {
    console.log("DB connected");
    httpServer.listen(port, () => {
        console.log('Server started on port: ' + port);
    });
});
