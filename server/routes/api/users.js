const express=require('express');
const router=express.Router();
const User=require('../../models/User');
const bcrypt=require('bcrypt');

//register
router.post('/register', async(req,res) =>{
    try{
        const salt= await bcrypt.genSalt(10);
        const password=await bcrypt.hash(req.body.password, salt);
        const userObj={
            fname:req.body.fname,
            lname:req.body.lname,
            email:req.body.email,
            password:password,
            userType:req?.body?.userType || 'customer'
        }
        const user= new User(userObj);
        await user.save()
        return res.status(201).json(user);
    }
    catch(error){
        res.status(500).json({message:'Something went wrong'})
    }
})
//get all user
router.get('/', async(req,res) =>{
   try{
        const users= await User.find();
        res.status(200).json(users);
   }
   catch(error){
    res.status(500).json({message:"Something went wrong"})
   }
})
//update user
router.put('/:id', async(req,res) =>{
    try{
        const id=req.params.id;
        const userBody=req.body;
        const updateUser=await User.findByIdAndUpdate(id, userBody,{
            new:true,
        })
        if(updateUser){
            return res.status(200).json(updateUser)
        }
        else{
            return res.status(404).json({message:"user not found"})
        }
    }
    catch(error){
        res.status(500).json({message:"Something went wrong"})
    }
})
//delete user
router.delete('/:id', async(req,res) =>{
    try{
        const id=req.params.id;
        const deleteUser= await User.findByIdAndDelete(id);
        if(deleteUser){
            res.json({message:"User is deleted"})
        }
        else{
            res.status(404).json({message:"User not found"})
        }
    }
    catch(error){
        res.status(500).json({message:"Something went wrong"})
    }
})

module.exports=router;