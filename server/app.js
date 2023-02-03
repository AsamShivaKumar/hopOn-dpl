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
    verified: { type: Boolean, default: false},
    docs: {type: Array, default: [2,2,2,2,2,2]},
    rides: Number,
    rating: Number
});

const dest = "./images";
const Driver = new mongoose.model("Driver", driverSchema);

const storageEngine = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,dest)
    },
    filename: (req,file,cb) => {
        console.log(req.body);
        console.log(file.originalname);
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, fileName);
    }
});

const upload = multer({storage: storageEngine});

app.post("/upload_file", upload.single('image'),(req,res) => {
    res.send("Upload successful!");
})

app.listen(4000, () => {
    console.log("Server started on port 4000")
})