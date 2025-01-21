const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.sendContactForm = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { name, email, message } = req.body;

        // Configure your email transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: functions.config().email.user,
                pass: functions.config().email.pass
            }
        });

        try {
            // Send email
            await transporter.sendMail({
                from: functions.config().email.user,
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
}); 