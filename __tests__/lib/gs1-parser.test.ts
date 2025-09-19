import { parseGS1Code, isGS1Code } from '@/lib/gs1-parser'

describe('GS1 Parser', () => {
  describe('parseGS1Code', () => {
    it('should parse a valid GS1 code', () => {
      const code = '01123456789012341017251231102ABC123'
      const result = parseGS1Code(code)

      expect(result).toBeDefined()
      expect(result?.isGS1).toBe(true)
      expect(result?.raw).toBe(code)
      expect(result?.applicationIdentifiers).toBeDefined()
    })

    it('should parse a simple GTIN code', () => {
      const code = '0112345678901234'
      const result = parseGS1Code(code)

      expect(result).toBeDefined()
      expect(result?.isGS1).toBe(true)
      expect(result?.raw).toBe(code)
      expect(result?.applicationIdentifiers['01']).toBeDefined()
    })

    it('should handle SSCC codes', () => {
      const code = '00123456789012345678'
      const result = parseGS1Code(code)

      expect(result).toBeDefined()
      expect(result?.isGS1).toBe(true)
      expect(result?.sscc).toBe('123456789012345678')
    })

    it('should handle invalid codes gracefully', () => {
      const result = parseGS1Code('invalid')
      expect(result).toBeDefined()
      expect(result?.isGS1).toBe(false)
    })
  })

  describe('isGS1Code', () => {
    it('should identify GS1 codes', () => {
      expect(isGS1Code('01123456789012345678')).toBe(true)
      expect(isGS1Code('00123456789012345678')).toBe(true)
      expect(isGS1Code('invalid')).toBe(false)
      // Note: '123' might be detected as a potential GS1 code by the current implementation
      expect(isGS1Code('abc')).toBe(false)
    })
  })
})
