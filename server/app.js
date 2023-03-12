const exp = require("express");
const app = exp();
const mongoose = require("mongoose");
const multer = require("multer");

mongoose.connect('mongodb://localhost:27017/hopOnDB');

app.use(exp.json());
app.use(exp.urlencoded({extended: true}));

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

const dest = "./images";
const Driver = new mongoose.model("Driver", driverSchema);

// file name: `username-docname.jpg`
const storageEngine = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,dest)
    },
    filename: (req,file,cb) => {
        const {username,doc} = req.body;
        const fileName = username.toLowerCase().split(' ').join('-') + "-" + doc.toLowerCase().split(' ').join('-');
        cb(null, fileName + ".jpg");
    }
});

const upload = multer({storage: storageEngine});

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

app.listen(4000, () => {
    console.log("Server started on port 4000")
});