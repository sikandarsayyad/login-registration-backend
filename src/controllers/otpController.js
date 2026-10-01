const pool = require("../config/database");
const {generateOTP, hashOTP, verifyOTP} = require("../services/otpService");
const {sendSuccess, sendError} = require("../utils/response");

async function sendEmailOTP(req, res){
     try {
          const {userId } = req.body;

          if(!userId){
               return sendError(resizeBy, "User ID is required", 400);
          }

          const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);

          if(users.length === 0){
               return sendError(res, "User not found", 404);
          }

          const otp = generateOTP();

          const otpHash = await hashOTP(otp);

          const expiresAt = new Date(Date.now() + 5*60*1000);

          const [result] = await pool.query(`INSERT INTO otp_challenges (user_id, channel, otp_hash, expires_at) VALUES (?,?,?,?)`, [userId, "email", otpHash, expiresAt])

          console.log("Email OPT:", otp);

          return sendSuccess(res,
               "Email OPT generated successfully",
               {
                    challengeId: result.insertId,
               }
          )

     } catch (error) {
          console.error(error);

          return sendError(
               res, "Failed to generate email OTP", 500
          );
          
     }
}

async function verifyEmailOTP(req, res){
     try {
     // console.log("Content-Type:", req.headers["Content-type"]);
	// console.log("Requesr Body:", req.body);

          const {challengeId, otp} = req.body;

          if (!challengeId || !otp) {
			return sendError(res, "Challenge ID and OPT are required", 400);
		}

          const [rows] = await pool.query(
               `SELECT * FROM otp_challenges WHERE id = ? AND channel = 'email' AND verified = FALSE ORDER BY id  DESC LIMIT 1`, [challengeId]
          );

          if (rows.length === 0){
               return sendError(res, "OTP not found", 400);
          }

          const challenge = rows[0];

          if(new Date() > new Date(challenge.expires_at)){
                return sendError(res, "OTP expired", 400);
          }

          if(challenge.attempts >= 5 ){
               return sendError(res, "Too many attempts", 429); 
          }

          const valid = await verifyOTP(otp, challenge.otp_hash);

          if(!valid){
               await pool.query("UPDATE otp_challenges SET attempts = attempts+1 WHERE id = ?", [challenge.id]);
               return sendError(res, "Invalid OTP", 400); 
          }

          await pool.query(
               "UPDATE otp_challenges SET verified = TRUE WHERE id = ?", [challenge.id]
          )

          return sendSuccess(res, "Email verified successfully");

     } catch (error) {
          console.error("verify EMAIL OTP error:", error);
          return sendError(res, "Failed to verify email OTP", 500);

     }
}


async function sendSMSOTP(req, res){
     try {
          const {userId} = req.body;

          if(!userId){
               return sendError(resizeBy, "User ID is required", 400);
          }

          const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);

          if(users.length === 0){
               return sendError(res, "User not found", 404);
          }

          const [emailVerified] = await pool.query(
               `SELECT id FROM otp_challenges WHERE user_id = ? AND channel = 'email' AND verified = TRUE ORDER BY id DESC LIMIT 1`, [userId]
          )

          if(emailVerified.length === 0){
               return sendError(
                    res,
                    "Please verify your email first", 400
               )
          }

          const otp = generateOTP();

          const otpHash = await hashOTP(otp);

          const expiresAt = new Date(Date.now() + 5*60*1000);

          const [result] = await pool.query(`INSERT INTO otp_challenges (user_id, channel, otp_hash, expires_at) VALUES (?,?,?,?)`, [userId, "sms", otpHash, expiresAt])

          console.log("SMS OPT:", otp);

          return sendSuccess(res,
               "SMS OPT generated successfully",
               {
                    challengeId: result.insertId,
               }
          )

     } catch (error) {
          console.error(error);

          return sendError(
               res, "Failed to generate SMS OTP", 500
          );
          
     }
}

async function verifySMSOTP(req, res){
     try {
          const {challengeId, otp} = req.body;

          if (!challengeId || !otp) {
			return sendError(res, "User ID and OPT are required", 400);
		}

          const [rows] = await pool.query(
               `SELECT * FROM otp_challenges WHERE id = ? AND channel = 'sms' AND verified = FALSE ORDER BY id  DESC LIMIT 1`, [challengeId]
          );

          if (rows.length === 0){
               return sendError(res, "OTP not found", 400);
          }

          const challenge = rows[0];

          if(new Date() > new Date(challenge.expires_at)){
                return sendError(res, "OTP expired", 400);
          }

          if(challenge.attempts >= 5 ){
               return sendError(res, "Too many attempts", 429); 
          }

          const valid = await verifyOTP(otp, challenge.otp_hash);

          if(!valid){
               await pool.query("UPDATE otp_challenges SET attempts = attempts+1 WHERE id = ?", [challenge.id]);
               return sendError(res, "Invalid OTP", 400); 
          }

          await pool.query(
               "UPDATE otp_challenges SET verified = TRUE WHERE id = ?", [challenge.id]
          );

          await pool.query(
               "UPDATE users SET mfa_enabled = TRUE WHERE id = ?", [challenge.user_id]
          );

          return sendSuccess(res, "SMS verified successfully");

     } catch (error) {
          console.error("verify SMS OTP error:", error);
          return sendError(res, "Failed to verify SMS OTP", 500);

     }
}


async function verifyLoginOTP(req, res){
     try {
          const {challengeId, otp} = req.body;

          if (!challengeId || !otp) {
			return sendError(res, "Challenge ID and OPT are required", 400);
		}

          const [rows] = await pool.query(
               `SELECT * FROM otp_challenges WHERE id = ? AND channel = 'sms' AND verified = FALSE ORDER BY id  DESC LIMIT 1`, [challengeId]
          );

          if (rows.length === 0){
               return sendError(res, "OTP not found", 400);
          }

          const challenge = rows[0];

          if(new Date() > new Date(challenge.expires_at)){
                return sendError(res, "OTP expired", 400);
          }

          if(challenge.attempts >= 5 ){
               return sendError(res, "Too many attempts", 429); 
          }

          const valid = await verifyOTP(otp, challenge.otp_hash);

          if(!valid){
               await pool.query("UPDATE otp_challenges SET attempts = attempts+1 WHERE id = ?", [challenge.id]);
               return sendError(res, "Invalid OTP", 400); 
          }

          await pool.query(
               "UPDATE otp_challenges SET verified = TRUE WHERE id = ?", [challenge.id]
          )

          req.session.userId = challenge.user_id;

          // console.log("Login session:", req.session);

          return sendSuccess(
               res,
               "Login successfully",
          );

     } catch (error) {
          console.error("verify Login OTP error:", error);
          return sendError(res, "Failed to verify Login OTP", 500);

     }
}

async function resendLoginOTP(req, res) {
     try {
          const {challengeId} = req.body;

          if(!challengeId){
               return sendError(
                    res, 
                    "Challenge Id is required",
                    400
               )
          }

          const [challenges] = await pool.query(
               `SELECT user_id FROM otp_challenges WHERE id = ? AND channel = 'sms' AND verified = FALSE`, [challengeId]
          );

          if(challenges.length === 0){
               return sendError(
                    res,
                    "Login challenge not found",
                    404
               )
          }

          const userId = challenges[0].user_id;

          const otp = generateOTP();
          const otpHash = await hashOTP(otp);
          const expiresAt = new Date(
               Date.now() + 5 * 60* 1000
          );

          const [result] = await pool.query(
               `INSERT INTO otp_challenges (user_id, channel, otp_hash, expires_at) VALUES (?,?,?,?)`, [userId, "sms", otpHash, expiresAt]
          )

          console.log("New Login OTP: ", otp);

          return sendSuccess(
               res,
               "New Login OTP Generated successfully",{
                    challengeId: result.insertId,
               }
          )
         
          
     } catch (error) {
          console.error("Resend Login OTP error:", error);
          return sendError(res, "Failed to resend Login OTP", 500);
     }
     
}

module.exports = {
     sendEmailOTP,
     verifyEmailOTP,
     sendSMSOTP,
     verifySMSOTP,
     verifyLoginOTP,
     resendLoginOTP
}