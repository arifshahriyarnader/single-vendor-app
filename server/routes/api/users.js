const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../../middleware/auth");

//register
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);
    const userObj = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      password: password,
      userType: req?.body?.userType || "customer",
    };
    const user = new User(userObj);
    await user.save();
    return res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//user login
router.post("/login", async (req, res) => {
  try {
    const { type, email, password, refreshToken } = req.body;
    if (type === "email") {
      const user = await User.findOne({ email: email });
      if (!user) {
        res.status(500).json({ message: "User not found" });
      }
      await handleEmailLogin({ password, user, res });
    } else if (type === "refresh") {
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is not found" });
      } else {
        await handleRefreshToken({ refreshToken, res });
      }
    } else {
      return res.status(400).json({ message: "Invalid login type" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//user profile
router.get("/user-profile", authenticateToken, async (req, res) => {
  try {
    const id = req.user._id;
    const user = await User.findById(id);
    if (user) {
      return res.json(user);
    } else {
      return res.status(500).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//get all user
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});
//update user
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const userBody = req.body;
    const updateUser = await User.findByIdAndUpdate(id, userBody, {
      new: true,
    });
    if (updateUser) {
      return res.status(200).json(updateUser);
    } else {
      return res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});
//delete user
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deleteUser = await User.findByIdAndDelete(id);
    if (deleteUser) {
      res.json({ message: "User is deleted" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;

async function handleEmailLogin({ password, user, res }) {
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (isValidPassword) {
    const userObj = await generateUserObject(user);
    return res.json(userObj);
  } else {
    res.status(401).json({ message: "Unable to login" });
  }
}
function generateUserObject(user) {
  const { accessToken, refreshToken } = generateToken(user);
  const userObj = user.toJSON();
  userObj["accessToken"] = accessToken;
  userObj["refreshToken"] = refreshToken;
  return userObj;
}

function generateToken(user) {
  const accessToken = jwt.sign(
    {
      email: user.email,
      _id: user._id,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
  const refreshToken = jwt.sign(
    {
      email: user.email,
      _id: user._id,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );

  return { accessToken, refreshToken };
}

function handleRefreshToken({ refreshToken, res }) {
  jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(404).json({ message: "Unauthorized" });
    } else {
      const user = await User.findById(payload._id);
      if (user) {
        const userObj = generateUserObject(user);
        return res.status(200).json(userObj);
      } else {
        res.status(404).json({ message: "Unauthorized" });
      }
    }
  });
}
