const generateOrganizationInviteEmail = ({
inviteeName, inviterName, orgName, inviteCode, inviterRole, inviteLink, customMessage,
}) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Organization Invitation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0f0d2a;width:100%;-webkit-text-size-adjust:none;">
    <center style="width:100%;background-color:#0f0d2a;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f0d2a;margin:0 auto;padding:0;width:100%;">
        <tr>
          <td align="center" style="padding:20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background-color:#151237;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 24px rgba(0,0,0,0.3);">
              
              <!-- HEADER -->
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:40px 20px;">
                  <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.4);">SyncSpace</h1>
                  <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Team Collaboration</p>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td style="padding:35px 25px 40px 25px;text-align:center;background-color:#151237;">
                  <h2 style="font-size:20px;font-weight:700;margin:0 0 18px;color:#c084fc;text-shadow:0 2px 6px rgba(124,58,237,0.4);">
                    You're Invited to Join ${orgName}
                  </h2>

                  <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85);margin:0 0 28px;">
                    Hi ${inviteeName || "there"},<br /><br />
                    ${inviterName || "A team member"} (${inviterRole || "Member"}) has invited you to join the organization 
                    <strong style="color:#c084fc;">${orgName}</strong> on SyncSpace.
                  </p>

                  ${customMessage ? `<p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.8);margin:0 0 20px;padding:16px;background-color:rgba(255,255,255,0.05);border-left:3px solid #a855f7;border-radius:8px;text-align:left;">
                    ${customMessage}
                  </p>` : ''}

                  <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.75);margin:0 0 20px;">
                    Click the button below to join, or use the invitation code if prompted.
                  </p>

                  <!-- INVITE CODE BOX -->
                  <table role="presentation" width="100%" style="margin:20px 0;background-color:rgba(255,255,255,0.05);border-radius:16px;border:1px solid rgba(255,255,255,0.15);">
                    <tr>
                      <td align="center" style="padding:26px 16px;">
                        <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.6);margin-bottom:10px;">
                          Invitation Code
                        </div>
                        <div style="font-size:30px;font-weight:800;letter-spacing:6px;color:#a855f7;text-shadow:0 2px 6px rgba(168,85,247,0.4);">
                          ${inviteCode}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- JOIN BUTTON -->
                  <a href="${inviteLink || '#'}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;margin-top:20px;box-shadow:0 4px 10px rgba(168,85,247,0.3);">
                    Join Organization
                  </a>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td align="center" style="background-color:#0d0b26;padding:25px;border-top:1px solid rgba(255,255,255,0.1);">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.65);">
                    If you didn’t expect this invite, you can safely ignore this email.<br /><br />
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

export default generateOrganizationInviteEmail;

