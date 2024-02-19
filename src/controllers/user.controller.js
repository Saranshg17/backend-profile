import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { users } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const {email,password,profile, Default,categories}=req.body
    console.log(req.body)

    //validation - not empty
    if(
        [email,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "Email and password can't be empty")
    }


    // check if already exists: email, profile
    const existedprofile = await users.findOne({
        $and: [{ email }]
    })
    if (existedprofile){
        throw new ApiError(409,"email already registered")
    }

    //create user object-create entry in db
    const user = await users.create({
        email,
        password,
        profile: profile || "Profile1",
        Default:Default || true,
        categories: categories || ""
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


    //return response
    return res.status(201).json(
        new ApiResponse(200,createdProfile,"profile registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res) => {
    //get details from frontend
    const {email,password,profile} = req.body
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

    if(!user){
        throw new ApiError(401,"Email or Password is incorrect")
    }


    //generate access token and refresh token and updating database
    const {accessToken, refreshToken} =await generateAccessandRefreshToken(user._id)

    //remove password and refreshToken from response
    const userUpdated = await user.findById(user._id).select(
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
    await User.findByIdAndUpdate(req.user._id,
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

    if(!user){
        throw new ApiError(401,"Email or Password is incorrect")
    }

    

})

export {registerUser}
export {loginUser}
export {logoutUser}
export {newprofile}