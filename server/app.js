require("dotenv").config();
const exp = require("express");
const app = exp();
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

mongoose.connect('mongodb://localhost:27017/hopOnDB');

app.use(exp.json());
app.use(exp.urlencoded({extended: true}));

const saltRounds = parseInt(process.env.SALT_ROUNDS);

const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: process.env.FROM_EMAIL,
      pass: process.env.FROM_EMAIL_PASSWD,
    },
});
const driverSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    mobile: Number,
    password: String,  // password hash
    // indicates whether the driver docs have been verified
    verified: {type: Boolean, default: false}, 
    // stores the verification stage of each doc
    // 0 - doc verified , 1 - doc in review, 2 - doc to be submitted
    docs: {type: Array, default: [2,2,2,2,2,2]}, 
    // images encoded in base-64
    docImages: {type: [Buffer], default: [null,null,null,null,null,null]}, 
    rides: {type: Number, default: 0}, 
    rating: {type: Number,default: 0},
    driving: {type: Boolean, default: false},
    coords: {type: [Number],default: []}, // current coords of driver
    // double value representing the direction of travel
    heading: Number,
    // name of the area driver is located in
    location: {type: String, default: ""}
});

const riderSchema = new mongoose.Schema({
    name: {
        type : String,
        required : [true, "Name field is mandatory"]
    },
    username: {
        type : String,
        required : [true, "User Name field is mandatory"]
    },
    email: {
        type : String,
        required : [true, "Email field is mandatory"]
    },
    password: {
        type : String,
        required : [true, "Password field is mandatory"]
    },
    mobile: {
        type : String,
        required : [true, "Mobile Number field is mandatory"]
    },
    customerType: String,
    emailVerified: {
        type: Boolean,
        default: false,
        required: true
    }
});

const scheduledRideSchema = new mongoose.Schema({
    username: String,
    date: Date,
    time: String
});

const Driver = new mongoose.model("Driver", driverSchema);
const ScheduledRide = new mongoose.model("ScheduledRide", scheduledRideSchema);
const Rider = new mongoose.model("Rider",riderSchema);

app.post("/upload_file", (req,res) => {
    const {username,image,docInd} = req.body;

    Driver.findOne({ username: username}, (err,user) => {
        if(err){
            res.send({success: false});
        }else{
            user.docs[docInd] = 1;
            user.docImages[docInd] = image;
            user.save();
            res.send({success: true});
        }
    });
});

app.post("/fetch-driver-details", (req,res) => {
    const {username} = req.body;
    Driver.findOne({username: username}, (err,driver) => {
        if(err){
            res.send({success: false});
        }else{
            res.send({
                success: true,
                driver_data: driver
            });
        }
    });
});


app.get("/get-driver-coords",(req,res) => {
    const {location} = req.query;
    const locs = location.split(' ');
    const reg = new RegExp(locs[0]);

    Driver.find({location: reg}, (err,drivers) => {
            if(!err){
                const drv_details = drivers.map(drv => {
                    return {
                        username: drv.username,
                        coords: drv.coords
                    }
                });
                res.send({success:true, driver_details: drv_details});
            }else res.send({success: false});
    });    
})

app.post("/driver-regis", (req,res) => {
    const {username} = req.body;
    const newUser = new Driver({
        username: username
    });
    newUser.save();
    res.send("Registration successful");
});

app.post("/schedule-ride", (req,res) => {
    const {date,time} = req.body;
    const newRide = new ScheduledRide({
        date: date,
        time: time
    });
    newRide.save();
    res.send({success: true});
});

// middle-ware to authenticate users
function authenticate(req,res,next){
         
    const authHeader = req.headers['authorization']; // or req.headers['Authorization']

    // bearer token is sent in the folloeing format - Bearer <token>
    const token = authHeader && authHeader.split(' ')[1];
    
    if(token == null){
        res.send("Token not found in the header");
    }else{
        jwt.verify( token, process.env.JWT_SECRET_KEY, function(err,user){
            if(err){
                res.send("Authorization failed!");
            }else{
                req.user = user;
                next();
            }
        });
    }

}

// -----------------------------------------------  PREM'S CODE  ----------------------------------------------- //

app.post("/verificationCode",async function(req, res){
    if((req.body.code).toString() === req.body.enteredCode){
        const customerType = req.body.customerType
        if(customerType==="Driver"){
            Driver.findOne({username: req.body.username},(err,driver) => {
                if(err) console.log(err)
                else{
                    driver.emailVerified = true;
                    driver.save();
                }
            })
        }else{
            Rider.findOne({username: req.body.username},(err,rider) => {
                if(err) console.log(err)
                else{
                    rider.emailVerified = true;
                    rider.save();
                }
            })
        }
        // console.log(true)
        res.send({success: true})
        
    }
    else{
        // console.log(false)
        res.send({success: false, msg: "Invalid code!!"})

    }
})


app.post('/register', async function(req, res){
    const customerType = req.body.customerType;
    if(customerType === "Driver"){
        Driver.findOne({username:req.body.username},async function(err, driver){
            if(err){
                console.log(err);
            }else{
                if(driver === null){
                    Driver.findOne({email: req.body.email},async function(err, driver1){
                        if(err){
                            console.log(err);
                        }
                        else{
                            if(driver1===null){
                                const emailOptions = {
                                    from: process.env.FROM_EMAIL,
                                    to: req.body.email,
                                    subject: "HopOn Verification code",
                                    text: "Your email verification code is: "+req.body.code1
                                }
                                transporter.sendMail(emailOptions,function(err, info){
                                    if(err){
                                        console.log(err);
                                        return;
                                    }
                                });

                                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                                    if(!err){
                                        const newDriver = new Driver({
                                            username: req.body.username,
                                            name: req.body.name,
                                            email: req.body.email,
                                            mobile: req.body.mobile,
                                            password: hash,
                                            customerType: "Driver",
                                            emailVerified: false,
                                            latitude: 0,
                                            longitude: 0
                                        });
                                        newDriver.save();
                                        res.send({success: true});
                                    }else{
                                        console.log("Error while hashing password!");
                                        res.send({success: false});
                                    }
                                });
                            }
                            else{
                                res.send({success: false, msg:"Email Already Exists!!"})
                            }
                        }
                    })
                    
                }else{
                    res.send({success: false, msg:"Username Already Exists!!"})
                }
            }
        });
    }
    else{
        Rider.findOne({username:req.body.username},async function(err, rider){
            if(err){
                console.log(err);
            }else{
                if(rider === null){
                    Rider.findOne({email: req.body.email},async function(err, rider1){
                        if(err){
                            console.log(err);
                        }
                        else{
                            if(rider1===null){
                                const options = {
                                    from: "loop2022@outlook.in",
                                    to: req.body.email,
                                    subject: "HopOn Verification code",
                                    text: "Your verification code is: "+req.body.code
                                }
                                transporter.sendMail(options,function(err, info){
                                    if(err){
                                        console.log(err);
                                        return;
                                    }
                                });
                                console.log(saltRounds,req.body.password);
                                const hash = bcrypt.hashSync(req.body.password, saltRounds);
                                const newRider = new Rider({
                                    username: req.body.username,
                                    name: req.body.name,
                                    email: req.body.email,
                                    mobile: req.body.mobile,
                                    password: hash,
                                    customerType: "Rider",
                                    emailVerified: false
                                });
                                newRider.save();
                                res.send({success: true});
                            }
                            else{
                                res.send({success: false, msg:"Email Already Exists!!"})
                            }
                        }
                    })
                    
                }else{
                    res.send({success: false, msg:"Username Already Exists!!"})
                }
            }
        });
    }
});

function sendEmail(email){
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const options = {
        from: "loop2022@outlook.in",
        to: email,
        subject: "HopOn Verification code",
        text: "Your verification code is: "+randomCode
    }
    transporter.sendMail(options,function(err, info){
        if(err){
            console.log(err);
            return;
        }
    })
    return randomCode
}

app.post("/login",async function(req, res){
    const customerType = req.body.customerType;
    if(customerType==="Driver"){
        Driver.findOne({username: req.body.usernameoremail},function(err,driver){
            if(err){
                console.log(err)
            }
            else{
                if(driver===null){
                    Driver.findOne({email: req.body.usernameoremail},function(err,driver){
                        if(err){
                            console.log(err);
                        }else{
                            if(driver===null){
                                res.send({success:false,msg:"Enter valid Credentials"})
                            }
                            else{
                                const verified = bcrypt.compareSync(req.body.password, driver.password);
                                if(verified){
                                    var code = null
                                    if(driver.emailVerified===false){
                                        code = sendEmail(driver.email)
                                    }
                                    res.send({
                                        success:true,
                                        username: driver.username,
                                        customerType: driver.customerType,
                                        emailVerified:driver.emailVerified,
                                        code: code
                                    })
                                }
                                else{
                                    res.send({success:false, msg:"Enter valid credentials"})
                                }
                            }
                        }
                    })
                    
                }
                else{
                    const verified = bcrypt.compareSync(req.body.password, driver.password);
                    if(verified){
                        var code = null
                        if(driver.emailVerified===false){
                            code = sendEmail(driver.email)
                        }
                        res.send({
                            success:true,
                            username: driver.username,
                            customerType: driver.customerType,
                            emailVerified: driver.emailVerified,
                            code: code
                        })
                    }
                    else{
                        res.send({success:false,msg:"Enter valid credentials"})
                    }
                }
            }
        })
    }
    else{
        Rider.findOne({username: req.body.usernameoremail},function(err,rider){
            if(err){
                console.log(err)
            }
            else{
                if(rider===null){
                    Rider.findOne({email: req.body.usernameoremail},function(err,rider){
                        if(err){
                            console.log(err);
                        }else{
                            if(rider===null){
                                res.send({success:false, msg: "Enter valid credentials!!"})
                            }
                            else{
                                const verified = bcrypt.compareSync(req.body.password, rider.password)
                                if(verified){
                                    var code = null
                                    if(rider.emailVerified===false){
                                        code = sendEmail(rider.email)
                                    }
                                    res.send({
                                        success:true,
                                        username: rider.username,
                                        customerType: rider.customerType,
                                        emailVerified:rider.emailVerified,
                                        code: code
                                    })
                                }
                                else{
                                    res.send({success:false,msg:"Enter valid credentials"})
                                }
                            }
                        }
                    })
                    
                }
                else{
                    const verified = bcrypt.compareSync(req.body.password, rider.password);
                    if(verified){
                        var code = null
                        if(rider.emailVerified===false){
                            code = sendEmail(rider.email)
                        }
                        res.send({
                            success:true,
                            username: rider.username,
                            customerType: rider.customerType,
                            emailVerified:rider.emailVerified,
                            code: code
                        })
                    }
                    else{
                        res.send({success:false,msg:"Enter valid credentials"})
                    }
                }
            }
        })
    }
});

app.post("/verificationCode",async function(req, res){
    if((req.body.code1).toString() === req.body.enteredCode){
        const customerType = req.body.customerType
        if(customerType==="Driver"){
            Driver.findOne({username: req.body.username},(err,driver) => {
                if(err) console.log(err)
                else{
                    driver.emailVerified = true;
                    driver.save();
                }
            })
        }else{
            Rider.findOne({username: req.body.username},(err,rider) => {
                if(err) console.log(err)
                else{
                    rider.emailVerified = true;
                    rider.save();
                }
            })
        }
        // console.log(true)
        res.send({success: true})
        
    }
    else{
        // console.log(false)
        res.send({success: false, msg: "Invalid code!!"})

    }
});



app.listen(4000, () => {
    console.log("Server started on port 4000")
});