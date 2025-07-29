import dotenv from "dotenv"
import connectToDatabase from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:"./.env",
});

connectToDatabase()
.then(() =>{
    app.listen(process.env.PORT || 8000, () => {
    console.log(`App Listening at port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
})