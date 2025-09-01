import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Sử dụng email sandbox nếu chưa verify domain
    const emailData = {
      to: params.to,
      from: 'test@example.com', // Thử với email đơn giản trước
      subject: params.subject,
      html: params.html,
      ...(params.cc && { cc: params.cc })
    };

    console.log('Sending email with data:', JSON.stringify(emailData, null, 2));
    await mailService.send(emailData);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    
    // In chi tiết lỗi
    if (error && typeof error === 'object') {
      if (error.response && error.response.body) {
        console.error('SendGrid error response body:', JSON.stringify(error.response.body, null, 2));
        if (error.response.body.errors) {
          console.error('SendGrid specific errors:', JSON.stringify(error.response.body.errors, null, 2));
        }
      }
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
      subject: `[VIA English Academy] Request for Student Accounts (SWE Program) - ${branchName} Center`,
      html: `
        <p>Dear Support Team,</p>
        
        <p>Thank you for your assistance in helping our students get started smoothly.</p>
        
        <p>I would now like to request student accounts for a new class at ${branchName} Center.</p>
        
        <p>Please find the student list for ${branchName} Center in the link: <a href="${fileUrl}">${fileUrl}</a>.</p>
        
        <p>We would greatly appreciate your prompt support in generating the login details.</p>
        
        <p>Looking forward to your continued support.</p>
        
        <p>Best regards,<br>
        VIA English Academy.</p>
      `
    };
  } else if (requestType === 'un_tag_account') {
    return {
      subject: `[VIA English Academy] Request To Untag Accounts (SWE Program) - ${branchName} Center`,
      html: `
        <p>Dear Support Team,</p>
        
        <p>Please help us un-tag the student accounts (link: <a href="${fileUrl}">${fileUrl}</a>) so that students can log in with their new devices.<br>
        Please kindly confirm once the un-tagging has been completed.</p>
        
        <p>Thank you for your prompt support.</p>
        
        <p>Best regards,<br>
        VIA English Academy.</p>
      `
    };
  } else {
    throw new Error(`Unknown request type: ${requestType}`);
  }
}