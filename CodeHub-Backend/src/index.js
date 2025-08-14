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

// CORS for API
app.use(cors({
    origin: process.env.CLIENT_URL, // your frontend Render URL
    credentials: true
}));

// Body parser
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.json());

// WebSocket setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
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
