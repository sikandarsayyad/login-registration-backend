const express = require("express");
const {sendEmailOTP, verifyEmailOTP, sendSMSOTP, verifySMSOTP, resendLoginOTP, verifyLoginOTP} = require("../controllers/otpController");

const router = express.Router();

router.post("/send-email-otp", sendEmailOTP);
router.post("/send-sms-otp", sendSMSOTP);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/verify-sms-otp", verifySMSOTP);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/resend-login-otp", resendLoginOTP);

module.exports = router;