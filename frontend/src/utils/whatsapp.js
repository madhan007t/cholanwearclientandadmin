// CHOLAN WEAR order desk: +91 7200825741 (wa.me wants digits only, with country code).
export const ORDER_WHATSAPP = '917200825741';

const rupees = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

/** Plain-text order message, built from the SAVED order returned by the server (never from the cart). */
export function buildOrderMessage(order) {
  const { customer: c, shippingAddress: a } = order;
  const lines = [
    'Hello CHOLAN WEAR 👋',
    '',
    'I would like to confirm my order.',
    '',
    `Order ID: ${order.orderNumber}`,
    '',
    'CUSTOMER DETAILS',
    `Name: ${c.name}`,
    `Mobile: ${c.phone}`,
    c.alternatePhone ? `Alternate Mobile: ${c.alternatePhone}` : null,
    '',
    'DELIVERY ADDRESS',
    `Address: ${[a.addressLine1, a.addressLine2].filter(Boolean).join(', ')}`,
    a.landmark ? `Landmark: ${a.landmark}` : null,
    `City: ${a.city}`,
    `District: ${a.district}`,
    `State: ${a.state}`,
    `Pincode: ${a.pincode}`,
    '',
    'ORDER DETAILS',
  ];

  order.items.forEach((i, idx) => {
    lines.push(
      '',
      `${idx + 1}. ${i.productName}`,
      i.size ? `Size: ${i.size}` : null,
      i.color ? `Color: ${i.color}` : null,
      `Quantity: ${i.quantity}`,
      i.quantity > 1 ? `Price: ${rupees(i.unitPrice)} x ${i.quantity} = ${rupees(i.total)}` : `Price: ${rupees(i.total)}`
    );
  });

  lines.push(
    '',
    'ORDER TOTAL',
    '',
    `Subtotal: ${rupees(order.subtotal)}`,
    `Delivery Charge: ${order.deliveryCharge === 0 ? 'Free' : rupees(order.deliveryCharge)}`,
    `Grand Total: ${rupees(order.totalAmount)}`,
    '',
    'Please confirm my CHOLAN WEAR order.',
    '',
    'Thank you.'
  );

  // Drop skipped optional lines (false / '' from the && guards) but keep the intentional blank lines.
  return lines.filter((l) => l === '' || Boolean(l)).join('\n');
}

export const buildWhatsAppUrl = (order) => `https://wa.me/${ORDER_WHATSAPP}?text=${encodeURIComponent(buildOrderMessage(order))}`;

/**
 * Popup blockers reject window.open() once an await has happened, so the tab is reserved
 * synchronously inside the click handler and pointed at WhatsApp after the order is saved.
 * Returns null when the browser blocks it - callers must offer a manual link instead.
 */
export function reserveTab() {
  try {
    const win = window.open('', '_blank');
    if (!win) return null;
    win.document.title = 'CHOLAN WEAR';
    win.document.body.style.cssText = 'margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;font:14px system-ui,sans-serif';
    win.document.body.textContent = 'Preparing your WhatsApp message…';
    return win;
  } catch {
    return null;
  }
}

/** Sends a reserved tab to `url`. Returns false if the tab is gone (closed by the user / blocked). */
export function sendTabTo(win, url) {
  try {
    if (!win || win.closed) return false;
    win.opener = null;
    win.location.replace(url);
    return true;
  } catch {
    return false;
  }
}

export function closeTab(win) {
  try { win?.close(); } catch { /* already gone */ }
}
