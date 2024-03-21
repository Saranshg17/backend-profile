import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { users } from "../models/user.model.js";
import { profiles } from "../models/profile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async(userId) => {
    try{
        const user= await users.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    //get user details from frontend
    const {email,password,profile,categories}=req.body
    console.log(req.body)

    //validation - not empty
    if(
        [email,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Email and password can't be empty")
    }


    // check if already exists: email, profile
    const existeduser = await users.findOne({
        $and: [{ email }]
    })
    if (existeduser){
        throw new ApiError(409,"email already registered")
    }

    const Profile = await profiles.create({
        ProfileName: profile || "Profile-1",
        Categories: categories.split("-") || []
    })

    //create user object-create entry in db
    const user = await users.create({
        email: email,
        password: password,
        profile: [Profile._id],
        Default: Profile._id,
        // categories: categories || ""
    })

    //remove password and refresh token field from response
    const registeredUser = await users.findById(user._id).select(
        "-password -refreshToken"
    )

    console.log(registeredUser)

    //check for user creation
    if(!registeredUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }


    //return response
    return res.status(201).json(
        new ApiResponse(200,registeredUser,"profile registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res) => {
    //get details from frontend
    const {email,password} = req.body
    console.log(req.body)

    //validation - not empty
    if(
        [email,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Email and password can't be empty")
    }

    //access user object form db
    const user = await users.findOne({ email })

    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    //validation -correct credentials
    const validation =await user.isPasswordCorrect(password)

    if(!validation){
        throw new ApiError(401,"Email or Password is incorrect")
    }


    //generate access token and refresh token and updating database
    const {accessToken, refreshToken} =await generateAccessandRefreshToken(user._id)

    //remove password and refreshToken from response
    const userUpdated = await users.findById(user._id).select(
        "-password -refreshToken"
    )

    //send cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    //return response
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:userUpdated,accessToken,refreshToken
            },
            "User logged in Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    await users.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    //send cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {},"User logged out"))
})

const newprofile = asyncHandler(async (req,res) => {
    const {email,password,profile,Default,categories} = req.body

    console.log(req.body)

    if(
        [email,password,profile,categories].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Some required fields are empty")
    }

    const user = await users.findOne({ email })

    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    //validation -correct credentials
    const validation =await user.isPasswordCorrect(password)

    if(!validation){
        throw new ApiError(401,"Email or Password is incorrect")
    }

    const Profile = await profiles.create({
        ProfileName: profile || "Profile-1",
        Categories: categories.split("-") || []
    })

    const profile_ = user.profile
    profile_.push(Profile._id)

    if(!Default){
        await users.findByIdAndUpdate(user._id,
            {
                $set: {
                    profile: profile_
                }
            },
            {
                new: true
            }
        )
    }

    if(Default){
        await users.findByIdAndUpdate(user._id,
            {
                $set: {
                    profile: profile_,
                    Default: Profile._id
                }
            },
            {
                new: true
            }
        )
    }

    return res.status(201).json(
        new ApiResponse(200,Profile,"profile created successfully")
    )

})

const defaultprofile = asyncHandler(async (req,res)=>{
    const {email,password,id}= req.body

    if(
        [email,password, id].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Some required fields are empty")
    }

    const user = await users.findOne({ email })

    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    //validation -correct credentials
    const validation =await user.isPasswordCorrect(password)

    if(!validation){
        throw new ApiError(401,"Email or Password is incorrect")
    }

    try {
        await users.findByIdAndUpdate(user._id,
            {
                $set: {
                    Default: id
                }
            },
            {
                new: true
            }
        )
    } catch (error) {
        throw new ApiError(401,"Profile doesn't exist")
    }

    return res.status(201).json(
        new ApiResponse(200,user,"Default profile changed successfully")
    )

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingrefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }

    try {
        const decodedToken= jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await users.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        console.log(user.refreshToken)

        if(incomingrefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const options ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessandRefreshToken(user._id)
    
        console.log(accessToken,newrefreshToken)

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
            200,
            {accessToken, refreshToken: 
                newrefreshToken},
            "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const updateProfile = asyncHandler(async (req,res)=>{
    const {email,password,id, categories} = req.body
    
    if(
        [email,password, id, categories].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Some required fields are empty")
    }

    const user = await users.findOne({ email })

    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    //validation -correct credentials
    const validation =await user.isPasswordCorrect(password)

    if(!validation){
        throw new ApiError(401,"Email or Password is incorrect")
    }

    try {
        const profile_ = await profiles.findByIdAndUpdate(id,
            {
                $set: {
                    Categories: categories.split("-") || []
                }
            },
            {
                new: true
            }
        )

        return res.status(201).json(
            new ApiResponse(200,profile_,"Profile updated successfully")
        )
        
    } catch (error) {
        throw new ApiError(401,"Profile doesn't exist")
    }

})

const deleteProfile = asyncHandler(async (req,res)=>{
    const {email,password,id}=req.body

    if(
        [email,password, id].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Some required fields are empty")
    }

    const user = await users.findOne({ email })

    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    //validation -correct credentials
    const validation =await user.isPasswordCorrect(password)

    if(!validation){
        throw new ApiError(401,"Email or Password is incorrect")
    }

    const id_=user._id

    if(id===user.Default){
        throw new ApiError(400,"You can't delete default profile. Change default profile first")
    }

    const profiles_=user.profile.filter(item => item!=id);

    try {
        const user_ = await users.findByIdAndUpdate(id_,
            {
                $set: {
                    profile: profiles_
                }
            },
            {
                new: true
            }
        )
        
        profiles.deleteOne({_id:id})
        .then(()=>{
            return res.status(201).json(
                new ApiResponse(200,user_,"Profile deleted successfully")
            )
        })
        .catch((err)=>{
            throw new ApiError(400,"Profile doesn't exist")
        })


        

    } catch (error) {
        throw new ApiError(401,error)
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    defaultprofile,
    newprofile,
    refreshAccessToken,
    updateProfile,
    deleteProfile
}