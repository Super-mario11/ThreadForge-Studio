const REMOTE_INDIAN_STATES = new Set([
  'andaman and nicobar islands',
  'arunachal pradesh',
  'jammu and kashmir',
  'ladakh',
  'lakshadweep',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'sikkim',
  'tripura'
]);

const METRO_PIN_PREFIXES = new Set(['11', '40', '56', '60', '70']);

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const toMoney = (value) => Number(value.toFixed(2));

export const calculateCartTotals = (items, shippingAddress = {}) => {
  const subtotal = toMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const country = normalize(shippingAddress.country);
  const state = normalize(shippingAddress.state);
  const postalCode = normalize(shippingAddress.postalCode).replace(/\s+/g, '');

  const isIndia = country === 'india' || country === 'in' || !country;
  const isRemoteRegion = isIndia && REMOTE_INDIAN_STATES.has(state);
  const isMetroPincode = isIndia && postalCode.length >= 2 && METRO_PIN_PREFIXES.has(postalCode.slice(0, 2));

  const freeShippingThreshold = isIndia ? 1499 : 5000;
  const baseShipping = isIndia ? 79 : 499;
  const remoteSurcharge = isRemoteRegion ? 60 : 0;
  const metroDiscount = isMetroPincode ? 20 : 0;

  let shipping =
    subtotal >= freeShippingThreshold
      ? 0
      : Math.max(39, baseShipping + remoteSurcharge - metroDiscount);

  const taxRate = isIndia ? 0.05 : 0;
  const tax = toMoney(subtotal * taxRate);
  shipping = toMoney(shipping);

  const total = toMoney(subtotal + shipping + tax);

  return {
    subtotal,
    shipping,
    tax,
    total,
    taxRate,
    meta: {
      currency: 'INR',
      pricingZone: isIndia ? 'india' : 'international',
      freeShippingThreshold
    }
  };
};
