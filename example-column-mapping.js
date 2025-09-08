// Example of how to customize column mapping in the import script

// If your Excel has columns like this:
// "Company Name" | "Web Address" | "Contact Email" | "Phone Number"

// Update the mapping in import-from-excel.js like this:
const supplier = await prisma.supplier.create({
  data: {
    name: row['Company Name'],           // Your Excel column name
    website: row['Web Address'],         // Your Excel column name  
    orderEmail: row['Contact Email'],    // Your Excel column name
    phone: row['Phone Number'],          // Your Excel column name
    contactPerson: row['Contact Person'], // Your Excel column name
    notes: row['Additional Notes'],      // Your Excel column name
  }
})

// The script will automatically handle:
// ✅ Missing columns (sets to null)
// ✅ Empty cells (sets to null)  
// ✅ Data type conversion
// ✅ Error handling per row
