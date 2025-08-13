const diff = require('diff-match-patch');
const dmp = new diff.diff_match_patch();
let rooms = {};
const userSocketMap = new Map();


function createRoom(roomid, roomName, code, language, input, output) {
    console.log(`Creating room: ${roomid} with name: ${roomName}`);
    if (!rooms[roomid]) {
        rooms[roomid] = {
            roomName,
            roomid,
            users: [],
            code,
            language,
            input,
            output
        }
        console.log(`Room ${roomid} created successfully`);
        console.log(`Current rooms:`, Object.keys(rooms));
    } else {
        console.log(`Room ${roomid} already exists`);
    }
}

function deleteRoom(roomid) {
    console.log('dateleting room', roomid)
    if (rooms[roomid]) {
        delete rooms[roomid];
    }
}

function addRoomUser(roomid, user) {
    if (rooms[roomid]) {
        // Check if user already exists in the room
        const userExists = rooms[roomid].users.find(existingUser => existingUser.id === user.id);
        if (!userExists) {
            console.log(`Adding user ${user.name} (${user.id}) to room ${roomid}`);
            rooms[roomid].users.push(user);
            console.log(`Room ${roomid} now has ${rooms[roomid].users.length} users:`, rooms[roomid].users.map(u => u.name));
        } else {
            console.log(`User ${user.name} (${user.id}) already exists in room ${roomid}`);
        }
    } else {
        console.log(`Room ${roomid} does not exist, cannot add user`);
    }
}

function removeRoomUser(roomid, userId) {
    let userName;
    if (rooms[roomid]) {
        rooms[roomid].users = rooms[roomid].users.filter(user => {
            if (user.id === userId) {
                userName = user.name;
                return false;
            }
            return true;
        });
    }
    if (rooms[roomid].users.length === 0)
        deleteRoom(roomid);
    return userName;
}

function getRoom(roomid) {
    return rooms[roomid] ? rooms[roomid] : null;
}

function updateRoomCode(roomid, patch) {
    if (rooms[roomid]) {
        try {
            const code = rooms[roomid].code;
            const [newCode, result] = dmp.patch_apply(patch, code);
            if (result[0])
                rooms[roomid].code = newCode;
            else
                console.log('patch failed');
        }
        catch (e) {
            console.log('update failed', e);
        }
    }
}

function updateCodeEditorCredentials(roomid, input = '', output = '', language = '') {
    if (rooms[roomid]) {
        console.log('update code editor credentials', input, output, language);
        try {
            rooms[roomid].input = input;
            rooms[roomid].output = output;
            rooms[roomid].language = language;
        } catch (e) { console.log(e) }

        console.log('after update', rooms[roomid])
    }
}

function deleteUser(userId) {
    for (let roomid in rooms) {
        for (let user in rooms[roomid].users) {
            if (rooms[roomid].users[user].id === userId) {
                return roomid;
            }
        }
    }
    return null;
}

function updateUserSocketMap(userId, socketId) {
    userSocketMap.set(userId, socketId);
}

function listAllRooms() {
    console.log('=== ALL ROOMS ===');
    for (let roomid in rooms) {
        console.log(`Room: ${roomid} - ${rooms[roomid].roomName} - Users: ${rooms[roomid].users.length}`);
        rooms[roomid].users.forEach(user => {
            console.log(`  - ${user.name} (${user.id})`);
        });
    }
    console.log('================');
}

module.exports = {
    createRoom,
    addRoomUser,
    removeRoomUser,
    getRoom,
    updateRoomCode,
    updateCodeEditorCredentials,
    deleteUser,
    updateUserSocketMap,
    userSocketMap,
    listAllRooms
};
