const express=require('express');
const router=express.Router();
const File=require('../../models/File');
const Product=require('../../models/Product');
const authenticateToken=require('../../middleware/auth');

module.exports=router;