const fs = require('fs');
const path = require('path');

const files = {
  'src/config/db.js': `
const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate-mvp');
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
module.exports = connectDB;
  `,
  'src/models/Broker.js': `
const mongoose = require('mongoose');
const brokerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  whatsappNumber: { type: String, required: true, unique: true },
  role: { type: String, enum: ["broker", "admin"], default: "broker" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Broker', brokerSchema);
  `,
  'src/models/Property.js': `
const mongoose = require('mongoose');
const propertySchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  propertyId: { type: String, required: true },
  projectName: String,
  propertyType: String,
  bhk: Number,
  location: {
    area: String,
    city: String,
    locality: String
  },
  carpetArea: Number,
  price: Number,
  possession: String,
  furnishing: String,
  parking: String,
  status: String,
  contact: {
    name: String,
    phone: String
  },
  source: { type: String, default: "excel" },
}, { timestamps: true });
propertySchema.index({ brokerId: 1, propertyId: 1 }, { unique: true });
module.exports = mongoose.model('Property', propertySchema);
  `,
  'src/models/InventoryUpload.js': `
const mongoose = require('mongoose');
const uploadSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  fileName: String,
  totalRows: Number,
  added: Number,
  updated: Number,
  markedUnavailable: Number,
  errors: Number,
  status: String,
  uploadedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('InventoryUpload', uploadSchema);
  `,
  'src/models/WhatsappMessage.js': `
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  whatsappMessageId: String,
  from: String,
  message: String,
  messageType: String,
  direction: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('WhatsappMessage', messageSchema);
  `,
  'src/models/Requirement.js': `
const mongoose = require('mongoose');
const requirementSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  originalMessage: String,
  parsedRequirement: mongoose.Schema.Types.Mixed,
  matchedProperties: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Requirement', requirementSchema);
  `,
  'src/models/SearchContext.js': `
const mongoose = require('mongoose');
const searchContextSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  from: String,
  results: [
    {
      index: Number,
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }
    }
  ],
  createdAt: { type: Date, default: Date.now, expires: 3600 } // 1 hour expiry
});
module.exports = mongoose.model('SearchContext', searchContextSchema);
  `,
  'src/middleware/auth.js': `
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};
  `,
  'src/controllers/authController.js': `
const Broker = require('../models/Broker');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const normalizeWhatsapp = (num) => {
    let clean = num.replace(/\\D/g, '');
    if (clean.length === 10) clean = '91' + clean;
    return clean;
};

exports.register = async (req, res) => {
    try {
        const { name, company, email, password, whatsappNumber } = req.body;
        const normalizedNumber = normalizeWhatsapp(whatsappNumber);
        
        const existing = await Broker.findOne({ $or: [{ email }, { whatsappNumber: normalizedNumber }] });
        if (existing) return res.status(400).json({ error: 'Email or WhatsApp already registered' });
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const broker = new Broker({ name, company, email, passwordHash, whatsappNumber: normalizedNumber });
        await broker.save();
        
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const broker = await Broker.findOne({ email });
        if (!broker) return res.status(400).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, broker.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: broker._id, role: broker.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { id: broker._id, name: broker.name, company: broker.company, email: broker.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const broker = await Broker.findById(req.user.id).select('-passwordHash');
        if (!broker) return res.status(404).json({ error: 'Broker not found' });
        res.json(broker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
  `,
  'src/services/excelService.js': `
const xlsx = require('xlsx');

const parsePrice = (priceStr) => {
    if (!priceStr) return null;
    const clean = String(priceStr).replace(/,/g, '').trim().toLowerCase();
    let num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    if (clean.includes('cr') || clean.includes('crore')) return num * 10000000;
    if (clean.includes('l') || clean.includes('lakh')) return num * 100000;
    if (clean.includes('k')) return num * 1000;
    return num; // assuming already exact if no suffix
};

exports.parseAndValidate = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    let validRows = [];
    let errors = [];
    let duplicates = new Set();

    data.forEach((row, index) => {
        const rowNum = index + 2;
        let rowErrors = [];

        const propId = row['Property ID'] || row['Property Id'] || row['PropertyID'];
        if (!propId) rowErrors.push('Property ID missing');
        else if (duplicates.has(propId)) rowErrors.push('Duplicate Property ID in file');
        else duplicates.add(propId);

        const price = parsePrice(row['Price']);
        if (row['Price'] && price === null) rowErrors.push('Price format invalid');
        
        const bhk = parseFloat(row['BHK']);
        
        if (rowErrors.length > 0) {
            errors.push({ row: rowNum, issues: rowErrors });
        } else {
            validRows.push({
                propertyId: String(propId).trim(),
                projectName: row['Project Name'],
                propertyType: row['Property Type'],
                bhk: isNaN(bhk) ? null : bhk,
                location: {
                    city: row['City'],
                    locality: row['Locality'],
                    area: row['Area']
                },
                carpetArea: parseFloat(row['Carpet Area']) || null,
                price: price,
                possession: row['Possession'],
                furnishing: row['Furnishing'],
                parking: String(row['Parking'] || ''),
                status: row['Status'] || 'Available',
                contact: {
                    name: row['Contact Name'],
                    phone: String(row['Contact Number'] || '')
                }
            });
        }
    });

    return { total: data.length, validRows, errors };
};
  `,
  'src/services/requirementParser.js': `
exports.parseRequirement = (message) => {
    const lowerMessage = message.toLowerCase();
    let req = {};
    
    // BHK
    const bhkMatch = lowerMessage.match(/(\\d(?:\\.\\d)?)\\s*(?:bhk|bed)/);
    if (bhkMatch) req.bhk = parseFloat(bhkMatch[1]);
    
    // Budget
    // e.g. "under 1.5 cr", "below 2cr", "around 1.5 crore", "budget 80l", "upto 2 cr"
    const budgetMatch = lowerMessage.match(/(?:under|below|around|budget|upto|max|less than)\\s*(?:rs|inr|₹)?\\s*([\\d\\.]+)\\s*(cr|crore|l|lakh)/);
    if (budgetMatch) {
        let val = parseFloat(budgetMatch[1]);
        if (budgetMatch[2].startsWith('c')) req.maxPrice = val * 10000000;
        else if (budgetMatch[2].startsWith('l')) req.maxPrice = val * 100000;
    } else {
        // Just look for numbers followed by cr/lakh if no prefix
        const rawBudgetMatch = lowerMessage.match(/([\\d\\.]+)\\s*(cr|crore|l|lakh)/);
        if (rawBudgetMatch) {
            let val = parseFloat(rawBudgetMatch[1]);
            if (rawBudgetMatch[2].startsWith('c')) req.maxPrice = val * 10000000;
            else if (rawBudgetMatch[2].startsWith('l')) req.maxPrice = val * 100000;
        }
    }

    // Area
    const areaMatch = lowerMessage.match(/([\\d]+)\\s*(?:\\+|plus)?\\s*(?:sqft|sq ft|sq.ft|sq. ft)/);
    if (areaMatch) req.minCarpetArea = parseInt(areaMatch[1], 10);

    // Possession
    if (lowerMessage.includes('ready')) req.possession = 'Ready';
    
    // Property Type
    if (lowerMessage.includes('commercial')) req.propertyType = 'Commercial';
    else if (lowerMessage.includes('residential')) req.propertyType = 'Residential';
    
    // Location (very basic logic for MVP: just try to extract known words if possible, or omit)
    // Actually, typical messages "in Andheri West"
    const inMatch = lowerMessage.match(/in\\s+([a-z\\s]+?)(?:under|for|budget|\\d|$)/);
    if (inMatch) {
        let loc = inMatch[1].trim();
        // remove trailing words like "around", "near"
        loc = loc.replace(/(?:around|near|below|ready).*$/, '').trim();
        if (loc.length > 2) req.location = new RegExp(loc, 'i');
    }

    // If 'in xyz' didn't work, we could check against a known list, but for MVP regex is fine.
    // We will augment location matching in the DB query to search locality.

    return req;
};
  `,
  'src/services/matchingService.js': `
const Property = require('../models/Property');

exports.matchProperties = async (brokerId, reqData) => {
    let query = { brokerId, status: { $regex: /^available$/i } };
    
    if (reqData.bhk) query.bhk = reqData.bhk;
    if (reqData.maxPrice) query.price = { $lte: reqData.maxPrice };
    if (reqData.minCarpetArea) query.carpetArea = { $gte: reqData.minCarpetArea };
    if (reqData.possession) query.possession = { $regex: new RegExp(reqData.possession, 'i') };
    if (reqData.propertyType) query.propertyType = { $regex: new RegExp(reqData.propertyType, 'i') };
    
    if (reqData.location) {
        query.$or = [
            { 'location.locality': reqData.location },
            { 'location.city': reqData.location },
            { 'location.area': reqData.location }
        ];
    }
    
    // Exact match
    let results = await Property.find(query).limit(5);
    
    // If no results, relaxed matching (e.g., relax price by 10%, drop possession constraint)
    if (results.length === 0 && Object.keys(query).length > 2) {
        let relaxedQuery = { brokerId, status: { $regex: /^available$/i } };
        if (reqData.bhk) relaxedQuery.bhk = reqData.bhk;
        if (reqData.maxPrice) relaxedQuery.price = { $lte: reqData.maxPrice * 1.10 }; // +10%
        if (reqData.location) relaxedQuery.$or = query.$or;
        results = await Property.find(relaxedQuery).limit(5);
        if (results.length > 0) {
            results.isRelaxed = true;
        }
    }
    
    return results;
};
  `,
  'src/services/whatsappService.js': `
const axios = require('axios');

exports.sendMessage = async (to, text) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const url = \`https://graph.facebook.com/\${process.env.WHATSAPP_API_VERSION || 'v17.0'}/\${phoneId}/messages\`;
        
        // Return mock success if credentials are not configured
        if (!token || !phoneId || token === 'mock_token') {
            console.log(\`[WhatsApp MOCK] To: \${to} | Message: \${text}\`);
            return { data: { success: true, mock: true } };
        }

        const res = await axios.post(url, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: text }
        }, {
            headers: { Authorization: \`Bearer \${token}\` }
        });
        return res.data;
    } catch (err) {
        console.error('WhatsApp API Error:', err.response ? err.response.data : err.message);
        throw err;
    }
};

exports.formatResults = (properties, isRelaxed) => {
    if (properties.length === 0) {
        return "❌ No properties found matching your requirements.";
    }
    
    let text = isRelaxed 
        ? \`⚠️ No exact matches found. Showing relaxed matches within ~10% of budget:\\n\\n🔎 \${properties.length} matching properties found\\n\\n\`
        : \`🔎 \${properties.length} matching properties found\\n\\n\`;
    
    properties.forEach((p, idx) => {
        let priceStr = p.price >= 10000000 ? \`₹\${(p.price/10000000).toFixed(2)} Cr\` : \`₹\${(p.price/100000).toFixed(2)} L\`;
        text += \`\${idx + 1}. \${p.projectName || 'Property'}\\n\`;
        if(p.bhk) text += \`\${p.bhk} BHK • \${p.carpetArea || 'N/A'} sqft\\n\`;
        text += \`\${priceStr} • \${p.possession || 'N/A'}\\n\`;
        if(p.location && p.location.locality) text += \`📍 \${p.location.locality}\\n\`;
        if(p.contact) {
            text += \`👤 \${p.contact.name || 'N/A'}\\n\`;
            text += \`📞 \${p.contact.phone || 'N/A'}\\n\`;
        }
        text += \`\\n\`;
    });
    
    text += "Reply 1, 2, 3, etc. for complete property details.";
    return text;
};

exports.formatSingleProperty = (p) => {
    let priceStr = p.price >= 10000000 ? \`₹\${(p.price/10000000).toFixed(2)} Cr\` : \`₹\${(p.price/100000).toFixed(2)} L\`;
    return \`Property Details
    
Project: \${p.projectName || 'N/A'}
Property ID: \${p.propertyId}
Type: \${p.propertyType || 'N/A'}
BHK: \${p.bhk || 'N/A'}
Carpet Area: \${p.carpetArea ? p.carpetArea + ' sqft' : 'N/A'}
Price: \${priceStr}
Possession: \${p.possession || 'N/A'}
Furnishing: \${p.furnishing || 'N/A'}
Parking: \${p.parking || 'N/A'}
Location: \${p.location?.locality || ''}, \${p.location?.city || ''}
Status: \${p.status || 'N/A'}

Contact:
\${p.contact?.name || 'N/A'}
\${p.contact?.phone || 'N/A'}
\`;
};
  `,
  'src/controllers/whatsappController.js': `
const Broker = require('../models/Broker');
const Requirement = require('../models/Requirement');
const WhatsappMessage = require('../models/WhatsappMessage');
const SearchContext = require('../models/SearchContext');
const Property = require('../models/Property');
const requirementParser = require('../services/requirementParser');
const matchingService = require('../services/matchingService');
const whatsappService = require('../services/whatsappService');

exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
    return res.sendStatus(400);
};

exports.handleMessage = async (req, res) => {
    res.sendStatus(200); // Acknowledge immediately
    try {
        const body = req.body;
        if (!body.object || !body.entry || !body.entry[0].changes) return;
        
        const change = body.entry[0].changes[0].value;
        if (!change.messages || !change.messages[0]) return;
        
        const msg = change.messages[0];
        const from = msg.from;
        const text = msg.text?.body;
        
        if (!text) return; // Only process text for now
        
        const broker = await Broker.findOne({ whatsappNumber: from });
        if (!broker) {
            await whatsappService.sendMessage(from, "Sorry, this WhatsApp number is not registered with our broker platform. Please register first.");
            return;
        }

        await WhatsappMessage.create({
            brokerId: broker._id,
            whatsappMessageId: msg.id,
            from,
            message: text,
            messageType: 'text',
            direction: 'inbound'
        });

        const lowerText = text.toLowerCase().trim();
        
        if (lowerText === 'help') {
            const helpMsg = "Available commands:\\n\\n• Forward a client requirement to search inventory\\n• STATUS — inventory status\\n• HELP — show help\\n\\nExample:\\n\\"Need 2bhk Andheri West under 1.5cr\\"";
            await whatsappService.sendMessage(from, helpMsg);
            return;
        }
        
        if (lowerText === 'status' || lowerText === 'inventory') {
            const total = await Property.countDocuments({ brokerId: broker._id });
            const available = await Property.countDocuments({ brokerId: broker._id, status: { $regex: /^available$/i } });
            
            const statMsg = \`📊 Your Inventory\\n\\nTotal: \${total}\\nAvailable: \${available}\\nUnavailable: \${total - available}\\n\\nSearch anytime by sending requirements!\`;
            await whatsappService.sendMessage(from, statMsg);
            return;
        }

        // Check if it's a numeric selection
        if (/^\\d+$/.test(lowerText)) {
            const selection = parseInt(lowerText, 10);
            const context = await SearchContext.findOne({ brokerId: broker._id, from }).sort({ createdAt: -1 });
            if (context) {
                const result = context.results.find(r => r.index === selection);
                if (result) {
                    const prop = await Property.findById(result.propertyId);
                    if (prop) {
                        const detailMsg = whatsappService.formatSingleProperty(prop);
                        await whatsappService.sendMessage(from, detailMsg);
                        return;
                    }
                }
            }
            // If no context or invalid selection, fall through or return error
            await whatsappService.sendMessage(from, "Invalid selection or search session expired. Please search again.");
            return;
        }

        // Otherwise parse requirement
        const parsed = requirementParser.parseRequirement(text);
        const properties = await matchingService.matchProperties(broker._id, parsed);
        
        await Requirement.create({
            brokerId: broker._id,
            originalMessage: text,
            parsedRequirement: parsed,
            matchedProperties: properties
        });

        if (properties.length > 0) {
            // Save search context
            const resultsData = properties.map((p, i) => ({ index: i + 1, propertyId: p._id }));
            await SearchContext.create({
                brokerId: broker._id,
                from,
                results: resultsData
            });
        }
        
        const responseText = whatsappService.formatResults(properties, properties.isRelaxed);
        await whatsappService.sendMessage(from, responseText);

    } catch (err) {
        console.error('Webhook processing error:', err);
    }
};
  `,
  'src/controllers/inventoryController.js': `
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
  `,
  'src/routes/api.js': `
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
  `,
  'server.js': `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const routes = require('./src/routes/api');
const fs = require('fs');

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection
connectDB();

// Ensure uploads dir exists
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// Routes
app.use('/api', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
  `,
  'src/utils/templateMaker.js': `
const xlsx = require('xlsx');
const fs = require('fs');

const makeTemplate = () => {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet([
        {
            "Property ID": "P001",
            "Project Name": "Lodha Belmondo",
            "Property Type": "Residential",
            "BHK": 2,
            "City": "Mumbai",
            "Locality": "Andheri West",
            "Area": "Andheri West",
            "Carpet Area": 745,
            "Price": 14200000,
            "Possession": "Ready",
            "Furnishing": "Unfurnished",
            "Parking": 1,
            "Status": "Available",
            "Contact Name": "Rahul Sharma",
            "Contact Number": "9876543210"
        }
    ]);
    xlsx.utils.book_append_sheet(wb, ws, "Inventory");
    if (!fs.existsSync('./src/utils')) fs.mkdirSync('./src/utils', { recursive: true });
    xlsx.writeFile(wb, './src/utils/template.xlsx');
};
makeTemplate();
  `
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}
console.log("Backend scaffolding complete.");
