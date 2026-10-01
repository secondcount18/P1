const Property = require('../models/Property');
const InventoryUpload = require('../models/InventoryUpload');
const excelService = require('../services/excelService');
const path = require('path');
const fs = require('fs');

exports.getStats = async (req, res) => {
    try {
        const total = await Property.countDocuments({ brokerId: req.user.id });
        const available = await Property.countDocuments({ brokerId: req.user.id, status: { $regex: /^available$/i } });
        const lastUpload = await InventoryUpload.findOne({ brokerId: req.user.id, status: 'Success' }).sort({ uploadedAt: -1 });
        
        res.json({
            total,
            available,
            unavailable: total - available,
            lastUpdate: lastUpload ? lastUpload.uploadedAt : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getInventory = async (req, res) => {
    try {
        const properties = await Property.find({ brokerId: req.user.id }).sort({ updatedAt: -1 });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUploadHistory = async (req, res) => {
    try {
        const history = await InventoryUpload.find({ brokerId: req.user.id }).sort({ uploadedAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Global object to store previews temporarily (MVP approach instead of Redis)
const previewStore = {};

exports.uploadPreview = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const filePath = req.file.path;
        const result = excelService.parseAndValidate(filePath);
        
        const previewId = Date.now().toString();
        previewStore[previewId] = {
            brokerId: req.user.id,
            fileName: req.file.originalname,
            filePath: filePath,
            data: result
        };
        
        // Clean up store after 10 mins (MVP logic)
        setTimeout(() => {
            if (previewStore[previewId]) {
                fs.unlink(previewStore[previewId].filePath, () => {});
                delete previewStore[previewId];
            }
        }, 10 * 60 * 1000);

        res.json({ previewId, result });
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: err.message });
    }
};

exports.uploadConfirm = async (req, res) => {
    try {
        const { previewId } = req.body;
        const preview = previewStore[previewId];
        
        if (!preview || preview.brokerId !== req.user.id) {
            return res.status(400).json({ error: 'Invalid or expired preview session' });
        }
        
        const { validRows } = preview.data;
        let added = 0, updated = 0;
        let incomingIds = [];

        // Upsert properties
        for (const row of validRows) {
            incomingIds.push(row.propertyId);
            const existing = await Property.findOne({ brokerId: req.user.id, propertyId: row.propertyId });
            
            if (existing) {
                await Property.updateOne({ _id: existing._id }, { $set: row });
                updated++;
            } else {
                row.brokerId = req.user.id;
                await Property.create(row);
                added++;
            }
        }

        // Full Sync: Mark absent properties as unavailable
        const markUnavailableResult = await Property.updateMany(
            { brokerId: req.user.id, propertyId: { $nin: incomingIds } },
            { $set: { status: 'Unavailable' } }
        );

        // Record upload
        await InventoryUpload.create({
            brokerId: req.user.id,
            fileName: preview.fileName,
            totalRows: preview.data.total,
            added,
            updated,
            markedUnavailable: markUnavailableResult.modifiedCount || 0,
            errors: preview.data.errors.length,
            status: 'Success'
        });

        // Cleanup
        fs.unlink(preview.filePath, () => {});
        delete previewStore[previewId];

        res.json({ success: true, added, updated, markedUnavailable: markUnavailableResult.modifiedCount || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.downloadTemplate = (req, res) => {
    const filePath = path.join(__dirname, '../utils/template.xlsx');
    res.download(filePath, 'inventory_template.xlsx');
};