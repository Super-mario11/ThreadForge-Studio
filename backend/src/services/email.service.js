import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendOrderConfirmationEmail = async ({ to, orderId, total }) => {
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `ThreadForge order confirmed #${orderId}`,
    html: `<p>Your order has been confirmed.</p><p>Total: $${total.toFixed(2)}</p>`
  });
};
