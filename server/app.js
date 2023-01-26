const exp = require("express");
const app = exp();
const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/hopOnDB');

const driverSchema = new mongoose.Schema({
    id: String,
    name: String,
    verified: Boolean,
    rides: [mongoose.ObjectId],
    rating: Number
});

const Driver = new mongoose.model("Driver", driverSchema);

app.get("/app", (req,res) => {
    res.send("Response from server!")
})

app.listen(4000, () => {
    console.log("Server started on port 4000")
})