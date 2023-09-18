const express = require('express');
const jwt = require('jsonwebtoken');

const cloudinary = require('../utils/cloudinary');
const upload = require('../utils/multer');

const Driver = require('../models/driver');

const router = express.Router();

//Endpoint to view profile
router.post('/view', async (req, res) => {
    const { token } = req.body;

    if(!token) {
        return res.status(400).send({ status: 'error', msg: 'all fields must be entered' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);

        const driver = await Driver.findOne({ _id: verify._id }).select(['-password']).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', driver });
    }

    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

//Endpoint to edit profile

router.post('/edit', upload.single('img'), async (req, res) => {
    const { token, fullname, phone } = req.body;

    if(!token) {
        return res.status(400).send({ status: 'error', msg: 'all fields must be entered' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        
        let driver = await Driver.findOne({ _id: verify._id }).lean();

        let result;
        if(req.file) {
            if(driver.img !== '') {
                await cloudinary.uploader.destroy(user.img_id);
                result = await cloudinary.uploader.upload(req.file.path, { folder: 'uniben taxi' });
            } else {
                result = await cloudinary.uploader.upload(req.file.path, { folder: 'uniben taxi' });
            }
        }

        driver = await Driver.findOneAndUpdate(
            { _id: driver._id },
            { 
            fullname: fullname || driver.fullname,
            phone: phone || driver.phone,
            img: (req.file) ? result.secure_url : driver.img,
            img_id: (req.file) ? result.public_id : driver.img_id
            },
            { new: true }
        ).select([ '-password' ]).lean();

        return res.status(200).send({ status: 'ok', msg: 'successfully updated profile', driver });
    }
    
    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

//Endpoint to set online atatus
router.post('/online', async (req, res) => {
    const { token } = req.body;

    if(!token) {
        return res.status(400).send({ status: 'error', msg: 'all fields must be entered' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        
        let driver = await Driver.findOne({ _id: verify._id }).lean();

        driver = await Driver.findOneAndUpdate(
            { _id: driver._id },
            { is_online: true },
            { new: true }
        ).select([ '-password' ]).lean();

        return res.status(200).send({ status: 'ok', msg: 'successfully updated online status', driver });
    }
    
    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

//Endpoint to set offline atatus
router.post('/offline', async (req, res) => {
    const { token } = req.body;

    if(!token) {
        return res.status(400).send({ status: 'error', msg: 'all fields must be entered' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        
        let driver = await Driver.findOne({ _id: verify._id }).lean();

        driver = await Driver.findOneAndUpdate(
            { _id: driver._id },
            { is_online: false },
            { new: true }
        ).select([ '-password' ]).lean();

        return res.status(200).send({ status: 'ok', msg: 'successfully updated online status', driver });
    }
    
    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

module.exports = router