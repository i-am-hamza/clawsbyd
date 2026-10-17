/**
 * User-facing strings.
 * English; Hindi/Urdu words in Roman script only.
 * All strings must go here — no inline copy in components.
 */

export const copy = {
  site: {
    name: 'Claws by D',
    tagline: 'Nails from dainty to glam, in Ranchi.',
    location: 'Hindpiri, Ranchi',
    whatsappGreeting: 'Hi Claws by D! I have a question about my nails.',
  },
  nav: {
    lookbook: 'Lookbook',
    book: 'Book',
    shop: 'Shop press-ons',
    about: 'About',
    faq: 'FAQ',
  },
  cta: {
    bookASet: 'Book a set',
    shopPressOns: 'Shop press-ons',
    sendOnWhatsApp: 'Send on WhatsApp',
    messageOnWhatsApp: 'Message me on WhatsApp',
    viewLookbook: 'Lookbook',
  },
  booking: {
    requestSent: 'Request sent. I\'ll confirm on WhatsApp.',
    whatsAppHint: 'Tap below to send your request to me.',
  },
  shop: {
    sizingKitPromo: 'Not sure of your size? Get the sizing kit for ₹149 — it comes back as credit on your first set.',
    policyTick: 'Custom pieces can\'t be returned. If a set arrives damaged, send an unboxing video on WhatsApp within 48 hours.',
  },
  errors: {
    whatsappFallback: 'Something went wrong. Message me on WhatsApp instead.',
    slotTaken: 'That slot was just taken. Please pick another time.',
    rateLimited: 'Too many attempts. Please try again later.',
  },
} as const;
