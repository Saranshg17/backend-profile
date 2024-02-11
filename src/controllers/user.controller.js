import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { users } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
    //get user details from frontend
    const {email,password,profile, Default,categories}=req.body
    console.log(req.body)

    //validation - not empty
    if(!Default){
        Default=false
    }
    // if(categories===""){
    //     throw new ApiError(400, "Please select atleast one category")
    // }
    // if(categories===[]){
    //     throw new ApiError(400, "Please select atleast one category")
    // }
    if(
        [email,password,profile,categories].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Some required fields are empty")
    }


    // check if already exists: email, profile
    const existedprofile = await users.findOne({
        $and: [{ email },{ profile }]
    })
    if (existedprofile){
        throw new ApiError(409,"Profile already exists")
    }

    //check whether password is right or not if user already exists


    //if user didn't exist already change default to true
    const existeduser = await users.findOne({email})

    // if (!existeduser){
    //     Default=true
    // }

    //create user object-create entry in db
    const user = await users.create({
        email,
        password,
        profile,
        Default:Default || false,
        categories
    })

    //remove password and refresh token field from response
    const createdProfile = await users.findById(user._id).select(
        "-password -refreshToken"
    )

    console.log(createdProfile)

    //check for user creation
    if(!createdProfile){
        throw new ApiError(500,"Something went wrong while registering the user")
    }


    //return response or send error
    return res.status(201).json(
        new ApiResponse(200,createdProfile,"profile registered successfully")
    )
})

export {registerUser}