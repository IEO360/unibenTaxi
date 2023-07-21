const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    mat_no: String,
    img: String,
    img_id: String,
    no_of_trips: { type: Number, default: 0 }
}, { collection: 'users' });

const model = mongoose.model('User', userSchema);

module.exports = model;