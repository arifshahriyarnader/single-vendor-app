const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const authenticateToken = require("../../middleware/auth");
const { body, validationResult } = require("express-validator");
const Product = require("../../models/Product");

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

module.exports = router;
