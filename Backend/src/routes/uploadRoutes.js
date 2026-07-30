import express from 'express';
import upload, { cloudinaryInstance } from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/product-image', protect, authorize('staff', 'create'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    // multer-storage-cloudinary automatically attaches the secure_url to req.file.path
    res.json({ url: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/product-image', protect, authorize('staff', 'create'), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'No URL provided' });

    // Extract public_id
    const parts = url.split('/upload/');
    if (parts.length < 2) return res.status(400).json({ message: 'Invalid Cloudinary URL' });
    
    const path = parts[1];
    const pathWithoutVersion = path.replace(/^v\d+\//, '');
    const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));

    await cloudinaryInstance.uploader.destroy(publicId);
    res.json({ message: 'Image deleted from Cloudinary' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
