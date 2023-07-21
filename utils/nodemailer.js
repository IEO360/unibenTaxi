const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    requireTLS: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const sendPasswordReset = (email, resetPasswordCode) => {
    transport.sendMail({
        from: "Uniben Taxi",
        to: email,
        subject: 'Password Reset',
        html: `<h1>Password Reset</h1>
        <h2>Hi User,</h2>
        <p>Click the link below to reset your password</p>
        <a href=https://unibentaxi.onrender.com/auth/reset_password_page/${resetPasswordCode}>Click here</a>
        <p>Hurry up, as this link expires in 24 hours.</p>
        <p>if you did not request a password reset, please disregard this email.</p>
        <p>Cheers</p>
        <p>Your App Service team</p>
        </div>`
    }).catch(err => console.log(err));
}

module.exports = { sendPasswordReset };