import mongoose,{Schema} from "mongoose";

const ProfileSchema = new Schema({
    ProfileName:{
        type: String,
        required: true,
        index:true
    },
    Categories:{
        type: String,
        required: true
    }
},
{
    timestamps: true
})

export const profiles = mongoose.model("profiles",ProfileSchema)
