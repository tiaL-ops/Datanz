const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const id = req.params.id;
    //const allFacilities = facilityModel.getAllFacilities();
    const facilities = ['one', 'two', 'three', 'four'];
    res.render('facilities', {id, facilities});
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const facilities = ['one', 'two', 'three', 'four'];
    res.render('facilities', {id, facilities});
});

module.exports = router;
