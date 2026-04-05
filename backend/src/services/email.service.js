import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const formatCurrency = (value) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(safeValue);
};

export const sendOrderConfirmationEmail = async ({ to, trackingId, total }) => {
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `ThreadForge order confirmed ${trackingId}`,
    html: `<p>Your order has been confirmed.</p><p>Tracking ID: <strong>${trackingId}</strong></p><p>Total: ${formatCurrency(total)}</p>`
  });
};
