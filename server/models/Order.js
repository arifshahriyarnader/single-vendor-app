const mongoose=require('mongoose');


const OrderSchema=new mongoose.Schema({
    deliveryLocation:{
        type:String
    },
    expectedDeliveryDate:{
        type:Date
    },
    purchaseDate:{
        type:Date
    },
    
    qty:{
        type:Number
    },
    total:{
        type:Number
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    productId:{
        type:mongoose.Types.ObjectId,
        ref:'Product'
    },
    deliveryStatus:{
        type:String,
        enum:['delivered', 'in-progress', 'canceled'],
        default:'in-progress'
    },
},{
    timestamps:true
})

module.exports=mongoose.model('Order', OrderSchema);