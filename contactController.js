/**
 * Contact Controller
 * Handles contact form submissions
 */

// In-memory store (replace with MongoDB in production)
const messages = [];

const submitContact = (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, message'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const entry = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      submittedAt: new Date().toISOString()
    };

    messages.push(entry);
    console.log('New contact message:', entry);

    return res.status(201).json({
      success: true,
      message: "Thank you for reaching out! We'll get back to you within 24 hours.",
      data: { id: entry.id, submittedAt: entry.submittedAt }
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

const getMessages = (req, res) => {
  return res.json({ success: true, count: messages.length, data: messages });
};

module.exports = { submitContact, getMessages };
