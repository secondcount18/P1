const axios = require('axios');

exports.sendMessage = async (to, text) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const url = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v17.0'}/${phoneId}/messages`;
        
        // Return mock success if credentials are not configured
        if (!token || !phoneId || token === 'mock_token') {
            console.log(`[WhatsApp MOCK] To: ${to} | Message: ${text}`);
            return { data: { success: true, mock: true } };
        }

        const res = await axios.post(url, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: text }
        }, {
            headers: { Authorization: `Bearer ${token}` }
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
        ? `⚠️ No exact matches found. Showing relaxed matches within ~10% of budget:\n\n🔎 ${properties.length} matching properties found\n\n`
        : `🔎 ${properties.length} matching properties found\n\n`;
    
    properties.forEach((p, idx) => {
        let priceStr = p.price >= 10000000 ? `₹${(p.price/10000000).toFixed(2)} Cr` : `₹${(p.price/100000).toFixed(2)} L`;
        text += `${idx + 1}. ${p.projectName || 'Property'}\n`;
        if(p.bhk) text += `${p.bhk} BHK • ${p.carpetArea || 'N/A'} sqft\n`;
        text += `${priceStr} • ${p.possession || 'N/A'}\n`;
        if(p.location && p.location.locality) text += `📍 ${p.location.locality}\n`;
        if(p.contact) {
            text += `👤 ${p.contact.name || 'N/A'}\n`;
            text += `📞 ${p.contact.phone || 'N/A'}\n`;
        }
        text += `\n`;
    });
    
    text += "Reply 1, 2, 3, etc. for complete property details.";
    return text;
};

exports.formatSingleProperty = (p) => {
    let priceStr = p.price >= 10000000 ? `₹${(p.price/10000000).toFixed(2)} Cr` : `₹${(p.price/100000).toFixed(2)} L`;
    return `Property Details
    
Project: ${p.projectName || 'N/A'}
Property ID: ${p.propertyId}
Type: ${p.propertyType || 'N/A'}
BHK: ${p.bhk || 'N/A'}
Carpet Area: ${p.carpetArea ? p.carpetArea + ' sqft' : 'N/A'}
Price: ${priceStr}
Possession: ${p.possession || 'N/A'}
Furnishing: ${p.furnishing || 'N/A'}
Parking: ${p.parking || 'N/A'}
Location: ${p.location?.locality || ''}, ${p.location?.city || ''}
Status: ${p.status || 'N/A'}

Contact:
${p.contact?.name || 'N/A'}
${p.contact?.phone || 'N/A'}
`;
};