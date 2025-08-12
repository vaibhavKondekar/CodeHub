import { createContext, useState, useMemo, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import config from '../config';

export const DataContext = createContext(null);

const DataContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [currRoom, setCurrRoom] = useState(null);
    const socket = useMemo(() => io(config.SOCKET_URL), []);

    socket.on('connect', () => {
        console.log('Connected to socket server', socket.id);
    });

    useEffect(() => {
        if (user) {
            socket.emit("map socket", { userID: user._id });
        }
    }, [user])

    return (
        <DataContext.Provider value={{ user, currRoom, setUser, setCurrRoom, socket }}>
            {children}
        </DataContext.Provider>
    )
}

export default DataContextProvider;