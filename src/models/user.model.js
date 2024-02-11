import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

// const CategorySchema = new Schema({
//     category:{
//         type:String,
//         unique:true
//     }
// })

// export const category=mongoose.model("category",CategorySchema)

const userSchema = new Schema({
    email:{
        type:String,
        required: true,
        index:true,
        trim:true
    },
    password:{
        type:String,
        required: [true,"password is required"],
        index:true
    },
    profile:{
        type:String,
        required: true,
        index:true
    },
    Default:{
        type:Boolean,
    },
    categories:{
        type: String,
        required: true
    },
    refreshToken:{
        type:String
    }
},
{
    timestamps:true
}
)

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            profile:this.profile
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
        
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
        
    )
}

export const users = mongoose.model("users",userSchema)