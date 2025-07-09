const mongoose = require ("mongoose")
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;


const UsersCredentials = new Schema({
username:{type:String , unique:true},
password:{type:String , unique:true} ,
email:{type:String , unique:true}
})

const Credentials = mongoose.model("credentials" , UsersCredentials);

module.exports = {
    Credentials
}
