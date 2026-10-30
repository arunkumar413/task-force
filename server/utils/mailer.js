const nodemailer = require("nodemailer");

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_URL ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

function createTransport() {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

async function sendMail({ to, subject, text }) {
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@localhost";
  const transporter = createTransport();

  if (!transporter) {
    console.log(`[mailer] SMTP is not configured. Email to ${to}`);
    console.log(`[mailer] ${subject}`);
    console.log(`[mailer] ${text}`);
    return { delivered: false };
  }

  await transporter.sendMail({ from, to, subject, text });
  return { delivered: true };
}

module.exports = {
  smtpConfigured,
  sendMail,
};

