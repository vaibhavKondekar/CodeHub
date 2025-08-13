import { createContext, useState, useMemo, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import config from '../config';

export const DataContext = createContext(null);

const DataContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [currRoom, setCurrRoom] = useState(null);
    const socketRef = useRef(null);
    const isConnecting = useRef(false);
    
    // Create socket only once
    useEffect(() => {
        if (!socketRef.current && !isConnecting.current) {
            isConnecting.current = true;
            console.log('Creating new socket connection to:', config.SOCKET_URL);
            
            socketRef.current = io(config.SOCKET_URL, {
                transports: ['websocket'],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            
            socketRef.current.on('connect', () => {
                console.log('Connected to socket server, ID:', socketRef.current.id);
                isConnecting.current = false;
            });
            
            socketRef.current.on('disconnect', () => {
                console.log('Disconnected from socket server');
                isConnecting.current = false;
            });
            
            socketRef.current.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                isConnecting.current = false;
            });
            
            socketRef.current.on('reconnect', (attemptNumber) => {
                console.log('Reconnected to socket server after', attemptNumber, 'attempts');
            });
            
            socketRef.current.on('reconnect_error', (error) => {
                console.error('Socket reconnection error:', error);
            });
        }
        
        return () => {
            if (socketRef.current) {
                console.log('Cleaning up socket connection');
                socketRef.current.disconnect();
                socketRef.current = null;
                isConnecting.current = false;
            }
        };
    }, []);

    useEffect(() => {
        if (user && socketRef.current && socketRef.current.connected) {
            console.log('Mapping user to socket:', user._id);
            socketRef.current.emit("map socket", { userID: user._id });
        }
    }, [user]);

    return (
        <DataContext.Provider value={{ user, currRoom, setUser, setCurrRoom, socket: socketRef.current }}>
            {children}
        </DataContext.Provider>
    )
}

export default DataContextProvider;