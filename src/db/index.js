import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectToDatabase = async() =>{
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)
       console.log(connectionInstance.connection.host);
       console.log("Connected to database successfully");
       
       
    } catch (error) {
        console.log("Error while connecting to database");
        process.exit(1)
    }
}
export default connectToDatabase