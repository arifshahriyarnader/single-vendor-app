const express = require("express");
const router = express.Router();
const File = require("../../models/File");
const Product = require("../../models/Product");
const authenticateToken = require("../../middleware/auth");
const multer = require("multer");
const { body, validationResult } = require("express-validator");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

//Upload a file
router.post(
  "/uploads",
  [authenticateToken, upload.single("file")],
  async (req, res) => {
    try {
      if (req.user.userType != "admin") {
        res.status(401).josn({ message: "You are not an admin" });
      } else {
        const fileObj = {
          name: req.file.filename,
          path: req.file.path,
        };

        const file = new File(fileObj);
        await file.save();
        return res.json(file);
      }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

//Product Create
router.post(
  "/",
  [
    authenticateToken,
    body("name", "name is  required").notEmpty(),
    body("description", "description is required").notEmpty(),
    body("madeIn", "madeIn is required").notEmpty(),
    body("category", "category is required").notEmpty(),
    body("fileId", "fileId is required").notEmpty(),
    body("price", "price is required").notEmpty(),
    body("pQty", "pQty is required").notEmpty(),
  ],
  async (req, res) => {
    try {
      if (req.user.userType != "admin") {
        return res.status(401).json({ message: "You are not an admin" });
      } else {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        } else {
          const userId = req.user._id;
          const productObj = {
            name: req.body.name,
            description: req.body.description,
            madeIn: req.body.madeIn,
            price: parseInt(req.body.price),
            userId: userId,
            category: req.body.category,
            fileId: req.body.fileId,
            pQty: parseInt(req.body.pQty),
            isDeleted: false,
          };
          const product = new Product(productObj);
          await product.save();

          if (product?.fileId) {
            const createProduct = await Product.findById(product._id)
              .populate(["userId", "fileId"])
              .exec();
            return res.status(201).json(createProduct);
          } else {
            return res.status(201).json(product);
          }
        }
      }
    } catch (error) {
      res.status(500).json({ message: "something went wrong" });
    }
  }
);

//get all products
router.get("/", authenticateToken, async (req, res) => {
  try {
    let current = req?.query?.current ?? "1";
    current = parseInt(current);
    let pageSize = req?.query?.pageSize ?? "1";
    pageSize = parseInt(pageSize);
    const sort = req?.query?.sort ?? "asc";
    const pipeline = [];

    pipeline.push({
      $match: {
        isDeleted: false,
      },
    });

    switch (sort) {
      case "asc":
        pipeline.push({
          $sort: {
            createdAt: 1,
          },
        });
        break;

      case "desc":
        pipeline.push({
          $sort: {
            createdAt: -1,
          },
        });
        break;
    }

    pipeline.push({
      $skip: (current - 1) * pageSize,
    });

    pipeline.push({
      $limit: pageSize * 1,
    });

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    });

    pipeline.push({
      $lookup: {
        from: "files",
        localField: "fileId",
        foreignField: "_id",
        as: "file",
      },
    });

    const products = await Product.aggregate(pipeline);
    return res.json(products);
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
});

//get specific product
router.get('/:id', authenticateToken, async(req,res) =>{
  try{
    const id=req.params.id;
    const product=await Product.findById(id).populate(['userId', 'fileId']).exec();
    if(product){
      return res.json(product)
    }
    else{
      return res.status(404).json({message:"Product not found"})
    }
  }
  catch(error){
    res.status(500).json({ message: "something went wrong" });
  }
})

module.exports = router;
