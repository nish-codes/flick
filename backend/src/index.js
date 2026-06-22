import "dotenv/config"
import { connectDb } from "./db/index.js";
import { app } from "./app.js";


connectDb().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`the app is listening on ${process.env.PORT}`)
    })
})