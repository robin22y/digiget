// Privacy Policy & Terms Configuration
// Edit these values to update company information across all legal pages

export const legalConfig = {
  company: {
    legalName: '[COMPANY LEGAL NAME]',
    tradingAs: 'DigiGet',
    registeredAddress: '[YOUR REGISTERED ADDRESS]',
    contactEmail: 'hello@digiget.uk',
    icoNumber: '[YOUR ICO NUMBER]',
    dpoEmail: 'hello@digiget.uk', // Leave same if no separate DPO
    companyNumber: '[COMPANY NUMBER]',
  },
  dates: {
    lastUpdated: '30 October 2025',
    effectiveDate: '30 October 2025',
    version: '1.0',
  },
  links: {
    cookiesPage: '/cookies',
    websiteUrl: 'digiget.uk',
  },
  pricing: {
    proMonthly: 9.99,
    christmasFreeUntil: '25 December 2025',
    basicFree: true,
  },
};

// Backwards compatibility
export const privacyConfig = legalConfig;

