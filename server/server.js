const express=require('express');
const app=express();
const bodyParser=require('body-parser');

//parse requests
app.use(bodyParser.json());

const port=5000;
app.listen(port, () =>{
    console.log(`Server is running on ${port}`);
})