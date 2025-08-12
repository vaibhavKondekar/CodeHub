const jwt = require('jsonwebtoken')
require('dotenv').config;

const socketAuth = async (token) => {
    try {
        const decode = jwt.verify(token,process.env.JWT)
        return decode
    }
    catch (e) {
        return new Error('authentication failed')
    }
}

module.exports = socketAuth