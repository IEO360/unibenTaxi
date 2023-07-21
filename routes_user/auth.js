const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Statistics = require('../models/statistics');

const { sendPasswordReset } = require('../utils/nodemailer');

const User = require('../models/user');

const router = express.Router();

// Signup endpoint
router.post('/signup', async (req, res) => {
    const { email, username, phone, mat_no, password1, password2 } = req.body;

    if(!email || !username || !phone || !password1 || !password2) {
        return res.status(400).send({ status: 'error', msg: 'please enter all fields' });
    }

    if((typeof email !== 'string')) {
        return res.status(400).send({ status: 'error', msg: 'invalid email' });
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!regex.test(String(email).toLocaleLowerCase())){
        return res.status(400).send({ status: 'error', msg: 'please enter a valid email' });
    }

    //Check for duplicate email
    const emailCheck = await User.findOne({ email });

    if(emailCheck) {
        return res.status(400).send({ status: 'error', msg: 'email or phone number already in use by another user' });
    }

    const phoneCheck = await User.findOne({ phone });

    if(phoneCheck) {
        return res.status(400).send({ status: 'error', msg: 'email or phone number already in use by another user' });
    }

    if(password1 !== password2) {
        return res.status(400).send({ status: 'error', msg: 'passwords do not match' });
    }

    if((typeof password1 !== 'string')) {
        return res.status(400).send({ status: 'error', msg: 'invalid password' });
    }

    if(password1.length < 6) {
        return res.status(400).send({ status: 'error', msg: 'password must be at least six characters long' });
    }

    try {
        //Encrypting password
        const passwordHash = await bcrypt.hash(password1, 10);

        let user = await User.create({
            username,
            email,
            phone,
            password: passwordHash,
            mat_no: mat_no.toUpperCase() || '',
            img: '',
            img_id: ''
        });
        
        //Generating jwt
        const token = jwt.sign({
            _id: user._id,
            email: user.email
        }, process.env.JWT_SECRET);

        await user.save();
        delete user.password;

        // Update statistics schema
        await Statistics.updateOne(
            { doc_type: 'uniben_taxi' }, 
            {
               $inc: {
                "no_of_users": 1,
               }
            },
            { upsert: true }
        );

        return res.status(200).send({ status: 'ok', msg: 'successfully created user', user, token });
    }

    catch(error) {
        console.log(error);
        return res.status(403).send({ status: 'error', msg: 'some error occurred', error });
    }
});

//Login Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    //Checks
    if(!username || !password) {
        return res.status(400).send({ status: 'error', msg: 'Please enter all fields' });
    }

    if(password.length < 6) {
        return res.status(400).send({ status: 'error', msg: 'email or password is incorrect' });
    }

    try {
        const user = await User.findOne({ username }).lean();

        if(!user) {
            return res.status(400).send({ status: 'error', msg: 'username or password is incorrect' });
        }

        if(await bcrypt.compare(password, user.password)) {
            //Generating token
            const token = jwt.sign({
                _id: user._id,
                email: user.email
            }, process.env.JWT_SECRET);

            delete user.password;

            return res.status(200).send({ status: 'ok', msg: 'Successful log in', user, token });
        } else {
            return res.status(400).send({ status:'error', msg: 'username or password is incorrect' });
        }
    }

    catch(error) {
        console.log(error);
        return res.status(403).send({ status:'error', msg: 'Some error occurred', error });
    }
});

// Endpoint to change password
router.post('/change_password', async (req, res) => {
    const { token, password, newPassword1, newPassword2 } = req.body;

    //Checks
    if(!token || !password || !newPassword1 || !newPassword2) {
        return res.status(400).send({ status: 'error', msg: 'please enter all fields' });
    }

    if((typeof password !== 'string') || (typeof newPassword1 !== 'string') || (typeof newPassword2 !== 'string')) {
        return res.status(400).send({status: 'error', msg: 'invalid password'});
    }

    if((newPassword1.length < 6) || (newPassword2.length < 6)){
        return res.status(400).send({ status: 'error', msg: 'passwords must be at least 6 characters long' });
    }

    if(newPassword1 !== newPassword2) {
        return res.status(400).send({ status: 'error', msg: 'new passwords do not match' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ _id: verify._id }).lean();

        if(await bcrypt.compare(password, user.password)) {
            // Encrypt new password
            const newPassword = await bcrypt.hash(newPassword1, 10);

            //update the password field
            await User.updateOne(
                { _id : user._id },
                { $set: { password: newPassword } }
            );

            return res.status(200).send({ status: 'ok', msg: 'successfully updated password' });
        } else {
            return res.status(400).send({ status: 'error', msg: 'incorrect password' });
        }
    }

    catch(error) {
        console.log(error);
        return res.status(403).send({ status:'error', msg: 'some error occurred', error });
    }
});

//Endpoint to reset password
// forgot password route
// this endpoint to allow a user reset their password
router.post('/resetpassword', async (req, res) => {
    const { email } = req.body;

    if(!email){
        return res.status(400).send({status: 'error', msg: 'please enter all fields'});
    }

    // check if the user exists
    const found = await User.findOne({ email }).lean();

    if(!found){
        return res.status(400).send({status: 'error', msg: 'there is no account with this email'});
    }

    // create resetPasswordCode
    
    /*
    Get the current timestamp and use to verify whether the
    store manager can still use this link to reset their password
    */

    const timestamp = Date.now();
    const resetPasswordCode = jwt.sign({ email, timestamp }, process.env.JWT_SECRET);

    //send email to user to reset password
    sendPasswordReset(email, resetPasswordCode);

    return res.status(200).json({status: 'ok', msg: 'password reset email sent, please check your email'});
    
});

router.get('/reset_password_page/:resetPasswordCode', async (req, res) => {
    const resetPasswordCode = req.params.resetPasswordCode;
    try{
        const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);

        const sendTime = data.timestamp;
        // check if more than 24 hours has elapsed
        const timestamp = Date.now();
        const diffInMilliseconds = Math.abs(timestamp - sendTime);
        const diffInHours = diffInMilliseconds / 3600000;
        console.log(diffInHours);

        if(diffInHours > 24) {
            res.status(400).json({status: 'error', msg:'time elapsed for password recovery link'});
        }

        return res.send(
            `<!DOCTYPE html>
            <html>
                <head>
                    <title>Reset Password</title>
                </head>
                <body>
                    <h1>Reset Password</h1>
                    <p>Enter your new password to reset your password</p>
                    <form action='/auth/reset_password' method='POST'>
                        <input type='text' id='pass' name='password' placeholder='Enter password' required minlength="6"><br><br>
                        <input type='text' id='confirm_pass' name='confirm_password' placeholder='Confirm password' required minlength="5"><br><br>
                        <input type='text' name='reset_code' value=${resetPasswordCode} hidden><br>
                        <input type='submit' value='Submit'>
                    </form>
                </body>
            </html>`
        );
        
    }catch(e){
        console.log(e);
        return res.status(200).send(`</div>
        <h1>Password Reset</h1>
        <p>An error occured!!! ${e}</p>
        </div>`);
    }

});

router.post('/reset_password', async (req, res) => {

    const { password, confirm_password, reset_code } = req.body;

    if(!password || !confirm_password || !reset_code){
        return res.status(400).json({status: 'error', msg: 'all fields must be entered'});
    }

    if(password !== confirm_password){
        return res.status(400).json({status: 'error', msg: 'passwords do not match'});
    }

    if(password.length < 6){
        return res.status(400).json({status: 'error', msg: 'password too small, should be at least 6 characters long'});
    }

    try{
        const data = jwt.verify(reset_code, process.env.JWT_SECRET);

        // hash the new password
        const passwordHash = await bcrypt.hash(password, 10)
        // update the password field
        await User.updateOne(
            { email: data.email },
            { $set: { password: passwordHash } }
        );

        // return a response which is a web page
        return res.status(200).send(
            `</div>
        <h1>Password Reset</h1>
        <p>Your password was reset successfully!!!</p>
        <p>You can now login with your new password.</p>
        </div>`
        );

    }catch(e){
        console.log("error", e);
        return res.status(200).send(`</div>
        <h1>Password Reset</h1>
        <p>An error occured!!! ${e}</p>
        </div>`);
    }
});

//Logout Endpoint
router.post('/logout', async (req, res) => {
    const { token } = req.body;

    //Checks
    if(!token) {
        return res.status(400).send({ status: 'error', msg: 'Please enter all fields' });
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).send({ status: 'ok', msg: 'Successful log out' });
    }

    catch(error) {
        console.log(error);
        return res.status(403).send({ status:'error', msg: 'Some error occurred', error });
    }
});

module.exports = router