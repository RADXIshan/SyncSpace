const generateOtpEmail = require('./otpEmail');
const generateForgotPasswordEmail = require('./forgotPasswordEmail');
const generateOrganizationInviteEmail = require('./organizationInviteEmail');

module.exports = {
  generateOtpEmail,
  generateForgotPasswordEmail,
  generateOrganizationInviteEmail
};