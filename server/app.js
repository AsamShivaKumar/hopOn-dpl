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
    password: String,
    verified: {type: Boolean, default: false},
    docs: {type: Array, default: [2,2,2,2,2,2]},
    docImages: {type: [Buffer], default: [null,null,null,null,null,null]},
    rides: {type: Number, default: 0},
    rating: {type: Number,default: 0}
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