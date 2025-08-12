require('dotenv').config;
const axios = require('axios')

const url = "https://api.jdoodle.com/v1/execute";
const languageMap = {
    java: {
        name: "java",
        version: 4,
    },
    python: {
        name: "python3",
        version: 4,
    },
    c_cpp: {
        name: "cpp17",
        version: 0,
    },
    golang: {
        name: "go",
        version: 4,
    },
    csharp: {
        name: "csharp",
        version: 4,
    },
    nodejs: {
        name: "nodejs",
        version: 4,
    },
    rust: {
        name: "rust",
        version: 4,
    }
};

async function execute(req, res) {
    try {
        // Check if JDoodle credentials are configured
        if (!process.env.JDOODLE_CLIENT_ID || !process.env.JDOODLE_CLIENT_SECRET) {
            return res.status(200).send({ 
                output: "Code execution is not configured. Please set up JDoodle API credentials in your .env file.\n\nTo set up:\n1. Go to https://www.jdoodle.com/\n2. Sign up for free API access\n3. Add your credentials to .env file:\n   JDOODLE_CLIENT_ID=your_jdoodle_client_id\n   JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret",
                error: null 
            });
        }

        let { code, language } = req.body;
        const stdin = req.body.input || "";
        language = languageMap[language];
        const data = {
            script: code,
            language: language.name,
            versionIndex: language.version,
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            stdin: stdin,
        };
        const response = await axios.post(url, data);
        console.log(response.data)
        return res.status(200).send(response.data);
    } catch (error) {
        console.log(error);
        console.log('error in code execute');
        return res.status(500).send({ error: error.message || 'Code execution failed' });
    }
}
module.exports = { execute };