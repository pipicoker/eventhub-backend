const { required } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: String,
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: [5, 'Email must be at least 5 characters long'],
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password is required only if googleId is not present
        },
        minLength: [6, 'Password must be at least 6 characters long'],
        select: false,
        trim: true,
    },
    role: {
        type: String,
        enum: ['attendee', 'organizer'],
        default: 'attendee',
    },
    avatar: {
        type: String,
        default: `https://api.dicebear.com/7.x/avataaars/svg?seed=default`,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    tokenExpiresAt: Date

}, {
    timestamps: true,   
})

module.exports = mongoose.model('User', userSchema);