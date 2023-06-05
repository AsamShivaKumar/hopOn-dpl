require("dotenv").config();
const exp = require("express");
const app = exp();
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require("cors");

const cron = require('node-cron');

const server = require('http').createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin: 'https://hopon-client.onrender.com',
        credentials: true,
        methods: ["GET","POST"]
    }
});

mongoose.connect("mongodb+srv://ask:" + process.env.ATLAS_PASS + "@cluster0.pi81t.mongodb.net/hopOnDB");

app.use(exp.json());
app.use(cors());
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
    location: {type: String, default: ""},
    reg_no: {type: String, default: "XX0000"},
    emailVerified: {
        type: Boolean,
        default: false,
        required: true
    }
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
    time: String,
    pickup: [Number],
    drop: [Number],
    pickLoc: String,
    dropLoc: String,
    driver: String,
    location: String,
    dist: Number,
    travelTime: Number
});

const rideSchema = new mongoose.Schema({
    usernames: [String],
    pickup: [[Number]],
    drop: [[Number]],
    pickLoc: [String],
    dropLoc: [String],
    otp: [Number],
    location: String,
    travelTime: [Number],
    dist: [Number],
    driver: String,
    sharing: {type: Number, default: 0},
    mobile: String,
    reg_no: String
});

const sharedRideSchema = new mongoose.Schema({
    username: String,
    pickup: [Number],
    drop: [Number],
    pickLoc: String,
    dropLoc: String,
    otp: Number,
    location: String,
    travelTime: Number,
    dist: Number,
    driver: String
})

const continuousBookingSchema = new mongoose.Schema({
    username: String,
    fromdate: String,
    todate: String,
    excludedates: Array,
    locs: Array
});

const Driver = new mongoose.model("Driver", driverSchema);
const ScheduledRide = new mongoose.model("ScheduledRide", scheduledRideSchema);
const Rider = new mongoose.model("Rider", riderSchema);
const Ride = new mongoose.model("Ride", rideSchema);
const ContBooking = new mongoose.model("ContBooking", continuousBookingSchema);
const SharedRide = new mongoose.model("SharedRide", sharedRideSchema);

io.on("connection", socket => {
    
    socket.on("driver-coords", (user_name,location,coords) => {
        io.emit(`rider-${location}`,user_name,location,coords);
    });

    socket.on('shared-ride-req', (req) => {
        const {locs, otp, token, location, time, dist, pois} = req;
        jwt.verify(token, process.env.JWT_SECRET_KEY, function(err,user){
            if(err){
                // can emit an event regarding failure of ride creation
                console.log("Authorization failed during creation of ride object!");
            }else{
                user = user._doc;
                const newRide = new SharedRide({
                    username: user.username,
                    pickup: locs[0],
                    drop: locs[1],
                    otp: otp,
                    location: location,
                    travelTime: time,
                    dist: dist,
                    pickLoc: pois[0],
                    dropLoc: pois[1]
                });
                
                newRide.save();
                io.emit('shared-ride-request', newRide._id, user.username, locs, pois, time, dist);
                io.emit(`shared-ride-res-${user.username}`, newRide);
            }
        });
    })

    socket.on("ride-request", (req) => {
        const {locs, otp, token, location, time, dist, pois, sharing} = req;
        jwt.verify(token, process.env.JWT_SECRET_KEY, function(err,user){
            if(err){
                // can emit an event regarding failure of ride creation
                console.log("Authorization failed during creation of ride object!");
            }else{
                user = user._doc;
                const newRide = new Ride({
                    usernames: [user.username],
                    pickup: [locs[0]],
                    drop: [locs[1]],
                    otp: [otp],
                    location: location,
                    travelTime: [time],
                    dist: [dist],
                    pickLoc: [pois[0]],
                    dropLoc: [pois[1]],
                    sharing: sharing
                });
                
                newRide.save();
                io.emit('ride-request', newRide._id, user.username, locs, pois, time, dist);
                io.emit(`ride-res-${user.username}`, newRide);
            }
        });
    });

    socket.on(`get-driver-coords`, (location) => {
        io.emit(`send-coords-${location}`,{});
    });

    socket.on("accept-shared-ride", (sh_ride_id,ride_id,token) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err,user) => {
            if(err) console.log(err);
            else{
                user = user._doc;
                console.log("here!");
                SharedRide.findOne({_id: sh_ride_id}, (err,sh_ride) => {
                    if(err) io.emit(`${user.username}-ridereq-response`, false);
                    else{
                        if(!sh_ride.driver){
                            sh_ride.driver = user.username;

                            Ride.findOne({_id: ride_id}, (err,ride) => {
                                if(err) console.log(err);
                                ride.usernames.push(sh_ride.username);
                                ride.pickup.push(sh_ride.pickup)
                                ride.drop.push(sh_ride.drop)
                                ride.pickLoc.push(sh_ride.pickLoc)
                                ride.dropLoc.push(sh_ride.dropLoc)
                                ride.otp.push(sh_ride.otp)
                                ride.travelTime.push(sh_ride.travelTime)
                                ride.dist.push(sh_ride.dist)
                                ride.save();
                                // console.log("RideObj",ride);
                                io.emit(`${user.username}-shared-ridereq-response`, true, ride);
                                // console.log(`${sh_ride_id}-shared-ride-accepted`);
                                io.emit(`${sh_ride_id}-shared-ride-accepted`, ride);
                            });                            
                        }else socket.emit(`${user.username}-ridereq-response`, false)
                    }
                })
            }
        });
    });

    socket.on('accept-ride',(ride_id,token) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err,user) => {
            if(err) console.log(err);
            else{
                user = user._doc;
                Ride.findOne({_id: ride_id}, (err,ride) => {
                    if(err) socket.emit(`${user.username}-ridereq-response`, false);
                    else{
                        if(!ride.driver){
                            ride.driver = user.username;
                            ride.mobile = user.mobile;
                            ride.reg_no = user.reg_no;
                            ride.save();
                            io.emit(`${user.username}-ridereq-response`, true)
                            io.emit(`${ride_id}-accepted`, user);
                            
                        }else socket.emit(`${user.username}-ridereq-response`, false)
                    }
                })
            }
        });
    });

    socket.on("driver-coords-ride", (rideId, coords) => {
        // `${rideId}-driver-coords`, (crds) 
        socket.emit(`${rideId}-driver-coords`, coords);
    })


});

cron.schedule('*/1 * * * *', () => {
    // runs every minute 
    // adds schduled rides which are to be started in 5 minutes to rides collection

    const now = new Date();
    ScheduledRide.find({date: {$lte: new Date(now.getTime() + 5*60000)}}, (err,rides) => {
        if(err) console.log("Error in cron job", err);
        else{
            rides.forEach(ride => {
                const newRide = new Ride({
                    usernames: [ride.username],
                    pickup: [ride.pickup],
                    drop: [ride.drop],
                    otp: [ride.otp],
                    location: ride.location,
                    travelTime: [ride.travelTime],
                    dist: [ride.dist],
                    pickLoc: [ride.pickLoc],
                    dropLoc: [ride.dropLoc],
                    sharing: 1
                });
                newRide.save();
                ride.remove();
            });
        }
    });


});

app.post('/verify-otp', authenticate, (req,res) => {
    const {ride_id,user_name,otp} = req.body;
    const driver = req.user._doc;

    if(!driver) res.send({success: false});
    else{
        Ride.findOne({_id: ride_id}, (err,rideObj) => {
            if(err) res.send({success: false});
            else{
                const ind = rideObj.usernames.indexOf(user_name);
                if(ind == -1) res.send({success: false});
                else{
                    if(rideObj.otp[ind] == Number(otp)){
                        rideObj.pickup.splice(ind,1);
                        rideObj.pickLoc.splice(ind,1);
                        rideObj.save();
                        res.send({success: true, rideObj: rideObj});
                    }else res.send({success: false});
                }
            }
        })
    }
})

app.post("/continuousbooking", (req, res) => {
    const username = req.body.username;
    
    Rider.findOne({ username: username}, (err,user) => {
        if(err){
            res.send({success: false});
        }else{
            var strtDt  = new Date(req.body.fromDate);
            var endDt  = new Date(req.body.toDate);
            var flag = 0; // false
            let dates = []

            if (endDt >= strtDt){
               flag = 1; // true
            }
            // console.log(flag);
            if(flag === 1){
                const weekdaysStr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const weekdays = req.body.weekdays;
                let wkdys = []
                for(let i = 0; i < weekdays.length; i++){
                    wkdys.push(weekdaysStr[weekdays[i]]);
                }
                let a = strtDt;
                let b = endDt;
                while(b >= a){
                    if(wkdys.includes(weekdaysStr[a.getDay()])){
                        dates.push(a.toJSON().slice(0,10));
                    }
                    a.setDate(a.getDate() + 1);
                }
                strtDt = new Date(req.body.fromDate);
                let optDates = req.body.dates
                let n = req.body.dates.length
                for(let i = 0; i <= n; i++){
                    let newDate = new Date(optDates[i]);
                    if(strtDt < newDate && newDate < endDt && dates.includes(newDate) === false){
                        dates.push(newDate.toJSON().slice(0,10));
                    }
                }
            }
            const newBooking = ContBooking({
                username: username,
                fromdate: req.body.fromDate,
                todate: req.body.toDate,
                excludedates: dates,
                locs: req.body.locs
            });
            newBooking.save();
        }
    });
});

// function to verify the driver
app.post("/verify-ride-driver", authenticate ,(req,res) => {
    const driver = req.user._doc;
    const ride_id = req.body.ride_id;

    Ride.findOne({_id: ride_id}, (err,ride) => {
        if(err || !ride) res.send({verified: false});
        else if(ride.driver === driver.username) res.send({verified: true, rideObj: ride});
        else res.send({verified: false});
    })
});

app.post("/verify-ride-user", authenticate, (req,res) => {
    const user = req.user._doc;
    const ride_id = req.body.ride_id;

    Ride.findOne({_id: ride_id}, (err,ride) => {
        if(err || !ride) res.send({verified: false});
        else if(ride.usernames.indexOf(user.username) >= 0) res.send({verified: true, rideObj: ride});
        else res.send({verified: false});
    }) 
})

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


app.post("/schedule-ride", authenticate, (req,res) => {
    const {date,time,locs, location, travelTime, dist, pois} = req.body;

    const newRide = new ScheduledRide({
        date: date,
        time: time,
        pickup: locs[0],
        drop: locs[1],
        pickLoc: pois[0],
        dropLoc: pois[1],
        location: location,
        travelTime: travelTime,
        dist: dist
    });
    newRide.save();
    res.send({success: true, rideObj: newRide});
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

app.post("/verificationCode", authenticate, function(req, res){
    console.log(req.body)
    const code = req.user.code;
    if(code == req.body.enteredCode){
        const customerType = req.body.customerType;
        const name = req.user._doc.username;
        if(customerType==="Driver"){
            Driver.findOne({username: name},(err,driver) => {
                if(err) console.log(err)
                else{
                    driver.emailVerified = true;
                    driver.save();
                    res.send({success: true, user: jwt.sign({name: driver.name, username: driver.username, customerType: driver.customerType}, process.env.JWT_SECRET_KEY)});
                }
            })
        }else{
            Rider.findOne({username: name},(err,rider) => {
                if(err) console.log(err)
                else{
                    console.log(rider);
                    rider.emailVerified = true;
                    rider.save();
                    res.send({success: true, user: jwt.sign({name: rider.name, username: rider.username, customerType: rider.customerType}, process.env.JWT_SECRET_KEY)});
                }
            })
        }
    }
    else{
        res.send({success: false, msg: "Invalid code!!"})
    }
})


app.post('/register', async function(req, res){
    console.log(req.body);
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
                                bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                                    if(!err){
                                        const newDriver = new Driver({
                                            username: req.body.username,
                                            name: req.body.name,
                                            email: req.body.email,
                                            mobile: req.body.mobile,
                                            password: hash,
                                            customerType: "Driver",
                                            emailVerified: false
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
    console.log(req.body);
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
                                console.log(verified);
                                if(verified){
                                    var code = null
                                    if(driver.emailVerified===false){
                                        code = sendEmail(driver.email)
                                    }

                                    const jwtToken = jwt.sign({...driver,code: code}, process.env.JWT_SECRET_KEY);
                                    
                                    res.send({
                                        success:true,
                                        username: driver.username,
                                        name: driver.name,
                                        mobile: driver.mobile,
                                        email: driver.email,
                                        customerType: driver.customerType,
                                        emailVerified: driver.emailVerified,
                                        token: jwtToken
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
                        const jwtToken = jwt.sign({...driver,code: code}, process.env.JWT_SECRET_KEY);
                        
                        res.send({
                            success:true,
                            username: driver.username,
                            name: driver.name,
                            mobile: driver.mobile,
                            email: driver.email,
                            customerType: driver.customerType,
                            emailVerified: driver.emailVerified,
                            token: jwtToken
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
                                    const jwtToken = jwt.sign({...rider,code: code}, process.env.JWT_SECRET_KEY);
                                    
                                    res.send({
                                        success:true,
                                        username: rider.username,
                                        name: rider.name,
                                        mobile: rider.mobile,
                                        email: rider.email,
                                        customerType: rider.customerType,
                                        emailVerified: rider.emailVerified,
                                        token: jwtToken
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
                        const jwtToken = jwt.sign({...rider,code: code}, process.env.JWT_SECRET_KEY);
                        
                        res.send({
                            success:true,
                            username: rider.username,
                            name: rider.name,
                            mobile: rider.mobile,
                            email: rider.email,
                            customerType: rider.customerType,
                            emailVerified: rider.emailVerified,
                            token: jwtToken
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

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}

server.listen(port, () => {
    console.log("Server started on port 4000")
});