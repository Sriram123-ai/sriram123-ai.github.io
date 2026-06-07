/**
 * Support Controller
 * Handles product support queries
 */

const tickets = [];
let ticketCounter = 1000;

const submitSupport = (req, res) => {
  try {
    const { name, productIssue, description } = req.body;

    if (!name || !productIssue || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, productIssue, description'
      });
    }

    const ticket = {
      id: `NXR-${++ticketCounter}`,
      name: name.trim(),
      productIssue: productIssue.trim(),
      description: description.trim(),
      status: 'Open',
      submittedAt: new Date().toISOString()
    };

    tickets.push(ticket);
    console.log('New support ticket:', ticket);

    return res.status(201).json({
      success: true,
      message: `Support ticket created! Your ticket ID is ${ticket.id}. Our team will respond within 2 business hours.`,
      data: { ticketId: ticket.id, status: ticket.status, submittedAt: ticket.submittedAt }
    });
  } catch (error) {
    console.error('Support submission error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

const getTickets = (req, res) => {
  return res.json({ success: true, count: tickets.length, data: tickets });
};

module.exports = { submitSupport, getTickets };
