const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const authenticateToken = require("../../middleware/auth");
const { body, validationResult } = require("express-validator");
const Product = require("../../models/Product");
const { default: mongoose } = require("mongoose");

//create an order
router.post(
  "/",
  [
    authenticateToken,
    body("deliveryLocation", "deliveryLocation is required").notEmpty(),
    body("qty", "qty requirements not met").notEmpty().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      } else {
        const userId = req.user._id;
        const productId = req.body.productId;
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: "product not found" });
        } else {
          const now = new Date();
          const orderObj = {
            productId: productId,
            userId: userId,
            qty: parseInt(req.body.qty) || 1,
            purchaseDate: now,
            expectedDeliveryDate: now.setDate(now.getDate() + 5),
            deliveryLocation: req.body.deliveryLocation,
            deliveryStatus: "in-progress",
          };
          orderObj.total = orderObj.qty * product.price;

          const order = new Order(orderObj);
          await order.save();
          await order.populate(["productId", "userId"]);
          return res.status(201).json(order);
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

//get all orders by user
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
        userId: new mongoose.Types.ObjectId(req.user._id),
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
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    });

    const orders = await Order.aggregate(pipeline);
    return res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//get my order
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate(["productId", "userId"])
      .exec();
    if (order) {
      return res.json(order);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//get specific order details by admin
router.get("/admin/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.userType != "admin") {
      res.status(401).json({ message: "You are not an admin" });
    } else {
      const order = await Order.findById(req.params.id)
        .populate(["productId", "userId"])
        .exec();
      if (order) {
        return res.json(order);
      } else {
        return res.status(404).json({ message: "Order not found" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//cancel my order
router.put("/cancel/:id", authenticateToken, async (req, res) => {
  try {
    const updateOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { deliveryStatus: "canceled" },
      { new: true }
    )
      .populate(["productId", "userId"])
      .exec();
    if (updateOrder) {
      return res.json(updateOrder);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
