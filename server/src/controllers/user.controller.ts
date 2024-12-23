import { Request, Response } from "express";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

interface CustomRequest extends Request {
    user?: {
        _id: string;
    };
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    const { fullName, bio } = req.body;
    let { avatar } = req.body;

    const userId = req.user?._id;
    try {
        let user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (avatar) {
            if (user.avatar) {
                await cloudinary.uploader.destroy(user.avatar.split("/").pop()?.split(".")[0] as string);
            }
            const uploadedResponse = await cloudinary.uploader.upload(avatar)
            user.avatar = uploadedResponse.secure_url;
        }

        user.fullName = fullName || user.fullName;
        user.bio = bio || user.bio;

        user = await user.save();

        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}
