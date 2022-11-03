const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full Name is required"]
    },
    userName: {
        type: String,
        required: [true, "Username is required"]
    },
    emailAddress: {
        type: String,
        required: [true, "Email Address is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshTokens: [],
    createdOn: {
        type: String,
        default: () => {
            let todayDate = new Date().toISOString().slice(0, 10);
            return todayDate;
        }
    },
    todoList: [
        {
            listName: {
                type: String,
                required: [true, "List Name is required"]
            },
            tasks: [
                {
                    _id: false,
                    content: {
                        type: String,
                        required: [true, "Content is required"]
                    },
                    isCompleted: {
                        type: Boolean,
                        default: false
                    },
                }
            ],
            createdOn: {
                type: String,
                default: () => {
                    let todayDate = new Date().toISOString().slice(0, 10);
                    return todayDate;
                }
            }
        }
    ]
});

const User = new mongoose.model("Users", UserSchema);
module.exports = User;