const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    fullname: String,
    email: String,
    phone: String,
    password: String,
    img: String,
    img_id: String
}, { collection: 'admins' });

const model = mongoose.model('Admin', adminSchema);

module.exports = model;