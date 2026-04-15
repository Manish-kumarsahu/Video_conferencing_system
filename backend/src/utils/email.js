import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true" || false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"NexaMeet" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your NexaMeet Verification Code",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NexaMeet OTP</title>
</head>
<body style="margin:0;padding:0;background:#06061a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#06061a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;background:rgba(13,13,43,0.95);border:1px solid rgba(124,92,252,0.25);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c5cfc,#00d4ff);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">NexaMeet</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Secure Video Conferencing</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 8px;color:#e2e8f0;font-size:15px;">Hello,</p>
              <p style="margin:0 0 28px;color:#9ca3af;font-size:14px;line-height:1.6;">
                Use the verification code below to complete your sign-up. This code expires in <strong style="color:#a78bfa;">5 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="text-align:center;margin:0 0 28px;">
                <div style="
                  display:inline-block;
                  background:linear-gradient(135deg,rgba(124,92,252,0.15),rgba(0,212,255,0.1));
                  border:2px solid rgba(124,92,252,0.4);
                  border-radius:12px;
                  padding:20px 40px;
                ">
                  <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#a78bfa;">${otp}</span>
                </div>
              </div>

              <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.<br/>
                Do not share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="margin:0;color:#4b5563;font-size:11px;">© ${new Date().getFullYear()} NexaMeet. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
  };

  await transporter.sendMail(mailOptions);
};
