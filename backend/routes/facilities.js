const express = require('express');
const router = express.Router();
const facilityModel = require("../../db/models/FacilityModel");
const responseModel = require("../../db/models/ResponseModel");
const { connectToDatabase } = require("../../db/database");
const db = connectToDatabase();
const fs = require('fs');

router.get('/', async (req, res) => {
    const id = req.params.id;
    const gov = false;
    const filters = req.query;
    try {
        const facilityInstance = new facilityModel(db); 
        const facilities = await facilityInstance.getAllFacilitiesByName(); 
        
        const facility = JSON.parse(fs.readFileSync(__dirname + '/facility_1_data.json', 'utf-8'));

        const matches = applyFilters(facility, filters);

        res.render('facilities', {id, gov,  facilities: matches ? [facility] : []}); 
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get the facility ID from the URL
        const facilityInstance = new facilityModel(db); // Create an instance of the model
      
        const facilityDetails = facilityInstance.getFacilityById(id); // Fetch responses for the facility
        const gov = false;
        const head0_name = null;
        const facility = facilityInstance.getFacilityById(id); 
        res.render('facilities_id', {id, gov, facilityDetails,facility, head0_name}); // Pass grouped data to the template
    } catch (error) {
        console.error('Error fetching facility responses:', error);
        res.status(500).send('Internal Server Error');
    }
});

function applyFilters(facility, filters) {
    // 1. Wait time
    if (filters.wait_time) {
      const actualWait = facility.wait_time.average_wait_time_minutes;
      console.log(actualWait);
      if (actualWait < Number(filters.wait_time)) return false;
    }
    if (filters.satisfaction) {
        const actualSatisfaction = facility.satisfaction.average;
        console.log(actualSatisfaction);
        if (actualSatisfaction < Number(filters.satisfaction)) return false;
      }
  
    // 2. Confidentiality
    if (filters.confidentiality === 'yes') {
      const yes = facility.confidentiality.find(e => e.confidentiality === "Yes")?.count || 0;
      const no = facility.confidentiality.find(e => e.confidentiality === "No")?.count || 0;
      if (yes <= no) return false;
    }
  
    // 3. Permission before exam
    if (filters.permission_before_exam === 'yes') {
      const yes = facility.permission_before_exam.find(e => e.permission_before_exam === "Yes")?.count || 0;
      if (yes === 0) return false;
    }
  
    // 4. Gave all meds
    if (filters.received_all_meds === 'yes') {
      const full = facility.medication_completion.find(e => e.received_all_meds === "Yes")?.count || 0;
      if (full === 0) return false;
    }
  
    // 5. Payment method
    if (filters.service_payment_mode) {
      const found = facility.payment_modes.find(e => e.service_payment_mode === filters.service_payment_mode)?.count || 0;
      if (found === 0) return false;
    }
  
    return true;
  }
  
module.exports = router;
