const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { sendSuccess, sendError } = require("../utils/response");
const validator = require("validator");
const { generateOTP, hashOTP, verifyOTP } = require("../services/otpService");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, "Name, email, password are required", 400);
    }

    if (!validator.isEmail(email)) {
      return sendError(res, "Please enter a valid email address", 400);
    }
    if (password.length < 8) {
      return sendError(res, "Password must be at least 8 characters", 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash],
    );

    const userId = await result.insertId;
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const [otpResult] = await pool.query(
      `INSERT INTO otp_challenges (user_id, channel, otp_hash, expires_at) VALUES (?,?,?,?)`,
      [userId, "email", otpHash, expiresAt],
    );

    console.log("Email OPT:", otp);

    return sendSuccess(
      res,
      "Registration successful. Email OPT generated successfully.",
      {
        userId,
        challengeId: otpResult.insertId,
      },
    );
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, "Email is already registered", 409);
    }
    return sendError(res, "Registration failed", 500);
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }
    const [users] = await pool.query(`SELECT * FROM users WHERE email = ? `, [
      email,
    ]);

    if (users.length === 0) {
      return sendError(res, "Invalid email", 401);
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return sendError(res, "Invalid password", 401);
    }

    if (user.mfa_enabled) {
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const [result] = await pool.query(
        `INSERT INTO otp_challenges (user_id, channel, otp_hash, expires_at) VALUES (?,?,?,?)`,
        [user.id, "sms", otpHash, expiresAt],
      );

      console.log("Login OPT:", otp);

      return sendSuccess(res, "password verified. Login OTP required", {
        challengeId: result.insertId,
        mfaRequired: true,
      });
    }
    req.session.userId = user.id;

    return sendSuccess(res, "Login successful", {
      userId: user.id,
      mfaRequired: false,
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, "Login Failed", 500);
  }
}

async function getMe(req, res) {

  if (!req.session.userId) {
    return sendError(res, "Not logged in", 401);
  }

  return sendSuccess(res, "User is logged in", { userId: req.session.userId });
}


async function logoutUser(req, res) {

  req.session.destroy((error) => {
    if (error) {
      return sendError(res, "Logout Failed", 500);
    }

    res.clearCookie("connect.sid");

    return sendSuccess(res, "Logout Successfully", 200);
  });
}

async function createToken(req, res) {
  try {
    if (!req.session.userId) {
      return sendError(res, "Not logged in", 401);
    }
    const token = jwt.sign(
      {
        userId: req.session.userId,
      },
      "secureid-jwt-secret",
      { expiresIn: "15m" },
    );
    return sendSuccess(res, "Token created successfully", { token });
  } catch (error) {
    console.error("Token error:", error);
    return sendError(res, "Failed to create token.", 500);
  }
}

async function protectedRoute(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendError(res, "Token is required", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "secureid-jwt-secret");

    return sendSuccess(res, "Protected data accessed", {
      userId: decoded.userId,
    });
  } catch (error) {
    console.log("Protected route error:", error);
    return sendError(res, "Invalid or expired token", 401);
  }
}

async function forgotPassword(req, res){
  try {

    const {email} = req.body;

    if(!email){
      return sendError(
        res, "Email is required", 400
      )
    }

    const [users] = await pool.query(
      "SELECT id, email FROM users WHERE email = ? ", [email]
    );

    if(users.length === 0){
      return sendError(
        res,
        "Email not registeres",
        404
      )
    }


    return sendSuccess(
      res,
      "Forgot password request received",
    )

  } catch (error) {
    console.log("Forgot password failed:", error);
    return sendError(res, "Server error", 500);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  createToken,
  protectedRoute,
  forgotPassword
};
