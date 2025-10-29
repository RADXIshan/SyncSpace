const generateOtpEmail = (name, otpCode) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Your OTP Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0f0d2a;width:100%;-webkit-text-size-adjust:none;">
    <center style="width:100%;background-color:#0f0d2a;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f0d2a;margin:0 auto;padding:0;width:100%;">
        <tr>
          <td align="center" style="padding:20px;">
            <!-- Main container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background-color:#12102d;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 24px rgba(0,0,0,0.3);">
              
              <!-- HEADER -->
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#8b5cf6 0%,#3b82f6 100%);padding:40px 20px;">
                  <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.3);">SyncSpace</h1>
                  <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Secure Verification</p>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td style="padding:35px 25px 40px 25px;text-align:center;background-color:#12102d;">
                  <h2 style="font-size:20px;font-weight:700;margin:0 0 18px;color:#c084fc;">Verify Your Identity</h2>

                  <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85);margin:0 0 28px;">
                    Hi ${name || "there"},<br /><br />
                    Please use the OTP below to complete your authentication.
                  </p>

                  <!-- OTP BOX -->
                  <table role="presentation" width="100%" style="margin:20px 0;background-color:rgba(255,255,255,0.05);border-radius:16px;border:1px solid rgba(255,255,255,0.15);">
                    <tr>
                      <td align="center" style="padding:26px 16px;">
                        <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.6);margin-bottom:10px;">
                          Your OTP Code
                        </div>
                        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#c084fc;text-shadow:0 2px 4px rgba(0,0,0,0.4);">
                          ${otpCode}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- EXPIRY -->
                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:14px;margin:20px 0;color:#fca5a5;font-size:13px;font-weight:500;">
                    ⏰ This code will expire in 10 minutes.
                  </div>

                  <!-- SECURITY NOTICE -->
                  <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px;color:#c084fc;font-size:13px;line-height:1.5;margin-bottom:10px;">
                    🔒 <strong>Security Tip:</strong> Never share this code. Our team will never ask for it.
                  </div>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="background-color:#0d0b26;padding:25px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.65);">
                    If you didn’t request this, ignore this email or
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

export default generateOtpEmail;
