import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const formatCurrency = (value) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(safeValue);
};

export const sendOrderConfirmationEmail = async ({ to, orderId, total }) => {
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `ThreadForge order confirmed #${orderId}`,
    html: `<p>Your order has been confirmed.</p><p>Total: ${formatCurrency(total)}</p>`
  });
};
