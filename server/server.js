require('dotenv').config();
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const connectDB=require('./config/db');

//parse requests
app.use(bodyParser.json());

//db
connectDB()

//routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/orders', require('./routes/api/orders'))
app.use('/api/products', require('./routes/api/products'))

//To chek if our application is runnng
app.get('/', (req,res) =>{
    res.json({messsage:'Welcome to our app'})
})

const port=5000;
app.listen(port, () =>{
    console.log(`Server is running on ${port}`);
})