const getZooomLogo = (storeName) => {
    // If the store is ZOOOMIT, render the stylized logo, else just the store name in white
    if (storeName.toLowerCase().includes('zooom')) {
        return `<span style="color: #ffffff; font-size: 32px; font-weight: 800; font-style: italic; letter-spacing: -1px;">Z<span style="color: #3b82f6;">ooo</span>m</span>`;
    }
    return `<span style="color: #ffffff; font-size: 28px; font-weight: bold;">${storeName}</span>`;
};

export const getInvoiceEmailTemplate = (invoiceNumber, storeName = 'Zooom Supermart') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Invoice</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
            <td align="center" style="background-color: #0f172a; padding: 40px 20px;">
                ${getZooomLogo(storeName)}
            </td>
        </tr>
        
        <!-- Hero/Icon -->
        <tr>
            <td align="center" style="padding: 40px 40px 10px 40px;">
                <div style="background-color: #dbeafe; width: 64px; height: 64px; border-radius: 32px; display: inline-block; line-height: 64px; text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 30px;">🛍️</span>
                </div>
                <h2 style="color: #1e293b; font-size: 26px; margin: 0 0 10px 0; font-weight: bold;">Thank You for Your Purchase!</h2>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 20px 40px 40px 40px; color: #475569; line-height: 1.6; font-size: 16px;">
                <p style="margin-top: 0;">Dear Customer,</p>
                <p>We truly appreciate your business. Your official invoice <strong>#${invoiceNumber}</strong> has been generated and is attached to this email as a PDF document.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #1e293b; font-weight: 500;">We hope you enjoy your items! We look forward to serving you again soon.</p>
                </div>
                
                <p>If you have any questions or concerns regarding this invoice or your order, please do not hesitate to reply to this email to contact our support team.</p>
                <br>
                <p style="margin-bottom: 0;">Warm Regards,<br><strong style="color: #1e293b;">The ${storeName} Team</strong></p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td align="center" style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message, please do not reply directly to this email.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const getResetPasswordTemplate = (resetUrl, storeName = 'Zooom Supermart') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
            <td align="center" style="background-color: #0f172a; padding: 40px 20px;">
                ${getZooomLogo(storeName)}
            </td>
        </tr>
        
        <!-- Hero/Icon -->
        <tr>
            <td align="center" style="padding: 40px 40px 10px 40px;">
                <div style="background-color: #fee2e2; width: 64px; height: 64px; border-radius: 32px; display: inline-block; line-height: 64px; text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 30px;">🔒</span>
                </div>
                <h2 style="color: #1e293b; font-size: 26px; margin: 0 0 10px 0; font-weight: bold;">Password Reset Request</h2>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 20px 40px 40px 40px; color: #475569; line-height: 1.6; font-size: 16px;">
                <p style="margin-top: 0;">Hello,</p>
                <p>We received a request to reset the password for your account associated with <strong>${storeName}</strong>. If you made this request, please click the button below to choose a new password.</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 15px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">Reset Password</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.</p>
                <br>
                <p style="margin-bottom: 0;">Best Regards,<br><strong style="color: #1e293b;">The ${storeName} Team</strong></p>
            </td>
        </tr>
        
    </table>
</body>
</html>
`;

export const getCancelEmailTemplate = (documentNumber, storeName = 'Zooom Supermart') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Cancelled</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
            <td align="center" style="background-color: #0f172a; padding: 40px 20px;">
                \${getZooomLogo(storeName)}
            </td>
        </tr>
        
        <!-- Hero/Icon -->
        <tr>
            <td align="center" style="padding: 40px 40px 10px 40px;">
                <div style="background-color: #fee2e2; width: 64px; height: 64px; border-radius: 32px; display: inline-block; line-height: 64px; text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 30px;">🛑</span>
                </div>
                <h2 style="color: #1e293b; font-size: 26px; margin: 0 0 10px 0; font-weight: bold;">Order Cancelled</h2>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 20px 40px 40px 40px; color: #475569; line-height: 1.6; font-size: 16px;">
                <p style="margin-top: 0;">Dear Customer,</p>
                <p>This email is to confirm that your order associated with document <strong>#\${documentNumber}</strong> has been cancelled.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #1e293b; font-weight: 500;">If applicable, any processed payments will be refunded to your original payment method automatically.</p>
                </div>
                
                <p>Your official cancellation document is attached to this email as a PDF for your records.</p>
                <p>If you have any questions or did not authorize this cancellation, please contact our support team immediately.</p>
                <br>
                <p style="margin-bottom: 0;">Best Regards,<br><strong style="color: #1e293b;">The \${storeName} Team</strong></p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td align="center" style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                <p style="margin: 0 0 10px 0;">&copy; \${new Date().getFullYear()} \${storeName}. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message, please do not reply directly to this email.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const getReturnEmailTemplate = (documentNumber, storeName = 'Zooom Supermart') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Return Processed</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
            <td align="center" style="background-color: #0f172a; padding: 40px 20px;">
                \${getZooomLogo(storeName)}
            </td>
        </tr>
        
        <!-- Hero/Icon -->
        <tr>
            <td align="center" style="padding: 40px 40px 10px 40px;">
                <div style="background-color: #fef3c7; width: 64px; height: 64px; border-radius: 32px; display: inline-block; line-height: 64px; text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 30px;">🔄</span>
                </div>
                <h2 style="color: #1e293b; font-size: 26px; margin: 0 0 10px 0; font-weight: bold;">Return Processed</h2>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 20px 40px 40px 40px; color: #475569; line-height: 1.6; font-size: 16px;">
                <p style="margin-top: 0;">Dear Customer,</p>
                <p>We are writing to confirm that your return request (Document <strong>#\${documentNumber}</strong>) has been successfully processed.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #1e293b; font-weight: 500;">Your official return receipt has been attached to this email as a PDF document for your records.</p>
                </div>
                
                <p>If applicable, any refunds associated with this return will be issued according to our standard refund policy.</p>
                <p>We hope to serve you again in the future. If you have any further questions, please contact our support team.</p>
                <br>
                <p style="margin-bottom: 0;">Warm Regards,<br><strong style="color: #1e293b;">The \${storeName} Team</strong></p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td align="center" style="background-color: #f8fafc; padding: 25px 40px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                <p style="margin: 0 0 10px 0;">&copy; \${new Date().getFullYear()} \${storeName}. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message, please do not reply directly to this email.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
