/**
 * Career Controller
 * Handles job applications
 */

const applications = [];

const submitApplication = (req, res) => {
  try {
    const { name, email, position, resumeFileName } = req.body;

    if (!name || !email || !position) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and position are required.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const application = {
      id: `APP-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      position: position.trim(),
      resumeFileName: resumeFileName || 'Not provided',
      status: 'Under Review',
      appliedAt: new Date().toISOString()
    };

    applications.push(application);
    console.log('New application:', application);

    return res.status(201).json({
      success: true,
      message: `Application submitted successfully for ${position}! We'll review your profile and contact you within 5-7 business days.`,
      data: { id: application.id, position: application.position, appliedAt: application.appliedAt }
    });
  } catch (error) {
    console.error('Application error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

const getApplications = (req, res) => {
  return res.json({ success: true, count: applications.length, data: applications });
};

module.exports = { submitApplication, getApplications };
