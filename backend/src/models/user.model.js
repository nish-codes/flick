import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
const userSchema = new Schema({
     userName : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        index : true
     },
     fullName : {
        type : String,
        required : true,
        trim : true,
        index : true
     },
     email : {
        type : String,
        required : true,
        lowercase : true,
        unique : true,
        trim : true
     },
     avatar : {
        type : String,   //link for image in cloudinary
        required : true
     },
     coverImage : {
        type :String,
    
     },
     password : {
        type : String,
        required : [true,"Password is required"]
     },
     refreshToken : {
        type : String,

     },
     watchHistory : [{
        type : Schema.Types.ObjectId,
        ref : "Video"
     }]

},{timestamps : true})
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password,10)
    }
    next()
})
userSchema.methods.isPasswordCorrect =async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.getAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        fullName : this.fullName,
        userName : this.userName,
        email : this.email

    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.getRefreshToken = function(){
   
    return jwt.sign({
        _id : this._id,
       

    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}
export const User = mongoose.model("User",userSchema)