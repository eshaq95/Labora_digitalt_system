/**
 * GS1 Barcode Parser for Labora Digit
 * 
 * Håndterer parsing av GS1-128 og UDI koder med Application Identifiers (AI)
 * Støtter de viktigste AI-kodene for laboratoriedrift:
 * - (01) GTIN - Global Trade Item Number (produktkode)
 * - (10) Lot/Batch Number
 * - (17) Expiry Date (YYMMDD format)
 * - (00) SSCC - Serial Shipping Container Code (logistikk)
 */

export interface GS1ParsedData {
  gtin?: string          // (01) Produktkode
  lotNumber?: string     // (10) Batch/Lotnummer
  expiryDate?: Date      // (17) Utløpsdato (konvertert fra YYMMDD)
  sscc?: string          // (00) Logistikk-kode
  raw: string            // Original skannet streng
  isGS1: boolean         // Om dette er en GS1-kode
  applicationIdentifiers: Record<string, string> // Alle AI-er funnet
}

/**
 * Application Identifier definisjooner
 * Definerer lengde og format for hver AI-kode
 */
const AI_DEFINITIONS: Record<string, { 
  name: string
  fixedLength?: number
  variableLength?: { min: number, max: number }
  format?: 'numeric' | 'alphanumeric' | 'date'
}> = {
  '00': { name: 'SSCC', fixedLength: 18, format: 'numeric' },
  '01': { name: 'GTIN', variableLength: { min: 8, max: 14 }, format: 'numeric' },
  '10': { name: 'Lot/Batch', variableLength: { min: 1, max: 20 }, format: 'alphanumeric' },
  '17': { name: 'Expiry Date', fixedLength: 6, format: 'date' },
  '21': { name: 'Serial Number', variableLength: { min: 1, max: 20 }, format: 'alphanumeric' },
  '30': { name: 'Quantity', variableLength: { min: 1, max: 8 }, format: 'numeric' }
}

/**
 * Sjekker om en streng kan være en GS1-kode
 */
export function isGS1Code(code: string): boolean {
  // GS1-koder starter typisk med FNC1 (representert som ]C1 eller ]d2)
  // eller har parentes-format (01)12345...
  return (
    code.includes(']C1') ||
    code.includes(']d2') ||
    /^\(\d{2}\)/.test(code) ||
    /^\d{2}\d+/.test(code) // Eller bare AI + data uten parentes
  )
}

/**
 * Konverterer YYMMDD til JavaScript Date
 */
function parseGS1Date(yymmdd: string): Date | null {
  if (yymmdd.length !== 6) return null
  
  const yy = parseInt(yymmdd.substring(0, 2))
  const mm = parseInt(yymmdd.substring(2, 4))
  const dd = parseInt(yymmdd.substring(4, 6))
  
  // Håndter år: 00-49 = 2000-2049, 50-99 = 1950-1999
  const year = yy <= 49 ? 2000 + yy : 1900 + yy
  
  // Valider dato - tillat dd = 00 (tolkes som siste dag i måneden)
  if (mm < 1 || mm > 12 || dd < 0 || dd > 31) return null
  
  // Hvis dag er 00, bruk siste dag i måneden
  if (dd === 0) {
    const lastDay = new Date(year, mm, 0).getDate() // Siste dag i måneden
    return new Date(year, mm - 1, lastDay)
  }
  
  return new Date(year, mm - 1, dd) // JavaScript Date bruker 0-baserte måneder
}

/**
 * Parser en GS1-kode og returnerer strukturerte data
 */
export function parseGS1Code(code: string): GS1ParsedData {
  const result: GS1ParsedData = {
    raw: code,
    isGS1: false,
    applicationIdentifiers: {}
  }
  
  // Sjekk om dette er en GS1-kode
  if (!isGS1Code(code)) {
    return result
  }
  
  result.isGS1 = true
  
  // Rens koden - fjern FNC1 markører
  let cleanCode = code
    .replace(/\]C1/g, '')
    .replace(/\]d2/g, '')
    .trim()
  
  // Parse AI-er og data
  let position = 0
  
  // console.log('🔍 Parsing GS1 code:', cleanCode)
  
  while (position < cleanCode.length) {
    // Finn neste AI (2-4 siffer)
    let aiMatch: RegExpMatchArray | null = null
    
    // Prøv først parentes-format: (01)
    if (cleanCode[position] === '(') {
      aiMatch = cleanCode.substring(position).match(/^\((\d{2,4})\)/)
      if (aiMatch) {
        position += aiMatch[0].length // Hopp over (AI)
      }
    } else {
      // Prøv direkte AI-format: 01, 17, 10 etc.
      // Prøv først 2-sifret AI (mest vanlig)
      const twoDigitMatch = cleanCode.substring(position).match(/^(\d{2})/)
      if (twoDigitMatch && AI_DEFINITIONS[twoDigitMatch[1]]) {
        aiMatch = twoDigitMatch
        position += 2 // Hopp over AI
      } else {
        // Prøv 3-4 sifret AI
        const multiDigitMatch = cleanCode.substring(position).match(/^(\d{3,4})/)
        if (multiDigitMatch && AI_DEFINITIONS[multiDigitMatch[1]]) {
          aiMatch = multiDigitMatch
          position += multiDigitMatch[1].length // Hopp over AI
        }
      }
    }
    
    if (!aiMatch) break
    
    const ai = aiMatch[1]
    // console.log(`🏷️ Found AI: ${ai} at position ${position}`)
    const aiDef = AI_DEFINITIONS[ai]
    
    if (!aiDef) {
      // Ukjent AI - hopp over
      position++
      continue
    }
    
    // Ekstraher data for denne AI-en
    let dataLength: number
    let data: string
    
    if (aiDef.fixedLength) {
      // Fast lengde
      dataLength = aiDef.fixedLength
      data = cleanCode.substring(position, position + dataLength)
      position += dataLength
    } else if (aiDef.variableLength) {
      // Variabel lengde - finn neste AI eller slutt på streng
      const remainingCode = cleanCode.substring(position)
      // console.log(`🔍 Looking for next AI in: "${remainingCode}"`)
      
      // Look for next AI pattern - handle both parentheses and raw format
      let nextAiIndex = -1
      for (let i = aiDef.variableLength.min; i < Math.min(remainingCode.length, aiDef.variableLength.max + 1); i++) {
        const substr = remainingCode.substring(i)
        
        // Check for parentheses format: (XX)
        const parenMatch = substr.match(/^\((\d{2,4})\)/)
        if (parenMatch) {
          const potentialAi = parenMatch[1]
          if (AI_DEFINITIONS[potentialAi]) {
            nextAiIndex = i
            // console.log(`🎯 Found next AI "${potentialAi}" in parentheses at index ${i}`)
            break
          }
        }
        
        // Check for raw format: XX (only if no parentheses found yet)
        if (!parenMatch && /^(\d{2})/.test(substr)) {
          const potentialAi = substr.substring(0, 2)
          if (AI_DEFINITIONS[potentialAi]) {
            nextAiIndex = i
            // console.log(`🎯 Found next AI "${potentialAi}" in raw format at index ${i}`)
            break
          }
        }
      }
      
      if (nextAiIndex > 0) {
        data = remainingCode.substring(0, nextAiIndex)
      } else {
        data = remainingCode
      }
      
      // console.log(`📏 Variable length data: "${data}" (length: ${data.length})`)
      
      // Valider lengde
      if (data.length < aiDef.variableLength.min || data.length > aiDef.variableLength.max) {
        // console.log(`❌ Invalid length for AI ${ai}: ${data.length} (expected ${aiDef.variableLength.min}-${aiDef.variableLength.max})`)
        position++
        continue
      }
      
      position += data.length
    } else {
      position++
      continue
    }
    
    // Lagre AI og data
    // console.log(`📦 AI ${ai}: "${data}" (length: ${data.length})`)
    result.applicationIdentifiers[ai] = data
    
    // Sett spesifikke felter basert på AI
    switch (ai) {
      case '01':
        result.gtin = data
        break
      case '10':
        result.lotNumber = data
        break
      case '17':
        const parsedDate = parseGS1Date(data)
        if (parsedDate) {
          result.expiryDate = parsedDate
        }
        break
      case '00':
        result.sscc = data
        break
    }
  }
  
  return result
}

/**
 * Ekstraherer GTIN fra en GS1-kode for database-oppslag
 * Returnerer kun GTIN-delen, ikke hele GS1-strengen
 */
export function extractGTIN(code: string): string | null {
  const parsed = parseGS1Code(code)
  return parsed.gtin || null
}

/**
 * Sjekker om en kode er en SSCC (logistikk-kode)
 */
export function isSSCCCode(code: string): boolean {
  const parsed = parseGS1Code(code)
  return !!parsed.sscc
}

/**
 * Formaterer GS1-data for visning
 */
export function formatGS1Data(parsed: GS1ParsedData): string {
  if (!parsed.isGS1) return parsed.raw
  
  const parts: string[] = []
  
  if (parsed.gtin) parts.push(`GTIN: ${parsed.gtin}`)
  if (parsed.lotNumber) parts.push(`Lot: ${parsed.lotNumber}`)
  if (parsed.expiryDate) {
    parts.push(`Utløper: ${parsed.expiryDate.toLocaleDateString('nb-NO')}`)
  }
  if (parsed.sscc) parts.push(`SSCC: ${parsed.sscc}`)
  
  return parts.join(' | ')
}

/**
 * Test-funksjon for å validere parser
 */
export function testGS1Parser() {
  const testCodes = [
    '(01)5032384029433(17)250900(10)103548', // Your exact barcode with parentheses
    '01050323840294331725090010103548',      // Your exact barcode raw format
    '(01)12345678901234(17)261231(10)LOTABC123',
    '0112345678901234172612311LOTABC123',
    '(00)123456789012345678',
    'EAN123456789' // Ikke GS1
  ]
  
  console.log('🧪 Testing GS1 Parser:')
  testCodes.forEach(code => {
    const result = parseGS1Code(code)
    console.log(`Input: ${code}`)
    console.log(`Result:`, result)
    console.log(`Formatted: ${formatGS1Data(result)}`)
    console.log('---')
  })
}
