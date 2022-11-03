const dotenv = require('dotenv');
dotenv.config();
module.exports.allowedOrigins = [process.env.API_URL];