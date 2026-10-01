const crpto = require("crypto");
const bcrpt = require("bcryptjs");

function generateOTP(){
     return crpto.randomInt(100000, 1000000).toString();
}

async function hashOTP(otp){
     return await bcrpt.hash(otp, 10);
}

async function verifyOTP(otp, otpHash){
     return await bcrpt.compare(otp, otpHash);
}

module.exports = {
     generateOTP,
     hashOTP,
     verifyOTP,
}
