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