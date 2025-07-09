require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const {userRouter} = require("./routes/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {z} = require("zod");
app.use(express.json());



app.use("/users" , userRouter)


 async function  main(){
 await mongoose.connect(process.env.clusterLink)  
   

    app.listen(process.env.PORT , (err , data)=>{
        if(err){
            console.log("Difficulty in connecting with port")
        }
        else{
            console.log("server started")
        }
    })
 }
 main();
