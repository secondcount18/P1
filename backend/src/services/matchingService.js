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