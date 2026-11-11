import { describe, it, expect } from 'vitest'
import { orderCreateSchema, contactSchema, measurementSchema } from './validators'

describe('orderCreateSchema', () => {
  it('valide une commande complète', () => {
    const valid = {
      items: [
        {
          productId: 'prod-1',
          fabricId: 'fab-1',
          colorId: 'col-1',
          embroideryIds: [],
          size: 'M',
          length: '',
          eventDate: '',
          note: '',
          quantity: 1,
        },
      ],
      customer: {
        fullName: 'Amina Kabyle',
        phone: '0555123456',
        email: 'amina@example.com',
        address: '123 Rue Test',
        wilaya: '15',
        commune: 'Tizi-Ouzou',
        deliveryMode: 'home',
      },
      website: '',
    }

    const result = orderCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejette un honeypot rempli', () => {
    const invalid = {
      items: [
        {
          productId: 'prod-1',
          fabricId: 'fab-1',
          colorId: 'col-1',
          embroideryIds: [],
          size: 'M',
          length: '',
          eventDate: '',
          note: '',
          quantity: 1,
        },
      ],
      customer: {
        fullName: 'Bot',
        phone: '0555123456',
        email: 'bot@spam.com',
        address: '123',
        wilaya: '15',
        commune: 'Test',
        deliveryMode: 'home',
      },
      website: 'http://spam.com',
    }

    const result = orderCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('valide les mesures sur-mesure', () => {
    const valid = {
      items: [
        {
          productId: 'prod-1',
          fabricId: 'fab-1',
          colorId: 'col-1',
          embroideryIds: [],
          size: 'sur-mesure',
          measurements: {
            bust: 90,
            waist: 75,
            hips: 95,
            shoulder: 40,
            armLength: 58,
            height: 165,
          },
          length: '',
          eventDate: '',
          note: '',
          quantity: 1,
        },
      ],
      customer: {
        fullName: 'Amina',
        phone: '0555123456',
        email: 'amina@example.com',
        address: '123',
        wilaya: '15',
        commune: 'Test',
        deliveryMode: 'home',
      },
      website: '',
    }

    const result = orderCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejette des mesures hors limites', () => {
    const invalid = {
      items: [
        {
          productId: 'prod-1',
          fabricId: 'fab-1',
          colorId: 'col-1',
          embroideryIds: [],
          size: 'sur-mesure',
          measurements: {
            bust: 999, // trop grand
            waist: 75,
            hips: 95,
            shoulder: 40,
            armLength: 58,
            height: 165,
          },
          length: '',
          eventDate: '',
          note: '',
          quantity: 1,
        },
      ],
      customer: {
        fullName: 'Amina',
        phone: '0555123456',
        email: 'amina@example.com',
        address: '123',
        wilaya: '15',
        commune: 'Test',
        deliveryMode: 'home',
      },
      website: '',
    }

    const result = orderCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('contactSchema', () => {
  it('valide un message de contact', () => {
    const valid = {
      name: 'Amina Kabyle',
      email: 'amina@example.com',
      phone: '0555123456',
      subject: 'Question sur une robe',
      message: 'Je voudrais des informations sur vos robes de mariage.',
      website: '',
    }

    const result = contactSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejette un honeypot rempli', () => {
    const invalid = {
      name: 'Bot',
      email: 'bot@spam.com',
      phone: '1234567890',
      subject: 'Spam',
      message: 'Buy my products',
      website: 'http://spam.com',
    }

    const result = contactSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
