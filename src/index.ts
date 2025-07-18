import cors from "cors";
import express from "express";
import authRouter from "./modules/auth/authroutes";
import userRouter from "./modules/user/userroute";
import carRouter from "./modules/car/carroute"
import parkingRouter from "./modules/parking/parkingroute";
import reviewRouter from "./modules/review/reviewroutes";

const app = express();
const port = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello World");
});

// Auth routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use('/api/v1/cars', carRouter)
app.use('/api/v1/parking', parkingRouter)
app.use('/api/v1/review', reviewRouter)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});