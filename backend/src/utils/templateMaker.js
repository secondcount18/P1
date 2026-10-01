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