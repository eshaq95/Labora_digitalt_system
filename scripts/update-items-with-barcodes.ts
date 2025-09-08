import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script for å oppdatere eksisterende items med barcode-data
 * Dette simulerer leverandørenes strekkoder basert på SKU eller andre identifikatorer
 */

// Simulerte leverandør-strekkoder basert på vanlige formater
const generateBarcodeFromSKU = (sku: string): string => {
  // Konverter SKU til en numerisk streng som ligner en EAN-13
  const cleanSku = sku.replace(/[^A-Z0-9]/g, '');
  
  // Generer en 13-sifret kode basert på SKU
  let numericString = '';
  for (let i = 0; i < cleanSku.length; i++) {
    const char = cleanSku[i];
    if (/\d/.test(char)) {
      numericString += char;
    } else {
      // Konverter bokstaver til tall (A=1, B=2, etc.)
      numericString += (char.charCodeAt(0) - 64).toString().padStart(2, '0');
    }
  }
  
  // Pad eller trim til 12 siffer (EAN-13 uten sjekksum)
  numericString = numericString.substring(0, 12).padEnd(12, '0');
  
  // Legg til en enkel sjekksum (ikke ekte EAN-13 algoritme, bare for demo)
  const checksum = (parseInt(numericString) % 10).toString();
  
  return numericString + checksum;
};

// Vanlige leverandør-prefikser for å simulere ekte strekkoder
const supplierPrefixes = {
  'VWR': '7090001',
  'MERCK': '7090002', 
  'THERMO': '7090003',
  'SIGMA': '7090004',
  'FISHER': '7090005',
  'LABORA': '7090006'
};

const getSupplierPrefix = (itemName: string, supplierNames: string[]): string => {
  // Sjekk om item-navnet inneholder leverandør-hint
  for (const [supplier, prefix] of Object.entries(supplierPrefixes)) {
    if (itemName.toUpperCase().includes(supplier) || 
        supplierNames.some(name => name.toUpperCase().includes(supplier))) {
      return prefix;
    }
  }
  
  // Default prefix for ukjente leverandører
  return '7090000';
};

async function updateItemsWithBarcodes() {
  console.log('🔍 Henter items som mangler barcode...');
  
  // Hent alle items som ikke har barcode
  const itemsWithoutBarcode = await prisma.item.findMany({
    where: {
      barcode: null
    },
    include: {
      supplierItems: {
        include: {
          supplier: true
        }
      }
    }
  });

  console.log(`📦 Fant ${itemsWithoutBarcode.length} items som mangler barcode`);

  let updated = 0;
  let errors = 0;

  for (const item of itemsWithoutBarcode) {
    try {
      // Få leverandør-navn for å bestemme prefix
      const supplierNames = item.supplierItems.map(si => si.supplier.name);
      const prefix = getSupplierPrefix(item.name, supplierNames);
      
      // Generer barcode basert på SKU
      let barcode = generateBarcodeFromSKU(item.sku);
      
      // Legg til leverandør-prefix
      barcode = prefix + barcode.substring(7);

      // Sjekk at barcoden ikke allerede eksisterer
      const existingBarcode = await prisma.item.findUnique({
        where: { barcode }
      });

      if (existingBarcode) {
        // Legg til en tilfeldig suffix hvis barcode allerede eksisterer
        barcode = barcode.substring(0, 12) + Math.floor(Math.random() * 10).toString();
      }

      // Oppdater item med barcode
      await prisma.item.update({
        where: { id: item.id },
        data: { barcode }
      });

      console.log(`✅ ${item.sku}: ${item.name} -> ${barcode}`);
      updated++;

    } catch (error) {
      console.error(`❌ Feil ved oppdatering av ${item.sku}:`, error);
      errors++;
    }
  }

  console.log('\n📊 SAMMENDRAG:');
  console.log(`✅ Oppdatert: ${updated} items`);
  console.log(`❌ Feil: ${errors} items`);
  
  // Vis noen eksempler på genererte barcodes
  console.log('\n🔍 EKSEMPLER PÅ GENERERTE BARCODES:');
  const samplesWithBarcodes = await prisma.item.findMany({
    where: {
      barcode: { not: null }
    },
    select: {
      sku: true,
      name: true,
      barcode: true
    },
    take: 5
  });

  samplesWithBarcodes.forEach(item => {
    console.log(`📦 ${item.sku}: ${item.name}`);
    console.log(`   🏷️  Barcode: ${item.barcode}`);
  });
}

async function main() {
  try {
    await updateItemsWithBarcodes();
  } catch (error) {
    console.error('Feil ved oppdatering av barcodes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
