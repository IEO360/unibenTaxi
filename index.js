const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// initialise mongoose
mongoose.connect(process.env.MONGO_URI);

const con = mongoose.connection;
con.on('open', error => {
    if(!error){
        console.log('DB connection successful');
    }else{
        console.log(`DB connection failed with error: ${error}`);
    }
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//middleware
//user
app.use('/user_auth', require('./routes_user/auth'));


//driver
app.use('/driver_auth', require('./routes_driver/auth'));


//admin

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}....`));