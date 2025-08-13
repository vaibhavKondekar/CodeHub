const { createRoom, addRoomUser, removeRoomUser, getRoom, updateRoomCode, updateCodeEditorCredentials, deleteUser, updateUserSocketMap, userSocketMap, listAllRooms } = require('../Room/socketRoom');

function manageRoom(socket, io) {

    const { id: socketId } = socket;

    socket.on('join', async ({ roomName = 'Room X', roomid, name, code = '', language = 'javascript', input = '', output = '', avatar = '' }) => {
        try {
            console.log(`Join request: ${name} (${socketId}) joining room ${roomid}`);
            if (!name) {
                throw new Error('Invalid data');
            }
            
            // Check if user is already in the room
            const existingRoom = getRoom(roomid);
            if (existingRoom) {
                console.log(`Room ${roomid} exists with ${existingRoom.users.length} users:`, existingRoom.users.map(u => `${u.name}(${u.id})`));
                const userExists = existingRoom.users.find(user => user.id === socketId);
                if (userExists) {
                    console.log(`User ${name} (${socketId}) already in room ${roomid}, just joining socket room`);
                    // User already in room, just join socket room
                    await socket.join(roomid);
                    // socket.emit('join', { msg: `Welcome back to ${roomName}`, room: existingRoom, socketId });
                    socket.emit('join', { msg: ``, room: existingRoom, socketId });
                    return;
                }
            } else {
                console.log(`Room ${roomid} does not exist, will create new`);
            }
            
            console.log(`Creating/updating room ${roomid} for user ${name}`);
            createRoom(roomid, roomName, code, language, input, output);
            addRoomUser(roomid, { id: socketId, name, avatar });

            await socket.join(roomid);
            console.log(`User ${name} (${socketId}) successfully joined room ${roomid}`);
            
            const finalRoom = getRoom(roomid);
            console.log(`Final room state: ${finalRoom.users.length} users:`, finalRoom.users.map(u => `${u.name}(${u.id})`));

            // socket.emit('join', { msg: `Welcome to ${roomName}`, room: finalRoom, socketId });
            socket.emit('join', { msg: ``, room: finalRoom, socketId });
            // socket.to(roomid).emit('userJoin', { msg: `New user joined ${name}`, newUser: { id: socketId, name, avatar } });
            socket.to(roomid).emit('userJoin', { msg: ``, newUser: { id: socketId, name, avatar } });
            
            // CRITICAL FIX: Send room users to the joining user immediately
            console.log(`Sending room users to newly joined user ${name}`);
            socket.emit('roomUsers', finalRoom.users);
            
            // Also notify all other users in the room about the updated user list
            socket.to(roomid).emit('roomUsers', finalRoom.users);
        } catch (err) {
            console.log(err);
            socket.emit('error', { error: err });
        }
    });

    // Add the missing getRoomUsers handler
    socket.on('getRoomUsers', ({ roomid }) => {
        try {
            console.log(`getRoomUsers requested for room ${roomid} by socket ${socketId}`);
            const room = getRoom(roomid);
            if (room) {
                console.log(`Room ${roomid} found with ${room.users.length} users:`, room.users.map(u => `${u.name}(${u.id})`));
                console.log(`Sending users to socket ${socketId}:`, room.users);
                // Send room users to the requesting socket only
                socket.emit('roomUsers', room.users);
            } else {
                console.log(`Room ${roomid} not found, sending empty array`);
                socket.emit('roomUsers', []);
            }
        } catch (err) {
            console.log('Error in getRoomUsers:', err);
            socket.emit('error', { error: err });
        }
    });

    socket.on('update', ({ roomid, patch }) => {
        try {
            updateRoomCode(roomid, patch);
            socket.to(roomid).emit('update', { patch });
        } catch (err) {
            console.log(err);
            socket.emit('error', { error: err });
        }
    });

    socket.on('leave', ({ roomid }) => {
        try {
            const name = removeRoomUser(roomid, socketId);
            socket.leave(roomid);
            io.to(roomid).emit('userLeft', { msg: `${name} left the room`, userId: socketId });
            console.log('user left', name);
            socket.to(roomid).emit('user left video call', { msg: `${name} left the room`, userID: socketId });
        } catch (err) {
            console.log(err);
            socket.emit('error', { error: err });
        }
    });

    socket.on('updateIO', ({ roomid, input, output, language }) => {
        try {
            updateCodeEditorCredentials(roomid, input, output, language);
            socket.to(roomid).emit('updateIO', {
                newinput: input,
                newoutput: output,
                newlanguage: language
            });
        } catch (err) {
            console.log(err);
            socket.emit('error', { error: err });
        }
    })

    socket.on('getRoom', ({ roomid }) => {
        try {
            io.in(roomid).emit('getRoom', { room: getRoom(roomid) });
        } catch (err) {
            console.log(err);
            socket.emit('error', { error: err });
        }
    })

    socket.on('disconnect', () => {
        for (let [key, value] of userSocketMap.entries()) {
            if (value === socketId) {
                userSocketMap.delete(key);
                break;
            }
        }
        let roomid = deleteUser(socketId);
        if (roomid !== null) {
            const name = removeRoomUser(roomid, socketId);
            socket.leave(roomid);
            io.to(roomid).emit('userLeft', { msg: `${name} left the room`, userId: socketId });
            console.log('user left', name);
            socket.to(roomid).emit('user left video call', { msg: `${name} left the room`, userID: socketId });
        }
    });


    socket.on("drawData", (data) => {
        socket.to(data.roomId).emit("drawData", data);
    });

    socket.on("start-video", ({ roomID }) => {
        let allUsers = getRoom(roomID).users;
        allUsers = allUsers.filter(user => user.id !== socketId);
        socket.emit('allUsers', allUsers);
    });

    socket.on("sending video signal", (data) => {
        socket.to(data.userToSignal).emit("new video user joined", { signal: data.signal, callerID: data.callerID, userSending: data.userSending });
    });

    socket.on("returning video signal from receiver", (data) => {
        socket.to(data.callerID).emit("sender receiving final signal", { signal: data.signal, id: socketId });
    });

    socket.on("toggle-video", (data) => {
        socket.broadcast.to(data.roomID).emit("toggle-video", { userID: data.userID });
    })

    socket.on("toggle-audio", (data) => {
        socket.broadcast.to(data.roomID).emit("toggle-audio", { userID: data.userID });
    })

    socket.on("map socket", ({ userID }) => {
        userSocketMap.set(userID, socketId);
    })

    socket.on("join permission", ({ room, user }) => {
        let owner = userSocketMap.get(room.owner);
        console.log(socketId);
        io.to(owner).emit("join permission", { room, user, senderID: socketId });
    })

    socket.on("accept permission", ({ senderID }) => {
        io.to(senderID).emit("permission accepted")
    })

    socket.on("reject permission", ({ senderID }) => {
        io.to(senderID).emit("permission rejected")
    })

    // Debug event handler
    socket.on("debug", ({ roomid }) => {
        console.log(`Debug request for room ${roomid}`);
        listAllRooms();
        const room = getRoom(roomid);
        if (room) {
            console.log(`Room ${roomid} details:`, room);
            socket.emit('debug', { room, allRooms: Object.keys(rooms) });
        } else {
            console.log(`Room ${roomid} not found`);
            socket.emit('debug', { room: null, allRooms: Object.keys(rooms) });
        }
    })

}

module.exports = manageRoom;
