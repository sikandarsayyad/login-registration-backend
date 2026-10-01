const express = require("express");
const cors = require("cors");
const env = require("./src/config/env");
const errorHandler = require("./src/middleware/errorHandler");
const notFound = require("./src/middleware/notFound");
const pool = require("./src/config/database");
const createTables = require("./src/config/table");
const userRoute = require("./src/routes/user");
const otpRoute = require("./src/routes/otp");
const session = require("express-session");

const app = express();
app.use(cors({
  origin:"http://localhost:5173", 
  credentials:true,
}));

app.use(express.json());
app.use(
  session({
    secret:"secureid-scret",
    resave:false,
    saveUninitialized:false,
    cookie:{
      httpOnly:true,
      sameSite:"lax",

    },
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "Backend server is running",
  });
});

app.use("/api",userRoute);
app.use("/api",otpRoute);
app.use(notFound);
app.use(errorHandler);

async function checkDatabase(){
  try{
    await pool.query("SELECT 1");
    console.log("MySQL connected successfully");

    await createTables();
    console.log("Database tables are ready");

  }catch(error){
    console.log("Database error:", error.message);
  }
}

checkDatabase();

const PORT = env.port;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
