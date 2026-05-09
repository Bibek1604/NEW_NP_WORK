import fs from "fs";
import {
    ApiResponse,
    ApiError,
    asyncHandler,
    cloudinary,
} from "../../utils/index.js";
import { User } from "../../models/index.js";

export const updateCv = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const cvPath = req.file?.path;

    if (!cvPath) {
        throw new ApiError(400, true, "CV file is required");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, true, "User not found");
    }

    if (user.role !== "freelancer") {
        fs.unlinkSync(cvPath);
        throw new ApiError(403, true, "Only freelancers can upload a CV");
    }

    try {
        const response = await cloudinary.uploader.upload(cvPath, {
            resource_type: "auto", // handles pdf/doc
            folder: "nepwork/cvs"
        });

        user.cv = response.url;
        await user.save();

        fs.unlinkSync(cvPath);

        return res.status(200).json(
            new ApiResponse(200, true, true, "CV updated successfully", {
                cvUrl: user.cv
            })
        );
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        if (fs.existsSync(cvPath)) fs.unlinkSync(cvPath);
        throw new ApiError(500, true, "Failed to upload CV to Cloudinary");
    }
});
