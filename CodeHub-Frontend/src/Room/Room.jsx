import { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '../Components/DataContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CodeEditor from './CodeEditor';
import VideoChat from './VideoChat';
import WhiteBoard from './WhiteBoard';
import "../Styles/room.css";

const Room = () => {
    const { user, currRoom, socket } = useContext(DataContext);
    const navigate = useNavigate();
    let roomid = currRoom ? currRoom.roomid : "";
    const [inRoomUsers, setInRoomUsers] = useState([]);
    const [userUpdated, setUserUpdated] = useState(null);
    const [activeTab, setActiveTab] = useState('editor');
    const [showParticipants, setShowParticipants] = useState(false);
    const requestId = useRef(null);
    const userAdded = useRef(false);
    const isInitialized = useRef(false);
    const socketInitialized = useRef(false);

    // Initialize socket events only once
    useEffect(() => {
        if (!socket || socketInitialized.current) {
            console.log('Socket not available or already initialized');
            return;
        }

        console.log('Initializing socket events for room:', roomid);
        console.log('Socket connection state:', socket.connected);
        console.log('Socket ID:', socket.id);

        const handleConnect = () => {
            console.log('Socket connected, ID:', socket.id);
            // Get room users when connecting
            if (!isInitialized.current) {
                console.log('Fetching initial room users');
                socket.emit('getRoomUsers', { roomid });
                isInitialized.current = true;
            }
        };

        const handleJoinPermission = ({ user, senderID }) => {
            console.log('Join permission request from:', user.name);
            const permissionBlock = document.querySelector(".room .permission-block");
            if (permissionBlock) {
                permissionBlock.classList.add("active");
                permissionBlock.children[0].children[1].innerHTML = `<span>${user.name}</span>  wants to join the room`;
                permissionBlock.children[0].children[0].src = user.avatar;
                requestId.current = senderID;
            }
        };

        const handleRoomUsers = (users) => {
            console.log('🎉 RECEIVED ROOM USERS EVENT!');
            console.log('Users received:', users);
            console.log('Current user ID:', user.id);
            // Filter out current user and ensure no duplicates
            const filteredUsers = users.filter(u => u.id !== user.id);
            console.log('Filtered users (excluding current):', filteredUsers);
            console.log('Setting inRoomUsers to:', filteredUsers);
            setInRoomUsers(filteredUsers);
        };

        const handleUserJoin = ({ msg, newUser }) => {
            console.log('User joined event:', newUser);
            console.log('Current inRoomUsers before update:', inRoomUsers);
            setUserUpdated(newUser);
            userAdded.current = true;
            // toast.success(msg, {
            //     position: toast.POSITION.TOP_RIGHT
            // });
        };

        const handleUserLeft = ({ msg, userId }) => {
            console.log('User left event:', userId);
            console.log('Current inRoomUsers before update:', inRoomUsers);
            setUserUpdated({ id: userId });
            userAdded.current = false;
            // toast.error(msg, {
            //     position: toast.POSITION.TOP_RIGHT
            // });
        };

        const handleError = ({ error }) => {
            console.log('Socket error:', error);
        };

        const handleDebug = (data) => {
            console.log('🔍 DEBUG RESPONSE:', data);
            if (data.room) {
                console.log('Room found:', data.room);
                console.log('Room users:', data.room.users);
            } else {
                console.log('Room not found');
            }
            console.log('All rooms:', data.allRooms);
        };

        // Register all socket events
        socket.on('connect', handleConnect);
        socket.on('join permission', handleJoinPermission);
        socket.on('roomUsers', handleRoomUsers);
        socket.on('userJoin', handleUserJoin);
        socket.on('userLeft', handleUserLeft);
        socket.on('error', handleError);
        socket.on('debug', handleDebug);

        // Mark as initialized
        socketInitialized.current = true;
        console.log('Socket events initialized successfully');

        // CRITICAL FIX: Join the socket room first, then get users
        if (socket.connected && !isInitialized.current) {
            console.log('Socket already connected, joining room first...');
            // Join the socket room first
            socket.emit('join', {
                roomName: currRoom.name,
                roomid: roomid,
                name: user.name,
                avatar: user.avatar || ''
            });
            isInitialized.current = true;
        }

        // Add a timeout to check if we received room users
        const timeoutId = setTimeout(() => {
            if (inRoomUsers.length === 0) {
                console.log('⚠️ No room users received after 3 seconds, retrying...');
                console.log('Socket connected:', socket.connected);
                console.log('Socket ID:', socket.id);
                // Try to join the room again if no users received
                socket.emit('join', {
                    roomName: currRoom.name,
                    roomid: roomid,
                    name: user.name,
                    avatar: user.avatar || ''
                });
            }
        }, 3000);

        // Cleanup function
        return () => {
            console.log('Cleaning up socket events');
            clearTimeout(timeoutId);
            socket.off('connect', handleConnect);
            socket.off('join permission', handleJoinPermission);
            socket.off('roomUsers', handleRoomUsers);
            socket.off('userJoin', handleUserJoin);
            socket.off('userLeft', handleUserLeft);
            socket.off('error', handleError);
            socketInitialized.current = false;
            isInitialized.current = false;
        };
    }, [socket, roomid, user, currRoom]);

    // Handle user updates separately
    useEffect(() => {
        if (!userUpdated) return;
        
        console.log('Processing user update:', userUpdated, 'userAdded:', userAdded.current);
        
        if (userAdded.current) {
            setInRoomUsers(prevUsers => {
                console.log('Adding user, previous users:', prevUsers);
                // Prevent duplicate users
                const userExists = prevUsers.find(u => u.id === userUpdated.id);
                if (userExists) {
                    console.log('User already exists, not adding duplicate');
                    return prevUsers;
                }
                const newUsers = [...prevUsers, userUpdated];
                console.log('New users list:', newUsers);
                return newUsers;
            });
        } else {
            setInRoomUsers(prevUsers => {
                console.log('Removing user, previous users:', prevUsers);
                const newUsers = prevUsers.filter(u => u.id !== userUpdated.id);
                console.log('Users after removal:', newUsers);
                return newUsers;
            });
        }
        
        // Reset userUpdated to prevent unnecessary re-renders
        setUserUpdated(null);
    }, [userUpdated]);

    // Navigation effect
    useEffect(() => {
        if (user === null || currRoom === null) {
            navigate('/');
        }
    }, [user, currRoom, navigate]);

    // Scroll prevention
    useEffect(() => {
        const stopScroll = (e) => {
            e.preventDefault();
        };

        window.addEventListener("scroll", stopScroll);

        return () => {
            window.removeEventListener("scroll", stopScroll);
        };
    }, []);

    const updateRoomUsers = (users) => {
        // Filter out current user and duplicates
        const filteredUsers = users.filter(u => u.id !== user.id);
        setInRoomUsers(filteredUsers);
    }

    async function leaveRoom() {
        socket.emit('leave', { roomid });
        socket.off();
        navigate('/');
        window.location.reload();
    }

    function acceptPermission() {
        const permissionBlock = document.querySelector(".room .permission-block");
        if (permissionBlock) {
            permissionBlock.classList.remove("active");
            socket.emit("accept permission", { senderID: requestId.current });
        }
    }

    function rejectPermission() {
        const permissionBlock = document.querySelector(".room .permission-block");
        if (permissionBlock) {
            permissionBlock.classList.remove("active");
            socket.emit("reject permission", { senderID: requestId.current });
        }
    }

    if (currRoom && user) {
        return (
            <div className='room'>
                {/* Clean Header */}
                <div className="room-header">
                    <div className="header-left">
                        <div className="room-info">
                            <h1>{currRoom.name}</h1>
                            <span className="room-code">#{currRoom.roomid}</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="participants-info" onClick={() => setShowParticipants(!showParticipants)}>
                            <i className="fa-solid fa-users"></i>
                            <span>{inRoomUsers.length + 1} Participants</span>
                            <i className={`fa-solid fa-chevron-${showParticipants ? 'up' : 'down'}`}></i>
                        </div>
                        <button className="leave-btn" onClick={leaveRoom}>
                            <i className="fa-solid fa-sign-out-alt"></i>
                            Leave Room
                        </button>

                    </div>
                </div>

                {/* Participants Dropdown */}
                {showParticipants && (
                    <div className="participants-dropdown">
                        <div className="participants-list">
                            <div className="participant current">
                                <div className="avatar">
                                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff`} alt={user.name} />
                                    <div className="status-badge current-user"></div>
                                </div>
                                <div className="info">
                                    <span className="name">{user.name}</span>
                                    <span className="role">Host</span>
                                </div>
                            </div>
                            
                            {inRoomUsers.map((roomUser) => (
                                <div className="participant" key={roomUser.id}>
                                    <div className="avatar">
                                        <img src={roomUser.avatar || `https://ui-avatars.com/api/?name=${roomUser.name}&background=667eea&color=fff`} alt={roomUser.name} />
                                        <div className="status-badge online"></div>
                                    </div>
                                    <div className="info">
                                        <span className="name">{roomUser.name}</span>
                                        <span className="role">Member</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Area - 60-40 Split */}
                <div className="room-content">
                    {/* Left Side - 60% */}
                    <div className="main-workspace">
                        {/* Tool Toggle Buttons */}
                        <div className="tool-toggle">
                            <button 
                                className={`toggle-btn ${activeTab === 'editor' ? 'active' : ''}`}
                                onClick={() => setActiveTab('editor')}
                            >
                                <i className="fa-solid fa-code"></i>
                                Code Editor
                            </button>
                            <button 
                                className={`toggle-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}
                                onClick={() => setActiveTab('whiteboard')}
                            >
                                <i className="fa-solid fa-palette"></i>
                                Whiteboard
                            </button>
                        </div>
                        
                        {/* Content Area */}
                        <div className="workspace-content">
                            {activeTab === 'editor' ? (
                                <CodeEditor updateRoomUsers={updateRoomUsers} />
                            ) : (
                                <WhiteBoard />
                            )}
                        </div>
                    </div>

                    {/* Right Side - 40% */}
                    <div className="video-sidebar">
                        <VideoChat />
                    </div>
                </div>

                {/* Permission Block */}
                <div className="permission-block">
                    <div className="user-info">
                        <img src="" alt="" />
                        <div className="user-name"></div>
                    </div>
                    <div className="buttons">
                        <button className="accept" onClick={acceptPermission}>Accept</button>
                        <button className="reject" onClick={rejectPermission}>Reject</button>
                    </div>
                </div>

                <ToastContainer autoClose={2000} />
            </div>
        )
    }
    else return (null);
}

export default Room;