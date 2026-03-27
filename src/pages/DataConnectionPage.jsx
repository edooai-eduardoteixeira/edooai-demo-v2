import React, { useState, useCallback, useRef, useEffect } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import Modal from '../components/Modal.jsx';
import { cn } from '../lib/utils';

// ═══════════════════════════════════════════
// SVG ICON COMPONENTS
// ═══════════════════════════════════════════
const SIMPLE_ICON_PATHS = {
  Zendesk: 'M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z',
  Intercom: 'M21 0H3C1.343 0 0 1.343 0 3v18c0 1.658 1.343 3 3 3h18c1.658 0 3-1.342 3-3V3c0-1.657-1.342-3-3-3zm-5.801 4.399c0-.44.36-.8.802-.8.44 0 .8.36.8.8v10.688c0 .442-.36.801-.8.801-.443 0-.802-.359-.802-.801V4.399zM11.2 3.994c0-.44.357-.799.8-.799s.8.359.8.799v11.602c0 .44-.357.8-.8.8s-.8-.36-.8-.8V3.994zm-4 .405c0-.44.359-.8.799-.8.443 0 .802.36.802.8v10.688c0 .442-.36.801-.802.801-.44 0-.799-.359-.799-.801V4.399zM3.199 6c0-.442.36-.8.802-.8.44 0 .799.358.799.8v7.195c0 .441-.359.8-.799.8-.443 0-.802-.36-.802-.8V6zM20.52 18.202c-.123.105-3.086 2.593-8.52 2.593-5.433 0-8.397-2.486-8.521-2.593-.335-.288-.375-.792-.086-1.128.285-.334.79-.375 1.125-.09.047.041 2.693 2.211 7.481 2.211 4.848 0 7.456-2.186 7.479-2.207.334-.289.839-.25 1.128.086.289.336.25.84-.086 1.128zm.281-5.007c0 .441-.36.8-.801.8-.441 0-.801-.36-.801-.8V6c0-.442.361-.8.801-.8.441 0 .801.357.801.8v7.195z',
  HubSpot: 'M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z',
  Mailchimp: 'M11.267 0C6.791-.015-1.82 10.246 1.397 12.964l.79.669a3.88 3.88 0 0 0-.22 1.792c.084.84.518 1.644 1.22 2.266.666.59 1.542.964 2.392.964 1.406 3.24 4.62 5.228 8.386 5.34 4.04.12 7.433-1.776 8.854-5.182.093-.24.488-1.316.488-2.267 0-.956-.54-1.352-.885-1.352-.01-.037-.078-.286-.172-.586-.093-.3-.19-.51-.19-.51.375-.563.382-1.065.332-1.35-.053-.353-.2-.653-.496-.964-.296-.311-.902-.63-1.753-.868l-.446-.124c-.002-.019-.024-1.053-.043-1.497-.014-.32-.042-.822-.197-1.315-.186-.668-.508-1.253-.911-1.627 1.112-1.152 1.806-2.422 1.804-3.511-.003-2.095-2.576-2.729-5.746-1.416l-.672.285A678.22 678.22 0 0 0 12.7.504C12.304.159 11.817.002 11.267 0z',
  Mailgun: 'M11.837 0c6.602 0 11.984 5.381 11.984 11.994-.017 2.99-3.264 4.84-5.844 3.331a3.805 3.805 0 0 1-.06-.035l-.055-.033-.022.055c-2.554 4.63-9.162 4.758-11.894.232-2.732-4.527.46-10.313 5.746-10.416a6.868 6.868 0 0 1 7.002 6.866 1.265 1.265 0 0 0 2.52 0c0-5.18-4.197-9.38-9.377-9.387C4.611 2.594.081 10.41 3.683 16.673c3.238 5.632 11.08 6.351 15.289 1.402l1.997 1.686A11.95 11.95 0 0 1 11.837 24C2.6 23.72-2.87 13.543 1.992 5.684A12.006 12.006 0 0 1 11.837 0Zm0 7.745c-3.276-.163-5.5 3.281-4.003 6.2a4.26 4.26 0 0 0 4.014 2.31c3.276-.171 5.137-3.824 3.35-6.575a4.26 4.26 0 0 0-3.36-1.935Zm0 2.53c1.324 0 2.152 1.433 1.49 2.58a1.72 1.72 0 0 1-1.49.86 1.72 1.72 0 1 1 0-3.44Z',
  SurveyMonkey: 'M21.1627 13.1843a2.8517 2.8517 0 0 0-.6778.0841c-.8438-3.3181-3.5478-5.8376-6.9172-6.4452a8.3933 8.3933 0 0 0-.4407-.0668c.0259-.8255.0636-1.7791 1.2781-2.6369l-.1918-.4838s-2.3708.7349-2.6391 2.7598c-.1175-.5507-1.2209-1.2403-1.7673-1.3707l-.2717.4384s.7242.3621.9009 1.361c-3.3691.6056-6.0743 3.1229-6.9204 6.4398-1.5194-.376-3.056.5508-3.432 2.0703-.376 1.5194.5508 3.056 2.0703 3.432a2.8346 2.8346 0 0 0 1.7195-.1142 8.6821 8.6821 0 0 0 .9203 1.7123l2.3524-1.5852c-.6381-.8071-1.0206-1.9884-1.0873-3.1736-.07-1.2931.2446-2.5755 1.0701-3.3298 1.7016-1.4483 3.5561-.7877 4.7135.6002h.3114c1.1606-1.388 3.0173-2.0475 4.7135-.6002.8244.7543 1.1401 2.0378 1.0701 3.3298-.0656 1.1853-.4481 2.3664-1.0873 3.1736l2.3524 1.5852a8.6854 8.6854 0 0 0 .9224-1.7123c1.4551.5751 3.1009-.1384 3.676-1.5935s-.1384-3.1009-1.5935-3.676a2.8349 2.8349 0 0 0-1.0448-.1983zM2.7861 16.8482a.8362.8362 0 0 1 0-1.6724.8442.8442 0 0 1 .4688.1444c.0071.4391.0369.8776.0894 1.3136-.1472.1346-.3738.2329-.5582.2144zm18.4273 0a.8361.8361 0 0 1-.5582-.2155 12.679 12.679 0 0 0 .0894-1.3136.8352.8352 0 0 1 1.304.6929c.0078.4574-.3823.8581-.8352.8362z',
};

const CUSTOM_SVGS = {
  Braze: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.5 2 7 6 7 8c0 2.5 1.5 3.5 2.5 5S10 16 10 18c0 1 .5 4 2 4s2-3 2-4c0-2-.5-3.5.5-5S17 10.5 17 8c0-2-1.5-6-5-6z" fill="#ED5C2B"/><path d="M12 6c-1.5 0-2.5 2-2.5 3.5 0 1 .5 2 1.25 3 .5.7.75 1.5 1 2.5h.5c.25-1 .5-1.8 1-2.5.75-1 1.25-2 1.25-3C14.5 8 13.5 6 12 6z" fill="white" opacity="0.4"/></svg>`,
  Klaviyo: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#000000"><path d="M2 4v16l8-5.333L18 20l4-2.667V4H2zm16 12.667l-6-4L6 16.667V6.667h12v10z"/></svg>`,
  SendGrid: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#1A82E2"/><path d="M8 8h8v8H8z" fill="white" opacity="0.5"/><path d="M8 8h4v4H8z" fill="white"/><path d="M12 12h4v4h-4z" fill="white"/></svg>`,
  Segment: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#52BD95"/><rect x="5" y="10.5" width="14" height="3" rx="1.5" fill="white"/><rect x="8" y="5.5" width="11" height="3" rx="1.5" fill="white" opacity="0.7"/><rect x="5" y="15.5" width="11" height="3" rx="1.5" fill="white" opacity="0.7"/></svg>`,
  Freshdesk: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#00A65A"/><path d="M12 4C8.13 4 5 7.13 5 11v2c0 1.1.9 2 2 2h1v-4h-1.5c.5-2.76 2.94-5 5.5-5s5 2.24 5.5 5H16v4h1c1.1 0 2-.9 2-2v-2c0-3.87-3.13-7-7-7z" fill="white"/><circle cx="9.5" cy="15" r="1.5" fill="white"/><circle cx="14.5" cy="15" r="1.5" fill="white"/></svg>`,
  Typeform: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#262627"/><path d="M6 7.5h12v2H13.25v8.5h-2.5v-8.5H6v-2z" fill="white"/></svg>`,
  Qualtrics: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#B71C8A"/><path d="M6 6h5v5H6zM13 6h5v5h-5zM6 13h5v5H6zM13 13h5v5h-5z" fill="white" opacity="0.85"/><path d="M15.5 15.5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>`,
  Salesforce: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M10.2 4.8c1.2-1.3 2.9-2.1 4.8-2.1 2.5 0 4.7 1.4 5.8 3.5.5-.2 1.1-.3 1.7-.3 2.7 0 4.9 2.2 4.9 4.9 0 2.7-2.2 4.9-4.9 4.9-.4 0-.8-.05-1.2-.14-1 1.7-2.8 2.84-4.9 2.84-.9 0-1.8-.2-2.5-.6-1 1.4-2.6 2.3-4.4 2.3-2.1 0-3.9-1.2-4.7-2.9-.4.08-.8.12-1.3.12C1.6 18.21-.5 16.1-.5 13.2c0-1.9 1-3.6 2.6-4.5-.3-.7-.5-1.5-.5-2.4C1.6 3.2 4.1.7 7.2.7c2.4 0 1.9.1 3 4.1z" fill="#00A1E0" transform="translate(1.5 2) scale(0.88)"/></svg>`,
  Twilio: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10.5" stroke="#F22F46" strokeWidth="2.2" fill="none"/><circle cx="9" cy="9" r="2" fill="#F22F46"/><circle cx="15" cy="9" r="2" fill="#F22F46"/><circle cx="9" cy="15" r="2" fill="#F22F46"/><circle cx="15" cy="15" r="2" fill="#F22F46"/></svg>`,
  Firebase: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><path d="M4.53 20.27L6.83 1.33a.5.5 0 01.94-.17l2.5 4.68L4.53 20.27z" fill="#FFA000"/><path d="M13.43 8.41l-3.16-5.57L4.53 20.27 13.43 8.41z" fill="#F57C00"/><path d="M19.47 20.27L17.39 4.33a.5.5 0 00-.85-.27l-12.01 16.21.54.34a1.5 1.5 0 001.56.08L19.47 20.27z" fill="#FFCA28"/><path d="M4.53 20.27l2.3-13.28 3.44-1.58L4.53 20.27z" fill="#FFA000"/></svg>`,
  ActiveCampaign: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#356AE6"/><path d="M7 12l4-4v2.5h6v3h-6V16l-4-4z" fill="white"/></svg>`,
  'Customer.io': (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#1B9AAA"/><path d="M6 7h12a1 1 0 011 1v7a1 1 0 01-1 1h-3l-3 2.5L9 16H6a1 1 0 01-1-1V8a1 1 0 011-1z" fill="white"/><circle cx="9.5" cy="11.5" r="1" fill="#1B9AAA"/><circle cx="12" cy="11.5" r="1" fill="#1B9AAA"/><circle cx="14.5" cy="11.5" r="1" fill="#1B9AAA"/></svg>`,
  Iterable: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#6032D6"/><circle cx="8" cy="8" r="2.5" fill="white"/><circle cx="16" cy="8" r="2.5" fill="white"/><circle cx="12" cy="16" r="2.5" fill="white"/><line x1="9.5" y1="9.5" x2="11" y2="14" stroke="white" strokeWidth="1.5"/><line x1="14.5" y1="9.5" x2="13" y2="14" stroke="white" strokeWidth="1.5"/><line x1="10.5" y1="8" x2="13.5" y2="8" stroke="white" strokeWidth="1.5"/></svg>`,
  'Amazon SES': (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#FF9900"/><path d="M5 14c2.5 1.5 5.5 2.5 9 2.5 2.5 0 5-.5 7-1.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/><path d="M19 12V8h-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M6 8h6a3 3 0 010 6H9" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>`,
  Postmark: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#FFCC00"/><path d="M5 8l7 5 7-5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><rect x="5" y="7" width="14" height="10" rx="1.5" stroke="#333" strokeWidth="1.8" fill="none"/></svg>`,
  MessageBird: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#2481D7"/><path d="M6 10c1-3 4-5 7-5 4 0 6 3 6 5 0 3-2 6-6 7-2 .5-4 0-5.5-1L6 17v-3c0-1 0-2.5 0-4z" fill="white"/><circle cx="14" cy="10" r="1.2" fill="#2481D7"/></svg>`,
  Attentive: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#000"/><path d="M12 5l6 14h-3l-1.2-3H10.2L9 19H6l6-14zm0 4.5L10.5 14h3L12 9.5z" fill="white"/></svg>`,
  OneSignal: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#E54B4D"/><path d="M12 4a6 6 0 00-6 6v3.5l-1 2.5h14l-1-2.5V10a6 6 0 00-6-6z" fill="white"/><path d="M10 17.5a2 2 0 004 0" stroke="white" strokeWidth="1.5" fill="none"/></svg>`,
  Airship: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#00BCD4"/><path d="M12 4c-2 2-4 5-4 9 0 2 .5 4 1.5 5.5L12 16l2.5 2.5c1-1.5 1.5-3.5 1.5-5.5 0-4-2-7-4-9z" fill="white"/><circle cx="12" cy="11" r="2" fill="#00BCD4"/></svg>`,
  mParticle: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#3B5998"/><circle cx="7" cy="12" r="2.5" fill="white"/><circle cx="17" cy="7" r="2.5" fill="white"/><circle cx="17" cy="17" r="2.5" fill="white"/><line x1="9.5" y1="11" x2="14.5" y2="8" stroke="white" strokeWidth="1.5"/><line x1="9.5" y1="13" x2="14.5" y2="16" stroke="white" strokeWidth="1.5"/></svg>`,
  Hightouch: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#6C47FF"/><path d="M12 5v10M8 9l4-4 4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 18h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>`,
  RudderStack: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#1A8563"/><circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="1.5" fill="white"/><line x1="12" y1="6" x2="12" y2="9" stroke="white" strokeWidth="1.8"/><line x1="12" y1="15" x2="12" y2="18" stroke="white" strokeWidth="1.8"/><line x1="6" y1="12" x2="9" y2="12" stroke="white" strokeWidth="1.8"/><line x1="15" y1="12" x2="18" y2="12" stroke="white" strokeWidth="1.8"/></svg>`,
  Gorgias: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#4B88D3"/><path d="M15 8.5A5.5 5.5 0 1012 17.5 5.5 5.5 0 0017.5 12H13v2h2a3.5 3.5 0 11-1-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>`,
  Kustomer: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#354353"/><path d="M8.5 5.5v13M8.5 12l7-6.5M8.5 12l7 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>`,
  Delighted: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#6B4FBB"/><circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.8" fill="none"/><circle cx="9.5" cy="10.5" r="1.2" fill="white"/><circle cx="14.5" cy="10.5" r="1.2" fill="white"/><path d="M8.5 14.5c.8 1.5 2 2 3.5 2s2.7-.5 3.5-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>`,
  AskNicely: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#F83A49"/><path d="M12 4l2.5 5.5L20 10.5l-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-1L12 4z" fill="white"/></svg>`,
  Shopify: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#96BF48"/><path d="M16 6.5c-.1 0-.2.05-.2.15 0 0-.5.15-.5.15-.3-.9-.8-1.7-1.8-1.7h-.2c-.3-.4-.6-.5-.9-.5-2.2 0-3.3 2.8-3.6 4.2l-1.5.5c-.5.1-.5.2-.5.6L5.5 19l8.5 1.5 4.5-1S16.1 6.5 16 6.5z" fill="white"/><path d="M13.3 6.8l-1 .3v-.2c0-.6-.1-1.1-.3-1.4.4.1.6.4.8 1 0 .1.3.2.5.3z" fill="#96BF48" opacity="0.5"/></svg>`,
  Stripe: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#635BFF"/><path d="M11.2 9.6c0-.5.4-.7 1.1-.7.9 0 2.1.3 3 .8V7.1c-1-.4-2-.6-3-.6-2.5 0-4.1 1.3-4.1 3.4 0 3.4 4.6 2.8 4.6 4.3 0 .6-.5.8-1.2.8-1 0-2.4-.4-3.4-1v2.7c1.2.5 2.3.7 3.4.7 2.5 0 4.2-1.2 4.2-3.4 0-3.6-4.6-3-4.6-4.4z" fill="white"/></svg>`,
  Census: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#FF6B2B"/><path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="16" r="2" fill="white"/></svg>`,
  'Inbound Webhooks': (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#2563EB"/><path d="M12 6v8m0 0l-3-3m3 3l3-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 18h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>`,
  'REST API': (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#059669"/><path d="M8 7l-3 5 3 5M16 7l3 5-3 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 6l-2 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>`,
  'Secure File Drop': (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#D97706"/><path d="M12 14V6m0 0l-3 3m3-3l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>`,
};

const INTEGRATION_CATALOG = {
  Salesforce: { category: 'CRM', color: '#00A1E0', capabilities: ['write:email', 'write:sms', 'write:push'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery', 'write:push': 'Push notifications' } },
  Braze: { category: 'CRM', color: '#ED5C2B', capabilities: ['write:email', 'write:sms', 'write:push'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery', 'write:push': 'Push notifications' } },
  Klaviyo: { category: 'CRM', color: '#000000', capabilities: ['write:email', 'write:sms', 'write:push'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery', 'write:push': 'Push notifications' } },
  'Customer.io': { category: 'CRM', color: '#1B9AAA', capabilities: ['write:email', 'write:sms', 'write:push'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery', 'write:push': 'Push notifications' } },
  Iterable: { category: 'CRM', color: '#6032D6', capabilities: ['write:email', 'write:sms', 'write:push'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery', 'write:push': 'Push notifications' } },
  ActiveCampaign: { category: 'CRM', color: '#356AE6', capabilities: ['write:email', 'write:sms'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery' } },
  HubSpot: { category: 'CRM', color: '#FF7A59', capabilities: ['write:email', 'write:sms'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery' } },
  Mailchimp: { category: 'CRM', color: '#FFE01B', capabilities: ['write:email', 'write:sms'], scopeDescriptions: { 'write:email': 'Email delivery', 'write:sms': 'SMS delivery' } },
  SendGrid: { category: 'Email', color: '#1A82E2', capabilities: ['write:email'], scopeDescriptions: { 'write:email': 'Transactional email API' } },
  'Amazon SES': { category: 'Email', color: '#FF9900', capabilities: ['write:email'], scopeDescriptions: { 'write:email': 'Cloud email routing' } },
  Mailgun: { category: 'Email', color: '#DD3A34', capabilities: ['write:email'], scopeDescriptions: { 'write:email': 'Transactional email API' } },
  Postmark: { category: 'Email', color: '#FFCC00', capabilities: ['write:email'], scopeDescriptions: { 'write:email': 'Transactional email API' } },
  Twilio: { category: 'SMS', color: '#F22F46', capabilities: ['write:sms'], scopeDescriptions: { 'write:sms': 'SMS API' } },
  MessageBird: { category: 'SMS', color: '#2481D7', capabilities: ['write:sms'], scopeDescriptions: { 'write:sms': 'SMS API' } },
  Attentive: { category: 'SMS', color: '#000000', capabilities: ['write:sms'], scopeDescriptions: { 'write:sms': 'SMS API' } },
  Firebase: { category: 'Push', color: '#FFCA28', capabilities: ['write:push'], scopeDescriptions: { 'write:push': 'Mobile push infrastructure' } },
  OneSignal: { category: 'Push', color: '#E54B4D', capabilities: ['write:push'], scopeDescriptions: { 'write:push': 'Mobile push infrastructure' } },
  Airship: { category: 'Push', color: '#00BCD4', capabilities: ['write:push'], scopeDescriptions: { 'write:push': 'Mobile push infrastructure' } },
  Shopify: { category: 'Commerce', color: '#96BF48', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Order and transaction history' } },
  Stripe: { category: 'Commerce', color: '#635BFF', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Payment and charge data' } },
  Segment: { category: 'EventStream', color: '#52BD95', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Transaction events via CDP' } },
  mParticle: { category: 'EventStream', color: '#3B5998', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Transaction events via CDP' } },
  RudderStack: { category: 'EventStream', color: '#1A8563', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Transaction events via CDP' } },
  Hightouch: { category: 'ReverseETL', color: '#6C47FF', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Synced transaction data from warehouse' } },
  Census: { category: 'ReverseETL', color: '#FF6B2B', capabilities: ['read:transactions'], modalType: 'oauth', scopeDescriptions: { 'read:transactions': 'Synced transaction data from warehouse' } },
  'Inbound Webhooks': { category: 'Webhooks', color: '#2563EB', capabilities: ['read:transactions'], modalType: 'webhooks', scopeDescriptions: { 'read:transactions': 'Real-time transaction events' } },
  'REST API': { category: 'DevAPI', color: '#059669', capabilities: ['read:transactions'], modalType: 'api', scopeDescriptions: { 'read:transactions': 'Custom transaction ingestion' } },
  'Secure File Drop': { category: 'EnterpriseBatch', color: '#D97706', capabilities: ['read:transactions'], modalType: 'filedrop', scopeDescriptions: { 'read:transactions': 'Batch transaction file uploads' } },
  Zendesk: { category: 'Support', color: '#03363D', capabilities: ['read:support_tickets'], scopeDescriptions: { 'read:support_tickets': 'Active ticket status' } },
  Intercom: { category: 'Support', color: '#286EFA', capabilities: ['read:support_tickets'], scopeDescriptions: { 'read:support_tickets': 'Conversation history' } },
  Freshdesk: { category: 'Support', color: '#00A65A', capabilities: ['read:support_tickets'], scopeDescriptions: { 'read:support_tickets': 'Support ticket status' } },
  Gorgias: { category: 'Support', color: '#4B88D3', capabilities: ['read:support_tickets'], scopeDescriptions: { 'read:support_tickets': 'Active ticket status' } },
  Kustomer: { category: 'Support', color: '#354353', capabilities: ['read:support_tickets'], scopeDescriptions: { 'read:support_tickets': 'Active ticket status' } },
  SurveyMonkey: { category: 'NPS', color: '#00BF6F', capabilities: ['read:customer_ratings'], scopeDescriptions: { 'read:customer_ratings': 'NPS scores' } },
  Typeform: { category: 'NPS', color: '#262627', capabilities: ['read:customer_ratings'], scopeDescriptions: { 'read:customer_ratings': 'Feedback data' } },
  Qualtrics: { category: 'NPS', color: '#B71C8A', capabilities: ['read:customer_ratings'], scopeDescriptions: { 'read:customer_ratings': 'CSAT metrics' } },
  Delighted: { category: 'NPS', color: '#6B4FBB', capabilities: ['read:customer_ratings'], scopeDescriptions: { 'read:customer_ratings': 'NPS scores' } },
  AskNicely: { category: 'NPS', color: '#F83A49', capabilities: ['read:customer_ratings'], scopeDescriptions: { 'read:customer_ratings': 'NPS scores' } },
};

const SETUP_AREAS = {
  comms: {
    title: 'Marketing Channels',
    question: 'Connect your marketing channels',
    sub: 'All customer communications are delivered through your own channels: email, SMS and push notification.',
    capabilities: ['write:email', 'write:sms', 'write:push'],
    categories: ['CRM', 'Email', 'SMS', 'Push'],
    required: true,
  },
  data: {
    title: 'Customer Transactions',
    question: 'Connect your customer transactions',
    sub: 'Track the events that trigger timely referral invites and reward payouts.',
    capabilities: ['read:transactions'],
    categories: ['Commerce', 'EventStream', 'ReverseETL', 'Webhooks', 'DevAPI', 'EnterpriseBatch'],
    required: true,
  },
  support: {
    title: 'Support Tickets',
    question: 'Connect your support tickets',
    sub: 'Frustrated customers won\'t be contacted until their issues are resolved.',
    capabilities: ['read:support_tickets'],
    categories: ['Support'],
    required: false,
  },
  nps: {
    title: 'Net Promoter Score (NPS)',
    question: 'Connect your NPS',
    sub: 'Your happiest customers are the most likely to refer.',
    capabilities: ['read:customer_ratings'],
    categories: ['NPS'],
    required: false,
  },
};

const CUSTOM_INTEGRATION_META = {
  'Inbound Webhooks': { displayName: 'Webhooks', desc: 'Fastest setup — stream events to a secure endpoint in real time.', recommended: true },
  'REST API': { displayName: 'REST API', desc: 'Full control — send data directly from your backend.', recommended: false },
  'Secure File Drop': { displayName: 'Secure File Drop', desc: 'Batch processing — upload transaction files on a schedule.', recommended: false },
};

// SVG Icon Component
function PlatformSVG({ name, size = 20 }) {
  const color = INTEGRATION_CATALOG[name]?.color || '#666';
  if (CUSTOM_SVGS[name]) {
    return <span dangerouslySetInnerHTML={{ __html: CUSTOM_SVGS[name](size) }} />;
  }
  if (SIMPLE_ICON_PATHS[name]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d={SIMPLE_ICON_PATHS[name]} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill={color} opacity="0.15" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
        {name[0]}
      </text>
    </svg>
  );
}

// Main Component
export default function DataConnectionPage({ config, onNext, onHome }) {
  const [activeSetupArea, setActiveSetupArea] = useState('comms');
  const [fulfilledCapabilities, setFulfilledCapabilities] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [modal, setModal] = useState(null);
  const [commsExpanded, setCommsExpanded] = useState(false);
  const [agenticInput, setAgenticInput] = useState('');
  const [agenticOutput, setAgenticOutput] = useState('');
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [fadingOutSections, setFadingOutSections] = useState(new Set());

  const rightColRef = useRef(null);
  const sectionRefs = {
    comms: useRef(null),
    data: useRef(null),
    support: useRef(null),
    nps: useRef(null),
  };

  // Intersection Observer for scroll-spy
  useEffect(() => {
    if (!rightColRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.section;
            if (id) setActiveSetupArea(id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    Object.entries(sectionRefs).forEach(([id, ref]) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  // Auto-scroll on section completion
  const prevFulfilledRef = useRef(new Set());
  useEffect(() => {
    const currentFulfilledAreas = new Set();
    Object.entries(SETUP_AREAS).forEach(([id, area]) => {
      if (area.capabilities.every(cap => fulfilledCapabilities.some(c => c.key === cap))) {
        currentFulfilledAreas.add(id);
      }
    });

    const newlyCompleted = [...currentFulfilledAreas].filter(id => !prevFulfilledRef.current.has(id));

    if (newlyCompleted.length > 0) {
      // Collapse immediately — the expanded-fulfilled state already
      // looks identical (description and grid are hidden), so there's
      // nothing to animate. Just flip to collapsed on the same render.
      setCollapsedSections(prev => {
        const next = new Set(prev);
        newlyCompleted.forEach(id => next.add(id));
        return next;
      });

      // Scroll to next section after a brief pause
      setTimeout(() => {
        const areaKeys = Object.keys(SETUP_AREAS);
        const nextIncomplete = areaKeys.find(id => !currentFulfilledAreas.has(id));
        if (nextIncomplete && sectionRefs[nextIncomplete]?.current) {
          sectionRefs[nextIncomplete].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 600);
    }

    prevFulfilledRef.current = currentFulfilledAreas;
  }, [fulfilledCapabilities]);

  const connectPlatform = useCallback((name) => {
    const platform = INTEGRATION_CATALOG[name];
    if (!platform) return;
    const newCaps = platform.capabilities
      .filter(cap => !fulfilledCapabilities.some(c => c.key === cap && c.source === name))
      .map(cap => ({ key: cap, source: name }));
    setFulfilledCapabilities(prev => [...prev, ...newCaps]);
    setConnectedPlatforms(prev => prev.includes(name) ? prev : [...prev, name]);
  }, [fulfilledCapabilities]);

  const disconnectPlatform = useCallback((name) => {
    setFulfilledCapabilities(prev => prev.filter(c => c.source !== name));
    setConnectedPlatforms(prev => prev.filter(n => n !== name));
  }, []);

  const getPlatformsForCategory = useCallback((cat) => {
    if (cat === 'Comms') {
      return Object.entries(INTEGRATION_CATALOG)
        .filter(([_, v]) => ['CRM', 'Email', 'SMS', 'Push'].includes(v.category))
        .map(([name]) => name)
        .filter(name => !connectedPlatforms.includes(name));
    }
    if (cat === 'Data') {
      return Object.entries(INTEGRATION_CATALOG)
        .filter(([_, v]) => ['Commerce', 'EventStream', 'ReverseETL', 'Webhooks', 'DevAPI', 'EnterpriseBatch'].includes(v.category))
        .map(([name]) => name)
        .filter(name => !connectedPlatforms.includes(name));
    }
    const cats = Array.isArray(cat) ? cat : [cat];
    return Object.entries(INTEGRATION_CATALOG)
      .filter(([_, v]) => cats.includes(v.category))
      .map(([name]) => name)
      .filter(name => !connectedPlatforms.includes(name));
  }, [connectedPlatforms]);

  const getGroupedCommsGrid = useCallback(() => {
    const commsCaps = ['write:email', 'write:sms', 'write:push'];
    const unfulfilledCaps = commsCaps.filter(
      cap => !fulfilledCapabilities.some(c => c.key === cap)
    );
    const capToCategory = { 'write:email': 'Email', 'write:sms': 'SMS', 'write:push': 'Push' };
    const neededSpecialistCats = unfulfilledCaps.map(cap => capToCategory[cap]);

    const connectedComms = connectedPlatforms.filter(name => {
      const p = INTEGRATION_CATALOG[name];
      return p && ['CRM', 'Email', 'SMS', 'Push'].includes(p.category);
    });

    const relevantCRMs = Object.entries(INTEGRATION_CATALOG)
      .filter(([name, v]) => v.category === 'CRM' && !connectedPlatforms.includes(name))
      .filter(([_, v]) => v.capabilities.some(cap => unfulfilledCaps.includes(cap)))
      .map(([name]) => name);

    return {
      connectedComms,
      relevantCRMs,
      unfulfilledCaps,
      neededSpecialistCats,
      commsCaps,
    };
  }, [fulfilledCapabilities, connectedPlatforms]);

  const getGroupedDataGrid = useCallback(() => {
    const dataCategories = ['Commerce', 'EventStream', 'ReverseETL', 'Webhooks', 'DevAPI', 'EnterpriseBatch'];
    const fulfilled = fulfilledCapabilities.some(c => c.key === 'read:transactions');

    const connectedData = connectedPlatforms.filter(name => {
      const p = INTEGRATION_CATALOG[name];
      return p && dataCategories.includes(p.category);
    });

    return {
      connectedData,
      fulfilled,
      dataCategories,
    };
  }, [fulfilledCapabilities, connectedPlatforms]);

  const showModal = useCallback((platform) => {
    const p = INTEGRATION_CATALOG[platform];
    const modalType = p?.modalType || 'preauth';
    const type = modalType === 'oauth' ? 'preauth' : modalType;
    setModal({ type, platform });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setAgenticInput('');
    setAgenticOutput('');
  }, []);

  const handlePlatformConnect = useCallback((platform) => {
    setModal({ type: 'validating', platform });
    setTimeout(() => {
      connectPlatform(platform);
      setModal(null);
    }, 900);
  }, [connectPlatform]);

  const handleGenerateWebhookMapping = useCallback(() => {
    if (!agenticInput.trim()) return;
    setTimeout(() => {
      setAgenticOutput(`✓ Field mapping complete

Your payload              →  Vincor schema
─────────────────────────────────────────
data.id                   →  transaction_id
data.amount (÷ 100)       →  amount
data.currency             →  currency
data.customer             →  customer_external_id
event (charge.succeeded)  →  event_type: "purchase"
(auto-generated)          →  timestamp: ISO 8601

Ready to receive events at your endpoint.`);
    }, 900);
  }, [agenticInput]);

  const handleGenerateAPIScript = useCallback(() => {
    if (!agenticInput.trim()) return;
    setTimeout(() => {
      setAgenticOutput(`import requests

VINCOR_API_KEY = "vincor_live_*******************"
VINCOR_ENDPOINT = "https://api.vincor.ai/v1/transactions"

def send_transaction(row):
    payload = {
        "transaction_id": row["user_account_id"],
        "amount": float(row["usd_amount"]),
        "currency": "USD",
        "event_type": row["event_type"],
        "timestamp": row["created_at"],
    }
    resp = requests.post(
        VINCOR_ENDPOINT,
        json=payload,
        headers={"Authorization": f"Bearer {VINCOR_API_KEY}"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()`);
    }, 1200);
  }, [agenticInput]);

  const handleGenerateFileMapping = useCallback(() => {
    if (!agenticInput.trim()) return;
    setTimeout(() => {
      setAgenticOutput(`✓ Schema detected — 5 columns, 2 rows

Your column       Type       →  Vincor field
─────────────────────────────────────────
user_id           string     →  customer_external_id
order_id          string     →  transaction_id
amount            decimal    →  amount
currency          ISO 4217   →  currency
created_at        date       →  timestamp

Schema saved. Future uploads will be validated
against this mapping automatically.`);
    }, 900);
  }, [agenticInput]);

  const handleCopy = useCallback((text, e) => {
    navigator.clipboard?.writeText(text);
    const btn = e.currentTarget;
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }, []);

  const getCapDirection = (capKey) => capKey.startsWith('write:') ? 'WRITE' : 'READ';

  // Get the primary direction for a section (derived from its capabilities)
  const getSectionDirection = (sectionId) => {
    const section = SETUP_AREAS[sectionId];
    const dirs = [...new Set(section.capabilities.map(c => getCapDirection(c)))];
    return dirs.length === 1 ? dirs[0] : dirs.join(' / ');
  };

  // Check which sections are fulfilled
  const isSectionFulfilled = (sectionId) => {
    const section = SETUP_AREAS[sectionId];
    return section.capabilities.every(cap => fulfilledCapabilities.some(c => c.key === cap));
  };

  // Check if all required sections are fulfilled
  const allRequiredFulfilled = Object.entries(SETUP_AREAS)
    .filter(([_, a]) => a.required)
    .every(([_, a]) => a.capabilities.every(cap =>
      fulfilledCapabilities.some(c => c.key === cap)
    ));

  const commsGrid = getGroupedCommsGrid();
  const dataGrid = getGroupedDataGrid();

  // Helper to render section content
  const renderSectionContent = (sectionId) => {
    const area = SETUP_AREAS[sectionId];
    let gridContent = null;

    if (sectionId === 'comms') {
      const allUnfulfilled = commsGrid.unfulfilledCaps.length === commsGrid.commsCaps.length;
      const allFulfilled = commsGrid.unfulfilledCaps.length === 0;

      gridContent = (
        <div>
          {commsGrid.connectedComms.length > 0 && (
            <div className="grid grid-cols-2 gap-0">
              {commsGrid.connectedComms.map(renderConnectedPlatformRow)}
            </div>
          )}

          {!allFulfilled && allUnfulfilled && (
            <>
              {commsGrid.relevantCRMs.length > 0 && (
                <div className="grid grid-cols-2 gap-0">
                  {commsGrid.relevantCRMs.map(renderPlatformRow)}
                </div>
              )}
              {!commsExpanded && (
                <button
                  className="inline-flex items-center justify-center gap-1.5 mt-5 min-w-[120px] py-2 px-4 text-[13px] font-semibold text-foreground bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle"
                  onClick={() => setCommsExpanded(true)}
                >
                  See more options
                </button>
              )}
              {commsExpanded && commsGrid.neededSpecialistCats.map(cat => {
                const platforms = Object.entries(INTEGRATION_CATALOG)
                  .filter(([name, v]) => v.category === cat && !connectedPlatforms.includes(name))
                  .map(([name]) => name);
                if (platforms.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-1.5" style={{ marginTop: '28px' }}>{cat}</div>
                    <div className="grid grid-cols-2 gap-0">
                      {platforms.map(renderPlatformRow)}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {!allFulfilled && !allUnfulfilled && (
            <>
              {commsGrid.relevantCRMs.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-1.5" style={commsGrid.connectedComms.length === 0 ? { marginTop: 0 } : { marginTop: '28px' }}>Platforms</div>
                  <div className="grid grid-cols-2 gap-0">
                    {commsGrid.relevantCRMs.map(renderPlatformRow)}
                  </div>
                </>
              )}
              {commsGrid.neededSpecialistCats.map(cat => {
                const platforms = Object.entries(INTEGRATION_CATALOG)
                  .filter(([name, v]) => v.category === cat && !connectedPlatforms.includes(name))
                  .map(([name]) => name);
                if (platforms.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-1.5" style={{ marginTop: '28px' }}>{cat}</div>
                    <div className="grid grid-cols-2 gap-0">
                      {platforms.map(renderPlatformRow)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      );
    } else if (sectionId === 'data') {
      const tier1Groups = [
        { label: 'Payment Platforms', categories: ['Commerce'] },
        { label: 'Data Pipelines', categories: ['EventStream', 'ReverseETL'] },
      ];
      const customCategories = ['Webhooks', 'DevAPI', 'EnterpriseBatch'];

      gridContent = (
        <div>
          <div className="grid grid-cols-2 gap-0">
            {dataGrid.connectedData.map(renderConnectedPlatformRow)}
          </div>
          {!dataGrid.fulfilled && (
            <>
              {tier1Groups.map((group, i) => {
                const platforms = Object.entries(INTEGRATION_CATALOG)
                  .filter(([_, v]) => group.categories.includes(v.category))
                  .map(([name]) => name)
                  .filter(name => !connectedPlatforms.includes(name));
                return platforms.length > 0 && (
                  <div key={group.label}>
                    <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-1.5" style={{ marginTop: i === 0 && dataGrid.connectedData.length === 0 ? '0' : '28px' }}>
                      {group.label}
                    </div>
                    <div className="grid grid-cols-2 gap-0">
                      {platforms.map(renderPlatformRow)}
                    </div>
                  </div>
                );
              })}
              <div>
                <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-1.5" style={{ marginTop: '28px' }}>Custom Integration</div>
                <div className="mt-2 flex flex-col gap-2">
                  {['Inbound Webhooks', 'REST API', 'Secure File Drop'].map(name => {
                    const meta = CUSTOM_INTEGRATION_META[name] || { displayName: name, desc: '', recommended: false };
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-3 py-3.5 px-4 border border-border rounded-md cursor-pointer transition-all duration-150 ease-out bg-white hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
                        onClick={() => showModal(name)}
                      >
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                          <PlatformSVG name={name} size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground leading-[1.3]">
                            {meta.displayName}
                            {meta.recommended && <span className="inline-flex items-center ml-2 px-2 py-px text-[11px] font-semibold text-green-600 bg-green-50 rounded-full tracking-[0.01em] align-middle">Recommended</span>}
                          </div>
                          <div className="text-xs text-foreground-faint leading-[1.4] mt-0.5">{meta.desc}</div>
                        </div>
                        <svg className="text-gray-300 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      );
    } else {
      const connectedInArea = connectedPlatforms.filter(name => {
        const p = INTEGRATION_CATALOG[name];
        return p && area.categories.includes(p.category);
      });
      const allFulfilled = area.capabilities.every(cap =>
        fulfilledCapabilities.some(c => c.key === cap)
      );

      if (!allFulfilled) {
        const available = Object.entries(INTEGRATION_CATALOG)
          .filter(([_, v]) => area.categories.includes(v.category))
          .map(([name]) => name)
          .filter(name => !connectedPlatforms.includes(name));

        gridContent = (
          <div className="grid grid-cols-2 gap-0">
            {connectedInArea.map(renderConnectedPlatformRow)}
            {available.map(renderPlatformRow)}
          </div>
        );
      } else {
        gridContent = (
          <div className="grid grid-cols-2 gap-0">
            {connectedInArea.map(renderConnectedPlatformRow)}
          </div>
        );
      }
    }

    return gridContent;
  };

  const renderConnectedPlatformRow = (name) => {
    const platform = INTEGRATION_CATALOG[name];
    const isPending = platform?.modalType && ['webhooks', 'api', 'filedrop'].includes(platform.modalType);
    const grantedCaps = fulfilledCapabilities.filter(c => c.source === name);
    // Deduplicate directions for the scope line
    const directions = [...new Set(grantedCaps.map(c => getCapDirection(c.key)))];
    const scopeLabels = grantedCaps.map(c => {
      const desc = platform?.scopeDescriptions?.[c.key] || c.key;
      return desc;
    });

    return (
      <div key={name} className="flex w-full cursor-default opacity-100 col-span-full flex-wrap py-3 items-center gap-2">
        <div className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
          <PlatformSVG name={name} size={20} />
        </div>
        <span className="text-[15px] font-semibold text-foreground">{name}</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 ml-auto ${isPending ? 'text-warn' : ''}">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 ${isPending ? 'text-warn' : ''}" />
          {isPending ? 'Pending' : 'Connected'}
        </span>
        <span
          className="text-foreground-faint cursor-pointer opacity-0 transition-all duration-150 ease-out shrink-0 ml-2 group-hover:opacity-100 hover:text-danger"
          onClick={() => disconnectPlatform(name)}
          title="Disconnect"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
        {scopeLabels.length > 0 && (
          <div className="w-full pl-[30px] text-xs text-foreground-faint leading-[1.4]">
            {directions.map(dir => (
              <span key={dir} className="inline-flex items-center px-1.5 text-[11px] font-bold tracking-[0.04em] rounded-[3px] align-middle mr-1 bg-gray-100 text-foreground-faint leading-[1.6]">{dir}</span>
            ))}
            {scopeLabels.join(' · ')}
          </div>
        )}
      </div>
    );
  };

  const renderPlatformRow = (name) => {
    return (
      <div key={name} className="inline-flex items-center gap-2 py-3 cursor-pointer w-fit transition-opacity duration-150 ease-out hover:opacity-55 active:opacity-40" onClick={() => showModal(name)}>
        <div className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
          <PlatformSVG name={name} size={20} />
        </div>
        <span className="text-[15px] font-semibold text-foreground">{name}</span>
        <svg className="text-gray-300 shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  // Helper to render collapsed section summary — shows connected platform rows
  const renderCollapsedSectionSummary = (sectionId) => {
    const section = SETUP_AREAS[sectionId];
    const connectedInSection = connectedPlatforms.filter(name => {
      const p = INTEGRATION_CATALOG[name];
      return p && section.categories.includes(p.category);
    });
    return connectedInSection.map(renderConnectedPlatformRow);
  };

  // Helper to toggle section collapse
  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1100px] mx-auto w-full px-12">
      <header className="py-2.5 mb-6">
        <Logo variant="mark" onClick={onHome} />
      </header>

      <div className="flex-1 grid grid-cols-[280px_1fr] min-h-0">
        {/* Sidebar — scroll-spy nav */}
        <div className="flex flex-col py-4 pr-5 pb-16 overflow-y-auto overflow-x-hidden border-r border-border-light sticky top-0 h-screen self-start">
          <div className="text-sm font-medium text-foreground-muted mb-4">
            Integration Setup
          </div>
          <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint pt-4 pb-1.5">
            Required
          </div>
          {Object.entries(SETUP_AREAS)
            .filter(([_, a]) => a.required)
            .map(([id, a]) => {
              const isFulfilled = isSectionFulfilled(id);
              const isActive = activeSetupArea === id;
              return (
                <div
                  key={id}
                  className={cn('flex items-center gap-2.5 py-2.5 px-3 rounded-sm cursor-pointer transition-all duration-150 ease-out mb-0.5 border-l-[3px] border-l-transparent hover:bg-gray-50', isActive && 'bg-gray-50 border-l-brand')}
                  onClick={() => sectionRefs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <span className={cn('text-sm font-medium', isActive ? 'text-brand' : 'text-foreground-muted')}>{a.title}</span>
                  {isFulfilled && (
                    <svg className="ml-auto text-brand shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.5 3.5 6.5-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint pt-4 pb-1.5">Enhance your program</div>
          {Object.entries(SETUP_AREAS)
            .filter(([_, a]) => !a.required)
            .map(([id, a]) => {
              const isFulfilled = isSectionFulfilled(id);
              const isActive = activeSetupArea === id;
              return (
                <div
                  key={id}
                  className={cn('flex items-center gap-2.5 py-2.5 px-3 rounded-sm cursor-pointer transition-all duration-150 ease-out mb-0.5 border-l-[3px] border-l-transparent hover:bg-gray-50', isActive && 'bg-gray-50 border-l-brand')}
                  onClick={() => sectionRefs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <span className={cn('text-sm font-medium', isActive ? 'text-brand' : 'text-foreground-muted')}>{a.title}</span>
                  {isFulfilled && (
                    <svg className="ml-auto text-brand shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.5 3.5 6.5-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
        </div>

        {/* Right Content — scrollable with all sections */}
        <div className="py-8 px-12 pb-16 overflow-y-auto" ref={rightColRef}>
          {Object.entries(SETUP_AREAS).map(([sectionId, section]) => {
            const isFulfilled = isSectionFulfilled(sectionId);
            const isCollapsed = collapsedSections.has(sectionId);
            const isFadingOut = fadingOutSections.has(sectionId);

            return (
              <div
                key={sectionId}
                ref={sectionRefs[sectionId]}
                data-section={sectionId}
                className="pb-10 mb-10 border-b border-border-light scroll-mt-6 ${isCollapsed ? 'pb-4 mb-6' : ''}"
              >
                {/* Section Header — collapsed: clickable to expand */}
                {isCollapsed && isFulfilled ? (
                  <>
                    <div
                      className="flex items-center gap-3 cursor-pointer py-4 transition-opacity duration-150 ease-out hover:opacity-70"
                      onClick={() => toggleSectionCollapse(sectionId)}
                    >
                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="var(--color-green-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-base font-semibold text-foreground flex-1 leading-[1.3]">
                        {section.question}
                        <span className="inline-flex items-center px-1.5 text-[11px] font-bold tracking-[0.04em] rounded-[3px] align-middle mr-1 bg-gray-100 text-foreground-faint leading-[1.6]" style={{ marginLeft: '8px', verticalAlign: 'middle' }}>{getSectionDirection(sectionId)}</span>
                      </div>
                      <svg
                        className="shrink-0 text-foreground-faint transition-transform duration-150 ease-out"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path d="M12 6l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="mb-4">
                      {renderCollapsedSectionSummary(sectionId)}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Expanded: question goes directly into content, no separate header title */}
                    {isFulfilled && (
                      <div
                        className="flex items-center gap-3 cursor-pointer py-4 transition-opacity duration-150 ease-out hover:opacity-70"
                        onClick={() => toggleSectionCollapse(sectionId)}
                      >
                        <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="var(--color-green-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="text-base font-semibold text-foreground flex-1 leading-[1.3]">
                          {section.question}
                          <span className="inline-flex items-center px-1.5 text-[11px] font-bold tracking-[0.04em] rounded-[3px] align-middle mr-1 bg-gray-100 text-foreground-faint leading-[1.6]" style={{ marginLeft: '8px', verticalAlign: 'middle' }}>{getSectionDirection(sectionId)}</span>
                        </div>
                        <svg
                          className="shrink-0 text-foreground-faint transition-transform duration-150 ease-out rotate-180"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path d="M12 6l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className="opacity-100 translate-y-0 transition-all duration-[350ms] ease-out ${isFadingOut ? 'opacity-0 -translate-y-2' : ''}">
                      {(() => {
                        const hasConnections = connectedPlatforms.some(name => {
                          const p = INTEGRATION_CATALOG[name];
                          return p && section.categories.includes(p.category);
                        });
                        return (
                          <>
                            {!isFulfilled && (
                              <div className="text-[32px] font-semibold text-foreground leading-[1.3] mb-2 tracking-tight">
                                {section.question}
                                <span className="inline-flex items-center px-1.5 text-[11px] font-bold tracking-[0.04em] rounded-[3px] align-middle mr-1 bg-gray-100 text-foreground-faint leading-[1.6]" style={{ marginLeft: '12px', verticalAlign: 'middle' }}>{getSectionDirection(sectionId)}</span>
                              </div>
                            )}
                            {!hasConnections && (
                              <div className="text-lg text-foreground-muted font-normal mb-8 leading-normal">{section.sub}</div>
                            )}
                          </>
                        );
                      })()}
                      {renderSectionContent(sectionId)}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Finish Setup Button */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <CTAButton
              variant="brand"
              onClick={() => onNext?.()}
              disabled={!allRequiredFulfilled}
            >
              Finish Setup
            </CTAButton>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <Modal onClose={closeModal} wide={['webhooks', 'api', 'filedrop'].includes(modal.type)}>

            {modal.type === 'validating' && (
              <div style={{ textAlign: 'center' }}>
                <div className="w-8 h-8 border-[3px] border-border border-t-foreground rounded-full animate-spin mx-auto mb-4" />
                <div className="text-lg font-semibold text-foreground mb-2">Verifying permissions...</div>
                <div className="text-sm text-foreground-muted">Checking scopes for {modal.platform}</div>
              </div>
            )}

            {modal.type === 'preauth' && (
              <>
                <Modal.Header
                  icon={<PlatformSVG name={modal.platform} size={32} />}
                  title={`Connecting ${modal.platform}`}
                  subtitle="Permissions required for this integration:"
                />
                <ul className="list-none mb-5 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:py-2 [&_li]:text-sm [&_li]:text-foreground-muted [&_li]:leading-[1.4] [&_li+li]:border-t [&_li+li]:border-border-light">
                  {INTEGRATION_CATALOG[modal.platform].capabilities.map(cap => {
                    const desc = INTEGRATION_CATALOG[modal.platform].scopeDescriptions[cap] || cap;
                    const dir = getCapDirection(cap);
                    return (
                      <li key={cap}>
                        <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span><span className="inline-flex items-center px-1.5 text-[11px] font-bold tracking-[0.04em] rounded-[3px] align-middle mr-1 bg-gray-100 text-foreground-faint leading-[1.6]">{dir}</span> {desc}</span>
                      </li>
                    );
                  })}
                </ul>
                <Modal.Footer securityText="Encrypted and secure. Vincor only requests the minimum data required to run your referral strategy.">
                  <button className="w-full py-3.5 text-base font-semibold rounded-md bg-surface text-brand border-2 border-brand cursor-pointer transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md" onClick={() => handlePlatformConnect(modal.platform)}>
                    Connect {modal.platform}
                  </button>
                </Modal.Footer>
              </>
            )}

            {modal.type === 'webhooks' && (
              <>
                <Modal.Header
                  icon={<PlatformSVG name={modal.platform} size={32} />}
                  title="Configure Webhooks"
                  subtitle="Point your system to this secure endpoint to stream real-time events."
                />
                <div style={{ marginBottom: '16px' }}>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-2">Webhook URL</div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-sm py-2.5 px-3">
                    <code className="flex-1 text-[13px] text-foreground font-mono break-all leading-[1.4]">https://api.vincor.ai/v1/webhooks/tx_9982x...</code>
                    <button className="shrink-0 py-1 px-2.5 text-[11px] font-semibold text-foreground-muted bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:text-foreground" onClick={(e) => handleCopy('https://api.vincor.ai/v1/webhooks/tx_9982x...', e)}>Copy Webhook URL</button>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-2">Expected Payload</div>
                  <ul className="list-none mb-5 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:py-2 [&_li]:text-sm [&_li]:text-foreground-muted [&_li]:leading-[1.4] [&_li+li]:border-t [&_li+li]:border-border-light">
                    <li>
                      <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>transaction_id — Unique identifier</span>
                    </li>
                    <li>
                      <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>timestamp — ISO 8601 format</span>
                    </li>
                    <li>
                      <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>amount — Transaction total + currency</span>
                    </li>
                  </ul>
                </div>
                <hr className="border-0 border-t border-border my-5" />
                <div className="bg-gray-50 rounded-md p-4 mt-1">
                  <div className="text-[13px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="text-warn">✦</span> Need help formatting the payload?
                  </div>
                  <div className="text-xs text-foreground-faint mb-3 leading-[1.4]">Paste your system's standard webhook payload to automatically map the fields.</div>
                  <textarea
                    className="w-full min-h-[80px] py-2.5 px-3 text-[13px] font-mono text-foreground bg-gray-50 border border-border rounded-sm resize-y leading-normal transition-colors duration-150 ease-out focus:outline-none focus:border-gray-400 placeholder:text-foreground-faint placeholder:font-sans placeholder:not-italic placeholder:text-xs"
                    placeholder='{"event":"charge.succeeded","data":{"id":"ch_1N","amount":4999,"currency":"usd","customer":"cus_9s6"}}'
                    value={agenticInput}
                    onChange={e => setAgenticInput(e.target.value)}
                  />
                  <button className="inline-flex items-center justify-center gap-1.5 mt-2.5 min-w-[120px] py-2 px-4 text-[13px] font-semibold text-foreground bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleGenerateWebhookMapping}>
                    Map Fields
                  </button>
                  {agenticOutput && <div className="w-full mt-3 py-3.5 px-4 text-xs font-mono text-gray-100 bg-gray-900 rounded-sm overflow-x-auto leading-[1.6] whitespace-pre animate-fade-in">{agenticOutput}</div>}
                </div>
                <Modal.Footer securityText="Encrypted and secure. Share this endpoint with your engineering team.">
                  <button className="w-full py-3.5 text-base font-semibold rounded-md bg-surface text-brand border-2 border-brand cursor-pointer transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md" onClick={() => handlePlatformConnect(modal.platform)}>
                    Mark as Configured
                  </button>
                </Modal.Footer>
              </>
            )}

            {modal.type === 'api' && (
              <>
                <Modal.Header
                  icon={<PlatformSVG name={modal.platform} size={32} />}
                  title="Developer API Keys"
                  subtitle="Store this key securely. Do not expose it in client-side code."
                />
                <div style={{ marginBottom: '16px' }}>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-2">Secret Key</div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-sm py-2.5 px-3">
                    <code className="flex-1 text-[13px] text-foreground font-mono break-all leading-[1.4]">vincor_live_*******************</code>
                    <button className="shrink-0 py-1 px-2.5 text-[11px] font-semibold text-foreground-muted bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:text-foreground" onClick={(e) => handleCopy('vincor_live_sk_7f8a3b2c1d9e4f6a', e)}>Reveal & Copy Key</button>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-2">API Endpoint</div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-sm py-2.5 px-3">
                    <code className="flex-1 text-[13px] text-foreground font-mono break-all leading-[1.4]">POST https://api.vincor.ai/v1/transactions</code>
                    <button className="shrink-0 py-1 px-2.5 text-[11px] font-semibold text-foreground-muted bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:text-foreground" onClick={(e) => handleCopy('POST https://api.vincor.ai/v1/transactions', e)}>Copy</button>
                  </div>
                </div>
                <hr className="border-0 border-t border-border my-5" />
                <div className="bg-gray-50 rounded-md p-4 mt-1">
                  <div className="text-[13px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="text-warn">✦</span> Don't want to read the docs?
                  </div>
                  <div className="text-xs text-foreground-faint mb-3 leading-[1.4]">Paste a sample row from your database to instantly generate a ready-to-run integration script.</div>
                  <textarea
                    className="w-full min-h-[80px] py-2.5 px-3 text-[13px] font-mono text-foreground bg-gray-50 border border-border rounded-sm resize-y leading-normal transition-colors duration-150 ease-out focus:outline-none focus:border-gray-400 placeholder:text-foreground-faint placeholder:font-sans placeholder:not-italic placeholder:text-xs"
                    placeholder='{"user_account_id":"usr_482","usd_amount":49.99,"event_type":"purchase","created_at":"2026-03-15T14:30:00Z"}'
                    value={agenticInput}
                    onChange={e => setAgenticInput(e.target.value)}
                  />
                  <button className="inline-flex items-center justify-center gap-1.5 mt-2.5 min-w-[120px] py-2 px-4 text-[13px] font-semibold text-foreground bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleGenerateAPIScript}>
                    Generate Script
                  </button>
                  {agenticOutput && <div className="w-full mt-3 py-3.5 px-4 text-xs font-mono text-gray-100 bg-gray-900 rounded-sm overflow-x-auto leading-[1.6] whitespace-pre animate-fade-in">{agenticOutput}</div>}
                </div>
                <Modal.Footer securityText="Encrypted and secure. Share these credentials with your engineering team.">
                  <button className="w-full py-3.5 text-base font-semibold rounded-md bg-surface text-brand border-2 border-brand cursor-pointer transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md" onClick={() => handlePlatformConnect(modal.platform)}>
                    Mark as Configured
                  </button>
                </Modal.Footer>
              </>
            )}

            {modal.type === 'filedrop' && (
              <>
                <Modal.Header
                  icon={<PlatformSVG name={modal.platform} size={32} />}
                  title="Secure Bucket Provisioned"
                  subtitle="Vincor has provisioned an isolated AWS S3 bucket for your daily batch uploads."
                />
                <div style={{ marginBottom: '16px' }}>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-2">S3 Bucket ARN</div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-sm py-2.5 px-3">
                    <code className="flex-1 text-[13px] text-foreground font-mono break-all leading-[1.4]">arn:aws:s3:::vincor-client-drop-8821</code>
                    <button className="shrink-0 py-1 px-2.5 text-[11px] font-semibold text-foreground-muted bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:text-foreground" onClick={(e) => handleCopy('arn:aws:s3:::vincor-client-drop-8821', e)}>Copy Credentials</button>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div className="text-[11px] font-semibold tracking-[0.05em] uppercase text-foreground-faint mb-2">Accepted Formats</div>
                  <ul className="list-none mb-5 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:py-2 [&_li]:text-sm [&_li]:text-foreground-muted [&_li]:leading-[1.4] [&_li+li]:border-t [&_li+li]:border-border-light">
                    <li>
                      <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>CSV, JSON, or Parquet</span>
                    </li>
                    <li>
                      <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Max 5 GB per upload</span>
                    </li>
                    <li>
                      <div className="w-[18px] h-[18px] rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-px">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="var(--color-green-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span>Processed daily at 00:00 UTC</span>
                    </li>
                  </ul>
                </div>
                <hr className="border-0 border-t border-border my-5" />
                <div className="bg-gray-50 rounded-md p-4 mt-1">
                  <div className="text-[13px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <span className="text-warn">✦</span> Upload a sample file
                  </div>
                  <div className="text-xs text-foreground-faint mb-3 leading-[1.4]">Paste a few rows from your export to auto-detect your schema and map columns.</div>
                  <textarea
                    className="w-full min-h-[80px] py-2.5 px-3 text-[13px] font-mono text-foreground bg-gray-50 border border-border rounded-sm resize-y leading-normal transition-colors duration-150 ease-out focus:outline-none focus:border-gray-400 placeholder:text-foreground-faint placeholder:font-sans placeholder:not-italic placeholder:text-xs"
                    placeholder='user_id,order_id,amount,currency,created_at
usr_482,ord_1001,49.99,USD,2026-03-15
usr_117,ord_1002,129.00,USD,2026-03-15'
                    value={agenticInput}
                    onChange={e => setAgenticInput(e.target.value)}
                  />
                  <button className="inline-flex items-center justify-center gap-1.5 mt-2.5 min-w-[120px] py-2 px-4 text-[13px] font-semibold text-foreground bg-surface border border-border rounded-sm cursor-pointer transition-all duration-150 ease-out hover:bg-accent-subtle hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleGenerateFileMapping}>
                    Detect Schema
                  </button>
                  {agenticOutput && <div className="w-full mt-3 py-3.5 px-4 text-xs font-mono text-gray-100 bg-gray-900 rounded-sm overflow-x-auto leading-[1.6] whitespace-pre animate-fade-in">{agenticOutput}</div>}
                </div>
                <Modal.Footer securityText="Encrypted and secure. Share bucket details with your data or infrastructure team.">
                  <button className="w-full py-3.5 text-base font-semibold rounded-md bg-surface text-brand border-2 border-brand cursor-pointer transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md" onClick={() => handlePlatformConnect(modal.platform)}>
                    Mark as Configured
                  </button>
                </Modal.Footer>
              </>
            )}
        </Modal>
      )}
      {/* Dev Toolbar — jumpToState presets */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', gap: '8px', padding: '10px 16px',
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {[
            { label: 'Empty', preset: 'empty' },
            { label: 'After Comms', preset: 'after_comms' },
            { label: 'After Data', preset: 'after_data' },
            { label: '+ Support', preset: 'optional_support' },
            { label: 'Complete', preset: 'complete' },
            { label: 'Multi', preset: 'multi' },
          ].map(({ label, preset }) => (
            <button
              key={preset}
              onClick={() => {
                // Reset all state
                setFulfilledCapabilities([]);
                setConnectedPlatforms([]);
                setModal(null);
                setCommsExpanded(false);
                setAgenticInput('');
                setAgenticOutput('');
                setActiveSetupArea(null);

                // Apply preset connections after a tick so reset takes effect
                setTimeout(() => {
                  const connect = (name) => {
                    const platform = INTEGRATION_CATALOG[name];
                    if (!platform) return;
                    const caps = platform.capabilities.map(cap => ({ key: cap, source: name }));
                    setFulfilledCapabilities(prev => [...prev, ...caps.filter(c => !prev.some(p => p.key === c.key && p.source === c.source))]);
                    setConnectedPlatforms(prev => prev.includes(name) ? prev : [...prev, name]);
                  };
                  switch (preset) {
                    case 'empty': break;
                    case 'after_comms': connect('Braze'); break;
                    case 'after_data': connect('Braze'); connect('Shopify'); break;
                    case 'optional_support': connect('Braze'); connect('Shopify'); connect('Zendesk'); break;
                    case 'complete': connect('Braze'); connect('Shopify'); connect('Zendesk'); connect('SurveyMonkey'); break;
                    case 'multi': connect('Braze'); connect('SendGrid'); connect('Shopify'); connect('Inbound Webhooks'); break;
                  }
                }, 0);
              }}
              style={{
                padding: '5px 12px', fontSize: '11px', fontWeight: 600,
                background: 'rgba(255,255,255,0.12)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
