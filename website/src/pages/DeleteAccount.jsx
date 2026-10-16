import { useDispatch, useSelector } from 'react-redux';
import { markPrepared, resetDeletion, setField } from '../store.js';
import { BRAND } from '../content.js';

export default function DeleteAccount() {
  const dispatch = useDispatch();
  const f = useSelector((s) => s.deletion);
  const valid = f.name.trim() && f.phone.trim() && f.confirmed;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    const body = [
      `Please delete my ${BRAND.name} account and associated data.`,
      '',
      `Name: ${f.name}`,
      `Phone number on the account: ${f.phone}`,
      `Email on the account: ${f.email || '-'}`,
      `Reason (optional): ${f.reason || '-'}`,
    ].join('\n');
    // No server is involved: this opens the visitor's email app.
    window.location.href = `mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(
      `${BRAND.name} account deletion request`
    )}&body=${encodeURIComponent(body)}`;
    dispatch(markPrepared());
  };

  const input = (field, label, props = {}) => (
    <label className="field">
      {label}
      <input value={f[field]} onChange={(e) => dispatch(setField({ field, value: e.target.value }))} {...props} />
    </label>
  );

  return (
    <div className="doc">
      <h1>Delete your account</h1>
      <p className="draft">Draft: the support email is a placeholder. Requests are handled by email until an in-app or server deletion flow is connected.</p>
      <h2>How it works</h2>
      <ol>
        <li>Fill in the form below with the details on your account.</li>
        <li>Your email app opens with a ready request. Send it from any address.</li>
        <li>We confirm the request and delete your account and personal data. [PLACEHOLDER: timeframe]</li>
      </ol>
      <h2>What gets deleted</h2>
      <p>Your profile, saved addresses, wishlist and cart. Records we must keep by law, such as order and tax records, are kept for the required period and then removed. [CONFIRM]</p>

      <form className="del-form" onSubmit={submit}>
        {input('name', 'Full name', { required: true })}
        {input('phone', 'Phone number on the account', { required: true, type: 'tel' })}
        {input('email', 'Email on the account (optional)', { type: 'email' })}
        <label className="field">
          Reason (optional)
          <textarea rows={3} value={f.reason} onChange={(e) => dispatch(setField({ field: 'reason', value: e.target.value }))} />
        </label>
        <label className="check">
          <input type="checkbox" checked={f.confirmed} onChange={(e) => dispatch(setField({ field: 'confirmed', value: e.target.checked }))} />
          I understand this deletes my account and cannot be undone.
        </label>
        <button className="btn" type="submit" disabled={!valid}>Prepare deletion email</button>
        {f.status === 'prepared' && (
          <p className="ok">
            Your email app should have opened. Nothing is deleted until you send that email and we confirm it. Nothing opened? Write to {BRAND.supportEmail}.{' '}
            <button type="button" className="link" onClick={() => dispatch(resetDeletion())}>Start over</button>
          </p>
        )}
      </form>
    </div>
  );
}
