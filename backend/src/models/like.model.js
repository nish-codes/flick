import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    comment : {
        type : Schema.Types.ObjectId,
        ref :"Comment"
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    likedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

likeSchema.index({ video: 1, likedBy: 1 }, { unique: true })

export const Like = mongoose.model("Like",likeSchema)
