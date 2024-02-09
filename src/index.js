// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';
import { app } from './app.js';
import connectDB from "./db/index.js";

dotenv.config({
    path:"./.env"
});

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error encounted connecting to server:",error)
        process.exit(1);
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed:",err);
})