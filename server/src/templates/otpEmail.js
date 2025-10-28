const generateOtpEmail = (otpCode) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap");
        
        * {
            font-family: "Montserrat", sans-serif;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background: linear-gradient(
                135deg,
                #0f0d2a 0%,
                #1a1654 25%,
                #0f1a3a 50%,
                #0f1629 75%,
                #0f0d2a 100%
            );
            min-height: 100vh;
            padding: 20px;
            color: white;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.01);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                        0 2px 8px rgba(0, 0, 0, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.15),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.03);
            overflow: hidden;
            position: relative;
        }

        .header {
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }

        .header-content {
            position: relative;
            z-index: 2;
        }

        .logo {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
        }

        .content {
            padding: 40px 30px;
            text-align: center;
        }

        .greeting {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: rgba(255, 255, 255, 0.8);
        }

        .otp-container {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .otp-label {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #ffffff;
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .expiry-notice {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            color: #fca5a5;
            font-size: 14px;
            font-weight: 500;
        }

        .security-notice {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            color: #93c5fd;
            font-size: 14px;
            line-height: 1.5;
        }

        .footer {
            background: rgba(0, 0, 0, 0.2);
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.5;
        }

        .footer-link {
            color: #a855f7;
            text-decoration: none;
            font-weight: 600;
        }

        .footer-link:hover {
            color: #7c3aed;
        }

        @media (max-width: 640px) {
            .container {
                margin: 10px;
                border-radius: 16px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
            
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div class="logo">TeamSync</div>
                <div class="subtitle">Secure Authentication</div>
            </div>
        </div>
        
        <div class="content">
            <div class="greeting">Verify Your Identity</div>
            
            <div class="message">
                We've received a request to verify your account. Please use the OTP code below to complete your authentication.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">${otpCode}</div>
            </div>
            
            <div class="expiry-notice">
                ⏰ This code will expire in 10 minutes for your security.
            </div>
            
            <div class="security-notice">
                🔒 <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your OTP code via email, phone, or any other method.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                If you didn't request this code, please ignore this email or 
                <a href="#" class="footer-link">contact our support team</a>.
                <br><br>
                © 2024 TeamSync. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = generateOtpEmail;