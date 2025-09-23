export const generateOtpEmail = (name, otp) => {
  const year = new Date().getFullYear(); // dynamically get current year
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your One-Time Password</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
                margin: 0;
                padding: 0;
                background-color: #f4f4f7;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                box-sizing: border-box;
            }
            .card {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .header h1 {
                color: #1a1a1a;
                font-size: 24px;
                margin: 0;
            }
            .content p {
                color: #555555;
                font-size: 16px;
                line-height: 1.5;
            }
            .otp-code {
                background-color: #e8e8ed;
                border-radius: 8px;
                color: #1a1a1a;
                display: inline-block;
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 4px;
                margin: 25px auto;
                padding: 15px 30px;
            }
            .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #999999;
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
        <div class="container">
            <div class="card">
                <div class="header" style="margin-bottom: 20px;">
                    <h1>Your Verification Code</h1>
                </div>
                <div class="content" style="text-align: left;">
                    <p>Hi ${name},</p>
                    <p>Here is your One-Time Password (OTP) to complete your action. Please use the following code:</p>
                    <div style="text-align: center;">
                        <div class="otp-code">${otp}</div>
                    </div>
                    <p>This code is valid for 10 minutes. For your security, please do not share this code with anyone.</p>
                </div>
                <div class="footer" style="text-align: center;">
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>&copy; ${year} SyncSpace. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
