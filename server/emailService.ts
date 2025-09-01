import nodemailer from 'nodemailer';

// Check for Gmail credentials
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not set, email functionality will be disabled");
}

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailParams {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail credentials not configured');
      return false;
    }

    // Tránh duplicate email trong to và cc
    const emailData: any = {
      from: process.env.GMAIL_USER,
      to: params.to,
      subject: params.subject,
      html: params.html
    };

    // Chỉ thêm cc nếu khác với to
    if (params.cc && params.cc !== params.to) {
      emailData.cc = params.cc;
    }

    console.log('Sending email with data:', JSON.stringify({
      ...emailData,
      html: emailData.html.length > 100 ? emailData.html.substring(0, 100) + '...' : emailData.html
    }, null, 2));
    
    await transporter.sendMail(emailData);
    console.log('Email sent successfully via Gmail');
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
    
    // In chi tiết lỗi
    if (error && typeof error === 'object') {
      if (error.message) {
        console.error('Error message:', error.message);
      }
    }
    return false;
  }
}

export function generateAccountRequestEmail(requestType: string, branchName: string, fileUrl: string): { subject: string; html: string } {
  if (requestType === 'new_account') {
    return {
      subject: `VIA Academy - Student Account Request for ${branchName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: white; }
            .info-box { background: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
            .footer { padding: 15px 20px; background: #f8f9fa; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 25px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .button:hover { background: #0052a3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">VIA English Academy</h2>
              <p style="margin: 5px 0 0 0;">Academic Department Request</p>
            </div>
            <div class="content">
              <p>Dear Support Team,</p>
              
              <p>We are submitting a new student account creation request for our academic program.</p>
              
              <div class="info-box">
                <strong>Request Details:</strong><br>
                • Branch Location: ${branchName}<br>
                • Request Type: New Student Accounts<br>
                • Program: SWE<br>
                • Date: ${new Date().toLocaleDateString('vi-VN')}
              </div>
              
              <p>The complete student enrollment list is available through our secure document system:</p>
              <p style="text-align: center;">
                <a href="${fileUrl}" class="button" style="display: inline-block; padding: 12px 25px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">📄 View Student List Document</a>
              </p>
              
              <p>Please process this request and provide the login credentials at your earliest convenience. Our students are scheduled to begin their coursework soon.</p>
              
              <p>Thank you for your continued support.</p>
              
              <p>Best regards,<br>
              <strong>VIA English Academy</strong></p>
            </div>
            <div class="footer">
              <p>This message was sent from the VIA Academy Management System.<br>
              For questions, please contact the academic department directly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  } else if (requestType === 'un_tag_account') {
    return {
      subject: `VIA Academy - Account Un-tagging Request for ${branchName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: white; }
            .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { padding: 15px 20px; background: #f8f9fa; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 25px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .button:hover { background: #c82333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">VIA English Academy</h2>
              <p style="margin: 5px 0 0 0;">Account Un-tagging Request</p>
            </div>
            <div class="content">
              <p>Dear Support Team,</p>
              
              <p>We need your assistance with account un-tagging for students who require device access updates.</p>
              
              <div class="info-box">
                <strong>Request Details:</strong><br>
                • Branch Location: ${branchName}<br>
                • Request Type: Account Un-tagging<br>
                • Reason: New device login access<br>
                • Date: ${new Date().toLocaleDateString('vi-VN')}
              </div>
              
              <p>The affected student accounts are listed in our secure document:</p>
              <p style="text-align: center;">
                <a href="${fileUrl}" class="button" style="display: inline-block; padding: 12px 25px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">📄 View Student List Document</a>
              </p>
              
              <p>Please un-tag these accounts so students can log in with their new devices. Kindly confirm completion when the process is finished.</p>
              
              <p>Thank you for your prompt support.</p>
              
              <p>Best regards,<br>
              <strong>VIA English Academy</strong></p>
            </div>
            <div class="footer">
              <p>This message was sent from the VIA Academy Management System.<br>
              For questions, please contact the academic department directly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  } else {
    throw new Error(`Unknown request type: ${requestType}`);
  }
}