const express = require('express');
const router = express.Router();
const fetchUser = require('../middleware/fetchUser');
const QuizReport = require('../models/Result');

// Save report (protected route)
router.post('/', fetchUser, async (req, res) => {
  try {
    const { category, difficulty, score, totalQuestions } = req.body;
    const report = new QuizReport({
      user: req.user.id,
      category,
      difficulty,
      score,
      totalQuestions,
    });
    await report.save();
    res.json({ message: 'Quiz report saved successfully', report });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

// ✅ Fetch all quiz reports for logged-in user
router.get('/myscores', fetchUser, async (req, res) => {
  try {
    const reports = await QuizReport.find({ user: req.user.id }).sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/all', async (req, res) => {
  try {
    const reports = await QuizReport.find()
      .populate('user', 'name') // 👉 populates user field with name only
      .sort({ score: -1 });     // 👉 sort highest score to lowest

    const formattedReports = reports.map(report => ({
      name: report.user?.name || 'Unknown',
      score: report.score,
      category: report.category,
      difficulty: report.difficulty,
      takenAt: report.date
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});


// ✅ Fetch all users with their scores (admin-like route)
router.get('/all-scores', async (req, res) => {
  try {
    const reports = await QuizReport.find()
      .populate('user', 'name email') // Select only name and email from User
      .sort({ date: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
