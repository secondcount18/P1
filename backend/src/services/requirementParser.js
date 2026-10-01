exports.parseRequirement = (message) => {
    const lowerMessage = message.toLowerCase();
    let req = {};
    
    // BHK
    const bhkMatch = lowerMessage.match(/(\d(?:\.\d)?)\s*(?:bhk|bed)/);
    if (bhkMatch) req.bhk = parseFloat(bhkMatch[1]);
    
    // Budget
    // e.g. "under 1.5 cr", "below 2cr", "around 1.5 crore", "budget 80l", "upto 2 cr"
    const budgetMatch = lowerMessage.match(/(?:under|below|around|budget|upto|max|less than)\s*(?:rs|inr|₹)?\s*([\d\.]+)\s*(cr|crore|l|lakh)/);
    if (budgetMatch) {
        let val = parseFloat(budgetMatch[1]);
        if (budgetMatch[2].startsWith('c')) req.maxPrice = val * 10000000;
        else if (budgetMatch[2].startsWith('l')) req.maxPrice = val * 100000;
    } else {
        // Just look for numbers followed by cr/lakh if no prefix
        const rawBudgetMatch = lowerMessage.match(/([\d\.]+)\s*(cr|crore|l|lakh)/);
        if (rawBudgetMatch) {
            let val = parseFloat(rawBudgetMatch[1]);
            if (rawBudgetMatch[2].startsWith('c')) req.maxPrice = val * 10000000;
            else if (rawBudgetMatch[2].startsWith('l')) req.maxPrice = val * 100000;
        }
    }

    // Area
    const areaMatch = lowerMessage.match(/([\d]+)\s*(?:\+|plus)?\s*(?:sqft|sq ft|sq.ft|sq. ft)/);
    if (areaMatch) req.minCarpetArea = parseInt(areaMatch[1], 10);

    // Possession
    if (lowerMessage.includes('ready')) req.possession = 'Ready';
    
    // Property Type
    if (lowerMessage.includes('commercial')) req.propertyType = 'Commercial';
    else if (lowerMessage.includes('residential')) req.propertyType = 'Residential';
    
    // Location (very basic logic for MVP: just try to extract known words if possible, or omit)
    // Actually, typical messages "in Andheri West"
    const inMatch = lowerMessage.match(/in\s+([a-z\s]+?)(?:under|for|budget|\d|$)/);
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