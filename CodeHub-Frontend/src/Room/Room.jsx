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

    useEffect(() => {
        if (user === null || currRoom === null) {
            navigate('/');
        }
        
        // Initialize room users if not already done
        if (!isInitialized.current && socket.connected) {
            socket.emit('getRoomUsers', { roomid });
            isInitialized.current = true;
        }

        socket.on('connect', () => {
            console.log('connected');
            console.log(socket.id);
            // Get room users when connecting
            if (!isInitialized.current) {
                socket.emit('getRoomUsers', { roomid });
                isInitialized.current = true;
            }
        })

        socket.on("join permission", (({ user, senderID }) => {
            const permissionBlock = document.querySelector(".room .permission-block");
            permissionBlock.classList.add("active");
            permissionBlock.children[0].children[1].innerHTML = `<span>${user.name}</span>  wants to join the room`;
            permissionBlock.children[0].children[0].src = user.avatar;
            requestId.current = senderID;
        }))

        // Listen for room users update
        socket.on('roomUsers', (users) => {
            setInRoomUsers(users.filter(u => u.id !== user.id)); // Exclude current user
        });

        window.addEventListener("scroll", stopScroll)

        function stopScroll(e) {
            e.preventDefault();
        }

        return () => {
            socket.off('roomUsers');
            socket.off('join permission');
            socket.off('userJoin');
            socket.off('userLeft');
            window.removeEventListener("scroll", stopScroll);
        }

    }, [socket, roomid, user])

    useEffect(() => {
        if (socket.connected) {
            socket.on('userJoin', ({ msg, newUser }) => {
                setUserUpdated(newUser);
                userAdded.current = true;
                toast.success(msg, {
                    position: toast.POSITION.TOP_RIGHT
                });
            })
            socket.on('userLeft', ({ msg, userId }) => {
                setUserUpdated({ id: userId });
                userAdded.current = false;
                toast.error(msg, {
                    position: toast.POSITION.TOP_RIGHT
                });
            })
            socket.on('error', ({ error }) => {
                console.log('error from socket call', error)
            })
        }
    }, [socket])

    useEffect(() => {
        if (!userUpdated) return;
        
        if (userAdded.current) {
            setInRoomUsers(prevUsers => {
                // Prevent duplicate users
                const userExists = prevUsers.find(u => u.id === userUpdated.id);
                if (userExists) {
                    return prevUsers;
                }
                return [...prevUsers, userUpdated];
            });
        } else {
            setInRoomUsers(prevUsers => 
                prevUsers.filter(u => u.id !== userUpdated.id)
            );
        }
    }, [userUpdated])

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
        permissionBlock.classList.remove("active");
        socket.emit("accept permission", { senderID: requestId.current });
    }

    function rejectPermission() {
        const permissionBlock = document.querySelector(".room .permission-block");
        permissionBlock.classList.remove("active");
        socket.emit("reject permission", { senderID: requestId.current });
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