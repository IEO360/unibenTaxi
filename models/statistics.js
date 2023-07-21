const mongoose = require('mongoose');

const statisticSchema = mongoose.Schema({
    doc_type: { type: String, default: 'uniben_taxi' },
    no_of_users: { type: Number, default: 0 },
    no_of_drivers: { type: Number, default: 0 },
    no_of_blocked_drivers: { type: Number, default: 0 },
    no_of_successful_trips: { type: Number, default: 0 },
    trip_fare: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    deposit_tax: { type: Number, default: 0 }
}, { collections: 'statistics' });

const model = mongoose.model('Statistics', statisticSchema);

module.exports = model;