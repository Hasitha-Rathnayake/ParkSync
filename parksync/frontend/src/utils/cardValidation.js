// Simulated card checks only — no gateway, no storage of full card numbers.

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Luhn algorithm — rejects random digit strings */
export function luhnCheck(cardNumber) {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectBrand(cardNumber) {
  const d = onlyDigits(cardNumber);
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
}

/** expiry as MM/YY or MMYY */
export function isExpiryValid(expiry) {
  const raw = String(expiry || '').replace(/\s/g, '');
  const m = raw.match(/^(\d{2})\s*\/?\s*(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expEnd = new Date(year, month, 0, 23, 59, 59); // last day of month
  return expEnd >= now;
}

export function isCvvValid(cvv, brand) {
  const d = onlyDigits(cvv);
  if (brand === 'Amex') return d.length === 4;
  return d.length === 3;
}

export function isCardholderValid(name) {
  const n = String(name || '').trim();
  if (n.length < 2 || n.length > 60) return false;
  return /^[A-Za-z][A-Za-z .'-]*$/.test(n);
}

/**
 * Returns error message or null if OK.
 * Card fields only required when method === 'CARD'.
 */
export function validatePaymentForm({ method, cardNumber, expiry, cvv, cardholder }) {
  if (!method) return 'Select a payment method.';
  if (method === 'PAYPAL' || method === 'WALLET') return null;

  if (method !== 'CARD') return 'Unsupported payment method.';

  const digits = onlyDigits(cardNumber);
  if (!digits) return 'Enter a card number.';
  if (!luhnCheck(digits)) return 'Invalid card number. Use a valid test card (e.g. 4111111111111111).';

  const brand = detectBrand(digits);
  if (!isExpiryValid(expiry)) return 'Enter a valid expiry (MM/YY) that is not expired.';
  if (!isCvvValid(cvv, brand)) {
    return brand === 'Amex' ? 'CVV must be 4 digits for Amex.' : 'CVV must be 3 digits.';
  }
  if (!isCardholderValid(cardholder)) return 'Enter the name on the card (letters only).';

  return null;
}

export function formatCardInput(value) {
  const d = onlyDigits(value).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiryInput(value) {
  const d = onlyDigits(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
