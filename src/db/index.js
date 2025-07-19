import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectToDatabase = async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
    // console.log(connection.connection.host);
    console.log("Connected to database successfully");
  } catch (error) {
    console.error("Error while connecting to database");
    process.exit(1);
  }
};
export default connectToDatabase;
