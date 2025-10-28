const generateOrganizationInviteEmail = ({
  inviteeName,
  inviterName,
  orgName,
  role,
  teamSize,
  industry,
  inviterRole,
  inviterEmail,
  inviteLink
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Invitation</title>
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

        .org-info {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .org-name {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .org-details {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            flex-wrap: wrap;
            gap: 20px;
        }

        .org-detail {
            text-align: center;
            flex: 1;
            min-width: 120px;
        }

        .detail-label {
            font-size: 12px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .detail-value {
            font-size: 16px;
            font-weight: 700;
            color: #a855f7;
        }

        .inviter-info {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            color: #93c5fd;
            font-size: 14px;
            line-height: 1.5;
        }

        .join-button-container {
            margin: 40px 0;
        }

        .join-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(50px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 16px;
            padding: 16px 32px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 
                        0 4px 16px rgba(0, 0, 0, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.12);
        }

        .join-button:hover {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(60px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35), 
                        0 6px 20px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.45),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.15);
        }

        .alternative-link {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
        }

        .link-text {
            word-break: break-all;
            color: #a855f7;
            font-weight: 500;
            margin: 10px 0;
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

        .benefits {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            color: #6ee7b7;
            font-size: 14px;
            line-height: 1.5;
        }

        .benefits-list {
            list-style: none;
            margin: 10px 0;
        }

        .benefits-list li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
        }

        .benefits-list li::before {
            content: '✨';
            position: absolute;
            left: 0;
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
            
            .join-button {
                padding: 14px 24px;
                font-size: 14px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .org-name {
                font-size: 24px;
            }
            
            .org-details {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div class="logo">TeamSync</div>
                <div class="subtitle">Organization Invitation</div>
            </div>
        </div>
        
        <div class="content">
            <div class="greeting">You're Invited!</div>
            
            <div class="message">
                Hi ${inviteeName},<br><br>
                ${inviterName} has invited you to join their organization on TeamSync. Join now to start collaborating with your team!
            </div>
            
            <div class="org-info">
                <div class="org-name">${orgName}</div>
                
                <div class="org-details">
                    <div class="org-detail">
                        <div class="detail-label">Role</div>
                        <div class="detail-value">${role}</div>
                    </div>
                    <div class="org-detail">
                        <div class="detail-label">Team Size</div>
                        <div class="detail-value">${teamSize} members</div>
                    </div>
                    <div class="org-detail">
                        <div class="detail-label">Industry</div>
                        <div class="detail-value">${industry}</div>
                    </div>
                </div>
            </div>
            
            <div class="inviter-info">
                👤 <strong>Invited by:</strong> ${inviterName} (${inviterRole})
                <br>
                📧 ${inviterEmail}
            </div>
            
            <div class="benefits">
                <strong>🚀 What you'll get access to:</strong>
                <ul class="benefits-list">
                    <li>Real-time team collaboration</li>
                    <li>Project management tools</li>
                    <li>Secure file sharing</li>
                    <li>Video meetings & screen sharing</li>
                    <li>Calendar integration</li>
                    <li>Custom workflows</li>
                </ul>
            </div>
            
            <div class="join-button-container">
                <a href="${inviteLink}" class="join-button">
                    🎉 Join ${orgName}
                </a>
            </div>
            
            <div class="alternative-link">
                <strong>Button not working?</strong> Copy and paste this link into your browser:
                <div class="link-text">${inviteLink}</div>
            </div>
            
            <div class="expiry-notice">
                ⏰ This invitation will expire in 7 days. Join now to not miss out!
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                Don't want to join? You can safely ignore this email.
                <br>
                Need help? <a href="#" class="footer-link">Contact our support team</a>
                <br><br>
                © 2024 TeamSync. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = generateOrganizationInviteEmail;