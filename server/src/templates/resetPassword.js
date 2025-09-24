export const generatePasswordResetEmail = (resetLink) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      
      <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🔐 Password Reset</h2>
      
      <p style="color: #555; font-size: 16px; line-height: 1.5;">
        You recently requested to reset your password. Click the button below to proceed:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <p style="color: #777; font-size: 14px; line-height: 1.5;">
        If the button above doesn’t work, copy and paste this link into your browser:
      </p>

      <p style="word-break: break-word; color: #4A90E2; font-size: 14px;">
        <a href="${resetLink}" style="color: #4A90E2; text-decoration: none;">${resetLink}</a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

      <p style="color: #999; font-size: 12px; text-align: center;">
        If you didn’t request a password reset, you can safely ignore this email.
      </p>
    </div>
  </div>
  `;
};
