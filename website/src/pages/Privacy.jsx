import { BRAND } from '../content.js';

const SECTIONS = [
  {
    h: '1. Who we are',
    p: [
      `${BRAND.name} is a grocery delivery app operated by ${BRAND.businessName} ("we", "us"). Registered address: ${BRAND.address}. You can reach us at ${BRAND.supportEmail}.`,
    ],
  },
  {
    h: '2. Information we collect',
    p: ['[PLACEHOLDER - confirm against the app before publishing] Depending on how you use the app, we may collect:'],
    ul: [
      'Account details such as your name and phone number or email.',
      'Delivery addresses, and the name, phone number and address of a recipient when you order for someone else.',
      'Order history, cart and wishlist contents, and coupons you use.',
      'Payment choice (UPI, card or cash on delivery). Card and UPI payments are processed by our payment provider; we do not store full card numbers. [CONFIRM]',
      'Device and usage information, and approximate or precise location if you allow it, to show whether we can deliver to you. [CONFIRM]',
    ],
  },
  {
    h: '3. How we use information',
    ul: [
      'To create your account, take and deliver your orders, and give you support.',
      'To process payments and prevent fraud.',
      'To improve the app and tell you about your orders.',
    ],
  },
  {
    h: '4. Sharing',
    p: [
      'We share information only as needed to run the service: with delivery partners (name, phone, address), payment providers, hosting and analytics providers, and when the law requires it. We do not sell your personal information. [CONFIRM]',
    ],
  },
  {
    h: '5. Retention',
    p: ['[PLACEHOLDER: retention period] We keep your information while your account is active. Some records, such as order and tax records, may be kept for as long as the law requires after you delete your account.'],
  },
  {
    h: '6. Your choices and account deletion',
    p: ['You can ask us to access, correct or delete your information. To delete your account and data, use the Delete Account page linked in the footer, or email us.'],
  },
  {
    h: '7. Security',
    p: ['We use reasonable technical and organisational measures to protect your information. No method of transmission or storage is completely secure.'],
  },
  {
    h: '8. Children',
    p: ['The app is not intended for children under 13 (or the age set by local law). [CONFIRM]'],
  },
  {
    h: '9. Changes to this policy',
    p: ['We may update this policy. The date at the top shows the latest version.'],
  },
  {
    h: '10. Contact',
    p: [`Questions about this policy: ${BRAND.supportEmail}.`],
  },
];

export default function Privacy() {
  return (
    <div className="doc">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: {BRAND.lastUpdated}</p>
      <p className="draft">Draft: text in [brackets] must be confirmed or replaced and the policy reviewed by the business owner before it is relied on.</p>
      {SECTIONS.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p && s.p.map((t) => <p key={t}>{t}</p>)}
          {s.ul && <ul>{s.ul.map((t) => <li key={t}>{t}</li>)}</ul>}
        </section>
      ))}
    </div>
  );
}
