const User = require('../models/Users');
const bcrypt = require("bcrypt");
const auth = require("../auth");

module.exports.register = async (req, res) => {
    const user = await User.find({ $or: [{ emailAddress: req.body.emailAddress }, { userName: req.body.userName }] }).then(result => result)
    if (user.length === 0) {
        let registerUser = new User({
            fullName: req.body.fullName,
            userName: req.body.userName,
            emailAddress: req.body.emailAddress,
            password: bcrypt.hashSync(req.body.password, 10)
        });

        registerUser.save();
        return res.send({ message: "User has been registered", response: true });

    } else return res.send({ message: "Duplicate Email / Username Found", response: false });
}

module.exports.login = async (req, res) => {
    const user = await User.find({ userName: req.body.userName }).then(result => result);
    if (user.length > 0) {
        const isPasswordCorrect = bcrypt.compareSync(req.body.password, user[0].password);
        if (isPasswordCorrect) {
            let token = auth.createWebToken(user[0]);
            user[0].refreshTokens.push(token.refreshToken)
            user[0].save();
            res.cookie('refresh_token', token.refreshToken,
                {
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000 * 30,
                    sameSite: "None",
                    secure: true
                })
            return res.send({ accessToken: token.accessToken, auth: { id: user._id, userName: user[0].userName, emailAddress: user[0].emailAddress }, message: "Cookie Set", response: true })

        } else {
            return res.send({ message: "Password incorrect", response: false })
        }
    } else {
        return res.send({ message: "Username not found", response: false })
    }
}

module.exports.handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refresh_token) return res.send({ message: "No cookie was sent", response: false });
    const refreshToken = cookies.refresh_token;
    const userData = auth.decodeRefresh(refreshToken);
    if (userData === null) {
        return res.send({ message: "Refresh Token Expired", response: false });
    }
    let user = await User.findById(userData.id).then(results => results);
    let isRefreshTokenExist = user.refreshTokens.some(e => e === refreshToken);

    if (isRefreshTokenExist) {
        const accessToken = auth.getToken({
            id: user._id,
            userName: user.userName,
            emailAddress: user.emailAddress,
        });

        return res.send({
            auth: {
                id: user._id,
                userName: user.userName,
                emailAddress: user.emailAddress
            }, accessToken: accessToken, response: true
        });
    } else {
        return res.send({ message: "No Refresh Token Found", response: false });
    }
}

module.exports.logout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refresh_token) return res.sendStatus(204);
    const refreshToken = cookies.refresh_token;
    const userData = auth.decodeRefresh(refreshToken);
    if (userData === null) {
        let user = await User.findById(auth.decodeToken(refreshToken).id).then(results => results);
        let isRefreshTokenExist = user.refreshTokens.some(e => e === refreshToken);
        if (!isRefreshTokenExist) {
            res.clearCookie('refresh_token', { httpOnly: true, secure: true, sameSite: "None" });
            return res.send({ message: "Refresh Token Expired", response: false });
        }
        user.refreshTokens = user.refreshTokens.filter(e => e !== refreshToken);
        user.save();
        res.clearCookie('refresh_token', { httpOnly: true, sameSite: "None", secure: true });
        return res.send({ message: "Refresh Token Expired", response: false });
    }
    let user = await User.findById(auth.decodeToken(refreshToken).id).then(results => results);
    // Is refresh token in db?
    let isRefreshTokenExist = user.refreshTokens.some(e => e === refreshToken);

    if (!isRefreshTokenExist) {
        res.clearCookie('refresh_token', { httpOnly: true, secure: true, sameSite: "None" });
        return res.sendStatus(204)
    }
    user.refreshTokens = user.refreshTokens.filter(e => e !== refreshToken);
    user.save();
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: "None", secure: true });
    return res.send({ message: "Refresh Token Removed and access token" });
}

module.exports.getList = async (req, res) => {
    const userData = auth.decode(req.headers.authorization.split(" ")[1]);

    let user = await User.findById(userData.id).then(results => results);
    let lists = user.todoList;

    return res.send({ lists: lists, response: true })
}

module.exports.addList = async (req, res) => {
    const userData = auth.decode(req.headers.authorization.split(" ")[1]);

    let user = await User.findById(userData.id).then(results => results);
    let lists = user.todoList;

    lists.push({ listName: req.body.listName });
    user.save();
    return res.send({ message: "List added", list: lists[lists.length - 1], response: true });
}

module.exports.deleteList = async (req, res) => {
    const userData = auth.decode(req.headers.authorization.split(" ")[1]);
    let user = await User.findById(userData.id).then(results => results);
    user.todoList = user.todoList.filter((e, i) => {
        return i !== req.body.listIndex
    });
    user.save();
    return res.send({ message: "List Deleted", list: user.todoList, response: true });
}

module.exports.addTaskToList = async (req, res) => {
    const userData = auth.decode(req.headers.authorization.split(" ")[1]);
    let user = await User.findById(userData.id).then(results => results);
    let lists = user.todoList;
    lists.forEach((e, i) => {
        if (i === req.body.listIndex) {
            let task = req.body.taskContent;
            e.tasks.push({ content: task });
            user.save();
            return res.send({ message: "Task Added to List", task: e.tasks[e.tasks.length - 1], response: true });
        }
    });
}

module.exports.deleteTaskFromList = async (req, res) => {
    const userData = auth.decode(req.headers.authorization.split(" ")[1]);
    let user = await User.findById(userData.id).then(results => results);
    let lists = user.todoList;
    lists.forEach((e, i) => {
        if (i === req.body.listIndex) {
            e.tasks.splice(req.body.taskIndex, 1);
            user.save();
            return res.send({ message: "Task Added to List", task: e.tasks, response: true });
        }
    });
}

module.exports.setTaskComplete = async (req, res) => {
    const userData = auth.decode(req.headers.authorization.split(" ")[1]);
    let user = await User.findById(userData.id).then(results => results);
    let lists = user.todoList;
    lists.forEach((e,i) => {
        if (i === req.body.listIndex) {
            e.tasks[req.body.taskIndex].isCompleted = !e.tasks[req.body.taskIndex].isCompleted;
            user.save();
            return res.send({ message: "Task Added to List", task: e.tasks, response: true });
        }
    });
}

