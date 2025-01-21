const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

exports.sendContactForm = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { name, email, message } = req.body;

    // Configure your email transport
    const transporter = nodemailer.createTransport({
        // Your email service configuration
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'your-business-email@example.com',
            subject: `New Contact Form Submission from ${name}`,
            text: `
                Name: ${name}
                Email: ${email}
                Message: ${message}
            `
        });

        // Store in database (optional)
        await admin.firestore().collection('contact_messages').add({
            name,
            email,
            message,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Failed to send message' });
    }
}); 