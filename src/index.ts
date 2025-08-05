import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./modules/auth/authroutes";
import userRouter from "./modules/user/userroute";
import carRouter from "./modules/car/carroute";
import parkingRouter from "./modules/parking/parkingroute";
import reviewRouter from "./modules/review/reviewroutes";
import bookingRouter from "./modules/booking/bookingroute";
import advertisementRouter from "./modules/advertisement/advertisementroutes";
import carCatalogRouter from "./modules/car/carcatalogroutes";
import topupRouter from "./modules/booking/topuproutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/cars", carRouter);
app.use("/api/v1/parking", parkingRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/advertisements", advertisementRouter);
app.use("/api/v1/car-catalog", carCatalogRouter);
app.use("/api/v1/topups", topupRouter);

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
