import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchHandler.js";

const heatlthCheck = asyncHandler(async(req,res)=>{
    res.status(200).json(new ApiResponse(200,"","the server is healthy"))
})

export {heatlthCheck}