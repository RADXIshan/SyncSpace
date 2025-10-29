const generateForgotPasswordEmail = (name, resetLink) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Reset Your Password</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0f0d2a;width:100%;-webkit-text-size-adjust:none;">
    <center style="width:100%;background-color:#0f0d2a;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f0d2a;margin:0 auto;padding:0;width:100%;">
        <tr>
          <td align="center" style="padding:20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background-color:#12102d;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 24px rgba(0,0,0,0.3);">
              
              <!-- HEADER -->
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#8b5cf6 0%,#3b82f6 100%);padding:40px 20px;">
                  <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.3);">SyncSpace</h1>
                  <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Password Recovery</p>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td style="padding:35px 25px 40px 25px;text-align:center;background-color:#12102d;">
                  <h2 style="font-size:20px;font-weight:700;margin:0 0 18px;color:#c084fc;">Reset Your Password</h2>

                  <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85);margin:0 0 28px;">
                    Hi ${name || "there"},<br /><br />
                    We received a request to reset your password. Click the button below to create a new one.
                  </p>

                  <!-- RESET BUTTON -->
                  <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#3b82f6 100%);color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:24px;box-shadow:0 4px 12px rgba(59,130,246,0.4);">Reset Password</a>

                  <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:20px 0 0;">
                    This link will expire in <strong>15 minutes</strong> for security reasons.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="background-color:#0d0b26;padding:25px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.65);">
                    Didn’t request this? Your password is still safe. You can ignore this email or
                    <a href="#" style="color:#8b5cf6;text-decoration:none;font-weight:600;">contact support</a>.<br /><br />
                    © 2025 SyncSpace. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;
};

export default generateForgotPasswordEmail;
