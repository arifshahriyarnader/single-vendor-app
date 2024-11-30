const express=require('express');
const router=express.Router();
const File=require('../../models/File');
const Product=require('../../models/Product');
const authenticateToken=require('../../middleware/auth');
const multer=require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + "-" + file.originalname)
    }
  })
  
  const upload = multer({ storage: storage })

//Upload a file
router.post('/uploads', [authenticateToken, upload.single('file')], async(req,res) =>{
    try{
        if(req.user.userType != 'admin'){
            res.status(401).josn({message:"You are not an admin"})
        }
        else{
            const fileObj={
                name:req.file.filename,
                path:req.file.path
            }

            const file= new File(fileObj);
            await file.save();
            return res.json(file);
        }
    }
    catch(error){
        res.status(501).json({message:"Something went wrong"})
    }
})

module.exports=router;