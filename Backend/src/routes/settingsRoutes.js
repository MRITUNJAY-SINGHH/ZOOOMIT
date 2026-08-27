import express from 'express';
import Settings from '../models/Settings.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/', protect, authorize('settings', 'edit'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    
    Object.assign(settings, req.body);
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
