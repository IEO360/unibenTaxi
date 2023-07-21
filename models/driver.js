const mongoose = require('mongoose');

const driverSchema = mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    img: String,
    img_id: String,
    no_of_trips: { type: Number, default: 0 },
    no_of_ratings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    is_online: { type: Boolean, default: false }
}, { collection: 'drivers' });

const model = mongoose.model('Driver', driverSchema);

module.exports = model;