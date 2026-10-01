const express = require("express");
const {registerUser, loginUser, getMe, logoutUser, createToken, protectedRoute, forgotPassword} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", getMe);
router.post("/logout", logoutUser);
router.post("/token", createToken);
router.get("/protected", protectedRoute);
router.post("/forgot-password", forgotPassword);

module.exports = router;