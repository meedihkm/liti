import { describe, it, expect } from 'vitest'
import { computeUnitPrice } from './pricing'

describe('computeUnitPrice', () => {
  it('calcule le prix de base sans options', () => {
    const result = computeUnitPrice({
      basePrice: 10000,
      fabricExtra: 0,
      embroideryExtras: [],
      isCustomSize: false,
      customSizeFee: 0,
    })
    expect(result).toBe(10000)
  })

  it('ajoute le supplément tissu', () => {
    const result = computeUnitPrice({
      basePrice: 10000,
      fabricExtra: 2000,
      embroideryExtras: [],
      isCustomSize: false,
      customSizeFee: 0,
    })
    expect(result).toBe(12000)
  })

  it('ajoute les broderies', () => {
    const result = computeUnitPrice({
      basePrice: 10000,
      fabricExtra: 0,
      embroideryExtras: [1500, 2500],
      isCustomSize: false,
      customSizeFee: 0,
    })
    expect(result).toBe(14000)
  })

  it('ajoute le supplément sur-mesure', () => {
    const result = computeUnitPrice({
      basePrice: 10000,
      fabricExtra: 0,
      embroideryExtras: [],
      isCustomSize: true,
      customSizeFee: 3000,
    })
    expect(result).toBe(13000)
  })

  it('calcule avec toutes les options', () => {
    const result = computeUnitPrice({
      basePrice: 10000,
      fabricExtra: 2000,
      embroideryExtras: [1500, 2500],
      isCustomSize: true,
      customSizeFee: 3000,
    })
    expect(result).toBe(19000)
  })

  it('gère les valeurs négatives en les ignorant', () => {
    const result = computeUnitPrice({
      basePrice: 10000,
      fabricExtra: -500,
      embroideryExtras: [-100, 1500],
      isCustomSize: true,
      customSizeFee: -200,
    })
    expect(result).toBe(11500) // 10000 + 0 + 1500 + 0
  })
})
