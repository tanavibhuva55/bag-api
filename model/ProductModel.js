const mongoose = require('mongoose');

const ProductModel = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    images:{              
        type:[String],      
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    rating:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    color:{                
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        enum:["In Stock","Out of Stock"],
        default:"In Stock"
    }
})
module.exports = mongoose.model("product",ProductModel);