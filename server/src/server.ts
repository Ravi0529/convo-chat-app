import express from 'express';
import dotenv from 'dotenv';
import authRoutes from "./routes/auth.route.js";
import connectMongoDB from './db/db.js';
import cookieParser from 'cookie-parser';

dotenv.config({
    path: './.env'
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    connectMongoDB();
    console.log(`Server is running on port ${PORT}...`);
});
