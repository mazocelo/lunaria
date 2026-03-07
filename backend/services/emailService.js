import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarEmailResetSenha(email, nome, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Lunaria" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Lunaria - Redefinição de Senha',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e1b4b; color: #e2e8f0; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #c084fc; margin: 0;">Lunaria</h1>
          <p style="color: #94a3b8; font-size: 14px;">The Fable Forge</p>
        </div>

        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Redefinir Senha
          </a>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">
          Este link expira em <strong>1 hora</strong>. Se você não solicitou esta redefinição, ignore este email.
        </p>

        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          © 2024 Lunaria - The Fable Forge
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
