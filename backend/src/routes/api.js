const express = require('express');
const multer = require('multer');
const router = express.Router();

const authController = require('../controllers/authController');
const inventoryController = require('../controllers/inventoryController');
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);

// Inventory
router.get('/inventory/stats', authMiddleware, inventoryController.getStats);
router.get('/inventory', authMiddleware, inventoryController.getInventory);
router.get('/inventory/uploads', authMiddleware, inventoryController.getUploadHistory);
router.post('/inventory/upload/preview', authMiddleware, upload.single('file'), inventoryController.uploadPreview);
router.post('/inventory/upload/confirm', authMiddleware, inventoryController.uploadConfirm);
router.get('/inventory/template', inventoryController.downloadTemplate);

// WhatsApp
router.get('/whatsapp/webhook', whatsappController.verifyWebhook);
router.post('/whatsapp/webhook', express.json(), whatsappController.handleMessage);

module.exports = router;