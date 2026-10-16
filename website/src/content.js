// All copy, links and image URLs live here.
// Values marked PLACEHOLDER must be replaced before launch.

export const BRAND = {
  name: 'ZOOOMIT',
  tagline: 'Groceries in minutes',
  businessName: '[PLACEHOLDER: legal business name]', // PLACEHOLDER
  supportEmail: 'support@example.com', // PLACEHOLDER
  address: '[PLACEHOLDER: registered business address]', // PLACEHOLDER
  lastUpdated: 'October 16, 2026',
};

export const STORE_LINKS = {
  playStore: '#play-store-link-placeholder', // PLACEHOLDER
  appStore: '#app-store-link-placeholder', // PLACEHOLDER
  // The QR code encodes this URL. PLACEHOLDER: set to the real download link.
  qrTarget: 'https://example.com/zooomit-app-link-placeholder',
};

// Free-to-use media from Pexels (https://www.pexels.com/license/).
const px = (id, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const MEDIA = {
  heroVideo: 'https://videos.pexels.com/video-files/5701054/5701054-hd_1920_1080_25fps.mp4',
  heroPoster: px(264537, 1600),
  fruits: px(1128678),
  veggies: px(1300972),
  tomatoes: px(1327838),
  mushrooms: px(1435904),
  market: px(264537),
  shelf: px(2733918),
  shopper: px(3962285),
  cart: px(5632402),
  bag: px(3737619),
  spices: px(4199098),
};

// PLACEHOLDER: sample figures, replace with real numbers before launch.
export const STATS = [
  { icon: 'cart', value: '10,000+', label: 'products' },
  { icon: 'pin', value: '50+', label: 'areas served' },
  { icon: 'bolt', value: '10 min', label: 'average delivery' },
];

export const CHIPS = [
  'Fruits',
  'Vegetables',
  'Dairy & Eggs',
  'Snacks',
  'Staples',
  'Household',
  'Offers',
  'Order for Someone Else',
];

export const CARDS = [
  { title: 'Fresh Produce', text: 'Fruits and vegetables picked for freshness.', img: 'fruits', tint: 'linear-gradient(160deg,#fff3c4,#ffe08a)' },
  { title: 'Daily Staples', text: 'Rice, atta, oil, dal and spices for your kitchen.', img: 'spices', tint: 'linear-gradient(160deg,#ffe6d5,#ffcba6)' },
  { title: 'Snacks & Drinks', text: 'Quick bites and drinks for any time of day.', img: 'bag', tint: 'linear-gradient(160deg,#e3f4dc,#bfe5b0)' },
  { title: 'Home Essentials', text: 'Cleaning, care and everyday household items.', img: 'cart', tint: 'linear-gradient(160deg,#dcecff,#b7d6fb)' },
];

export const FAQS = [
  { q: 'How fast is delivery?', a: 'Most orders in covered areas arrive within minutes. The delivery time shown in the app before you pay is the one to rely on.' },
  { q: 'Which payment methods can I use?', a: 'The app offers UPI, credit/debit card and cash on delivery.' },
  { q: 'Can I order for someone else?', a: 'Yes. Add the recipient name, phone number and address on the cart page and the order goes to them.' },
  { q: 'How do I delete my account?', a: 'Open the Delete Account page from the footer and follow the steps.' },
];
