const mongoose=require('mongoose');


const ProductSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    madeIn:{
        type:String
    },
    category:{
        type:String
    },
    price:{
        type:Number
    },
    pQty:{
        type:Number
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    fileId:{
        type:mongoose.Types.ObjectId,
        ref:'File'
    }
},{
    timestamps:true
})

module.exports=mongoose.model('Product', ProductSchema);