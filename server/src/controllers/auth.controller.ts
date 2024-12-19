import { Request, Response } from "express";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, username, email, password } = req.body;
        let { avatar } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: "Invalid email format" });
            return;
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(400).json({ error: "Username is already taken" });
            return;
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            res.status(400).json({ error: "Email is already taken" });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            res.status(400).json({
                error:
                    "Password must be at least 8 characters long and include letters, numbers, capital character, and special characters.",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let avatarUrl = "/avatar-placeholder.png"; // Default avatar
        if (avatar) {
            const uploadedAvatar = await cloudinary.uploader.upload(avatar);
            avatarUrl = uploadedAvatar.secure_url;
        }

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
            avatar: avatarUrl,
        });

        await newUser.save();

        generateTokenAndSetCookie(newUser._id.toString(), res);

        res.status(201).json({ newUser });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        if (!username) {
            res.status(400).json({ error: "Username is required" });
            return;
        }

        if (!password) {
            res.status(400).json({ error: "Password is required" });
            return;
        }

        const user = await User.findOne({ username }).select("+password");

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            res.status(400).json({ error: "Invalid password" });
            return;
        }


        if (!user || !isPasswordCorrect) {
            res.status(400).json({ error: "Invalid username or password" });
            return;
        }

        generateTokenAndSetCookie(user._id.toString(), res);

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("jwt");
        res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
