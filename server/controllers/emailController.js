import nodemailer from 'nodemailer';

export const sendEmail = async (req, res) => {
    const { to, companyName, subdomain, email, password, sendEmail } = req.body;

    // Check if email sending is enabled
    if (!sendEmail) {
        return res.status(200).json({ message: 'Email sending is disabled.' });
    }

    try {
        // Configure the transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use your email service (e.g., Gmail, Outlook, etc.)
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app-specific password
            },
        });

        // Define the email template
        const emailTemplate = `
            <p>Dear ${to},</p>
            <p>We are pleased to provide you with your login credentials for the HRMS platform of <strong>${companyName}</strong>. Please find the details below:</p>
            <ul>
                <li><strong>🔹 Portal URL:</strong> ${subdomain}</li>
                <li><strong>🔹 Username:</strong> ${email}</li>
                <li><strong>🔹 Password:</strong> ${password}</li>
            </ul>
            <p>For security reasons, we recommend updating your password upon your first login. Should you require any assistance, please do not hesitate to contact our support team.</p>
            <p>Thank you for choosing Paytiemp Smartech Solutions. We look forward to supporting your HR management needs and contributing to your business growth.</p>
            <p>Best regards,<br>Super Admin<br>PaceHRM</p>
        `;

        // Define the email options
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to, // Recipient address
            subject: `Welcome to ${companyName} HRMS Platform`,
            html: emailTemplate, // HTML body
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Email sent successfully', info });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
};