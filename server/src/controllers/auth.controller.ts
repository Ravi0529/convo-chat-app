import { Request, Response } from "express";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";

interface CustomRequest extends Request {
    user?: {
        _id: string;
    };  
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, username, email, password, avatar } = req.body;

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

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            res.status(400).json({
                error:
                    "Password must be at least 8 characters long and include letters, numbers, capital characters, and special characters.",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let avatarUrl = "/avatar-placeholder.png";
        if (avatar) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(avatar, {
                    folder: "avatars", // Specify folder in Cloudinary
                    resource_type: "image",
                });
                avatarUrl = uploadResponse.secure_url;
            } catch (error) {
                console.error("Cloudinary upload error:", error);
                res.status(500).json({ error: "Avatar upload failed" });
                return;
            }
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
        // console.error(error);
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

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie("jwt");
        res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const home = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({ error: "Unauthorized: No Token Provided" });
            return;
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
