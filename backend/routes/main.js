const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const lang = req.query.lang || 'en';
  res.render('main', { 
    currentLang: lang 
  });
});

module.exports = router;
