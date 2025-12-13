const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Compress uploaded image files
 * Reduces file size while maintaining acceptable quality
 * Supports JPEG, PNG, WebP, and converts to optimized format
 */
const compressImage = async (filePath, options = {}) => {
    const {
        quality = 80, // Quality 0-100 (80 is good balance)
        maxWidth = 1920, // Max width in pixels
        maxHeight = 1080, // Max height in pixels
    } = options;

    try {
        const ext = path.extname(filePath).toLowerCase();
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, ext);

        // Create compressed filename
        const compressedPath = path.join(dir, `${basename}_compressed${ext}`);

        // Get image metadata
        const metadata = await sharp(filePath).metadata();

        // Calculate new dimensions while maintaining aspect ratio
        let width = metadata.width;
        let height = metadata.height;

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Compress based on format
        let sharpInstance = sharp(filePath).resize(width, height, {
            fit: "inside",
            withoutEnlargement: true,
        });

        if (ext === ".jpg" || ext === ".jpeg") {
            sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
        } else if (ext === ".png") {
            sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
        } else if (ext === ".webp") {
            sharpInstance = sharpInstance.webp({ quality });
        } else if (ext === ".gif") {
            // GIF handling - convert to WebP for better compression
            sharpInstance = sharpInstance.webp({ quality });
        } else {
            // Default to JPEG for other formats
            sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
        }

        // Save compressed image
        await sharpInstance.toFile(compressedPath);

        // Get file sizes for logging
        const originalSize = fs.statSync(filePath).size;
        const compressedSize = fs.statSync(compressedPath).size;

        // Replace original with compressed
        fs.unlinkSync(filePath);
        fs.renameSync(compressedPath, filePath);

        const savedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        console.log(
            `[ImageCompression] Compressed: ${path.basename(filePath)} | ` +
            `${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB | ` +
            `Saved ${savedPercent}%`
        );

        return {
            success: true,
            originalSize,
            compressedSize,
            savedPercent: parseFloat(savedPercent),
        };
    } catch (error) {
        console.error(`[ImageCompression] Error compressing ${filePath}:`, error.message);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Middleware to compress uploaded images after multer processing
 */
const compressUploadedImages = async (req, res, next) => {
    try {
        let files = [];

        // Collect files from different possible locations
        if (req.files && Array.isArray(req.files)) {
            files = req.files;
        } else if (req.files && typeof req.files === "object") {
            // Handle field-based uploads
            Object.values(req.files).forEach((fileArray) => {
                if (Array.isArray(fileArray)) {
                    files = files.concat(fileArray);
                }
            });
        } else if (req.file) {
            files = [req.file];
        }

        if (files.length === 0) {
            return next();
        }

        console.log(`[ImageCompression] Processing ${files.length} image(s)...`);

        // Compress all images
        const compressionPromises = files.map((file) => {
            const filePath = file.path;
            return compressImage(filePath);
        });

        const results = await Promise.all(compressionPromises);

        // Log summary
        const successful = results.filter((r) => r.success);
        if (successful.length > 0) {
            const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
            const totalCompressed = successful.reduce((sum, r) => sum + r.compressedSize, 0);
            const totalSavedPercent = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);

            console.log(
                `[ImageCompression] Summary: ${successful.length}/${files.length} compressed | ` +
                `Total saved: ${totalSavedPercent}%`
            );
        }

        next();
    } catch (error) {
        console.error("[ImageCompression] Middleware error:", error);
        // Continue even if compression fails - original files are still usable
        next();
    }
};

module.exports = {
    compressImage,
    compressUploadedImages,
};
