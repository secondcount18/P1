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
            const helpMsg = "Available commands:\n\n• Forward a client requirement to search inventory\n• STATUS — inventory status\n• HELP — show help\n\nExample:\n\"Need 2bhk Andheri West under 1.5cr\"";
            await whatsappService.sendMessage(from, helpMsg);
            return;
        }
        
        if (lowerText === 'status' || lowerText === 'inventory') {
            const total = await Property.countDocuments({ brokerId: broker._id });
            const available = await Property.countDocuments({ brokerId: broker._id, status: { $regex: /^available$/i } });
            
            const statMsg = `📊 Your Inventory\n\nTotal: ${total}\nAvailable: ${available}\nUnavailable: ${total - available}\n\nSearch anytime by sending requirements!`;
            await whatsappService.sendMessage(from, statMsg);
            return;
        }

        // Check if it's a numeric selection
        if (/^\d+$/.test(lowerText)) {
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