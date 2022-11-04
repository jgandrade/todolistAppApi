const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const secret_access = process.env.SECRET_ACCESS_JWT;
const secret_refresh = process.env.SECRET_REFRESH_JWT;

// DURING LOG-IN PHASE
module.exports.createWebToken = (user) => {
    const data = {
        id: user._id,
        userName: user.userName,
        emailAddress: user.emailAddress,
    }
    const accessToken = getAccessToken(data);
    const refreshToken = jwt.sign(data, secret_refresh, { expiresIn: '30d' });
    return ({ accessToken: accessToken, refreshToken: refreshToken });
}

function getAccessToken(user) {
    return jwt.sign(user, secret_access, { expiresIn: '5m' });
}

module.exports.getToken = (user) => {
    return jwt.sign(user, secret_access, { expiresIn: '5m' });
}

// CREATE REFRESH TOKEN 

// FOR MIDDLEWARE
module.exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader !== undefined) {
        let checkHeader = authHeader.split(" ")[1];
        return jwt.verify(checkHeader, secret_access, (err, data) => {
            if (err) return res.send({ auth: "Invalid token", response: false })
            else next();
        })
    } else {
        res.send({ message: "Auth failed! No token provided" });
    }
}

// DECODES TO USE PAYLOAD
module.exports.decode = token => {
    if (token !== undefined) {
        return jwt.verify(token, secret_access, (err, data) => {
            if (err) return null;
            else return jwt.decode(token, { complete: true }).payload;
        })
    } else {
        return null
    }
}
module.exports.decodeRefresh = token => {
    if (token !== undefined) {
        return jwt.verify(token, secret_refresh, (err, data) => {
            if (err) return null;
            else return jwt.decode(token, { complete: true }).payload;
        })
    } else {
        return null
    }
}

module.exports.decodeToken = token => {
    return jwt.decode(token, { complete: true }).payload;
}
