require("dotenv").config();
const {Router} = require("express");
const express = require("express");
const userRouter = Router();
const {z} = require("zod");
const bcrypt = require("bcrypt");
const {Credentials} = require("../db")
const jwt = require("jsonwebtoken");
userRouter.use(express.json());

userRouter.get("/test" , (req , res)=>{
    res.send("Hey there from the server");
})

userRouter.post("/signup" , async(req , res)=>{
const userinfo =await z.object({
        username:z.string().min(2),
        password:z.string().max(12),
        email:z.string()})
    
const parsedDataWithSuccess =await userinfo.safeParse(req.body)
const {username , email , password} = req.body;
const hashedpassword =await bcrypt.hash(password , 5);

await Credentials.create({
    username:username ,
    email:email,
    password:hashedpassword
})
res.send("user created successfully");
})

userRouter.post("/signin" ,async (req , res)=>{
   let userinfo =await z.object({
         email:z.string(),
         password:z.string()
   })
   const parsedDataWithSuccess = await userinfo.safeParse(req.body);
const user =await Credentials.findOne({email:email})
 if(user){
    let token =await jwt.sign({userid : user._id} , process.env.JWT_SECRET);

    if(token){
        res.json({token:token});
    }
 }
 else{
    res.send("user does not exist")
 }
})

module.exports={
    userRouter:userRouter
}