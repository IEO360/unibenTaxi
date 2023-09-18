const express = require('express');
const jwt = require('jsonwebtoken');

const cloudinary = require('../utils/cloudinary');
const upload = require('../utils/multer');

const User = require('../models/user');
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

        const user = await User.findOne({ _id: verify._id }).select(['-password']).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', user });
    }

    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

//Endpoint to edit profile

router.post('/edit', upload.single('img'), async (req, res) => {
    const { token, username, phone } = req.body;

    if(!token) {
        return res.status(400).send({ status: 'error', msg: 'all fields must be entered' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        
        let user = await User.findOne({ _id: verify._id }).lean();

        let result;
        if(req.file) {
            if(user.img !== '') {
                await cloudinary.uploader.destroy(user.img_id);
                result = await cloudinary.uploader.upload(req.file.path, { folder: 'uniben taxi' });
            } else {
                result = await cloudinary.uploader.upload(req.file.path, { folder: 'uniben taxi' });
            }
        }

        user = await User.findOneAndUpdate(
            { _id: user._id },
            { 
            username: username || user.username,
            phone: phone || user.phone,
            img: (req.file) ? result.secure_url : user.img,
            img_id: (req.file) ? result.public_id : user.img_id
            },
            { new: true }
        ).select([ '-password' ]).lean();

        return res.status(200).send({ status: 'ok', msg: 'successfully updated profile', user });
    }
    
    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

//Endpoint to view list of available drivers
router.post('/online', async (req, res) => {

    const { token, pageCount, resultPerPage } = req.body;

    if(!token || !pageCount || !resultPerPage){
        return res.status(400).json({status: 'error', msg: 'All fields must be entered'});
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        
        let page = (pageCount > 1) ? pageCount : 1;
        page -= 1;

        const onlineDrivers = await Driver.find({ is_online: true })
        .limit(resultPerPage)
        .skip(page * resultPerPage)
        .lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', onlineDrivers });
    }

    catch(error){
        console.log(error);
        return res.status(400).send({ status: 'error', msg: 'Some error occurred', error });
    }
});

//Endpoint to search available drivers
router.post('/search', async (req, res) => {

    const { token, search, pageCount, resultPerPage } = req.body;

    if(!token || !search || !pageCount || !resultPerPage){
        return res.status(400).json({status: 'error', msg: 'All fields must be entered'});
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        
        let page = (pageCount > 1) ? pageCount : 1;
        page -= 1;

        const drivers = await Driver.find({ is_online: true, fullname: new RegExp(search, 'i') })
        .limit(resultPerPage)
        .skip(page * resultPerPage)
        .lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', drivers });
    }

    catch(error){
        console.log(error);
        return res.status(400).send({ status: 'error', msg: 'Some error occurred', error });
    }
});
module.exports = router