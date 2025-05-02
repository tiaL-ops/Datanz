const express = require('express');
const router = express.Router();
const facilityModel = require("../../db/models/FacilityModel");
const ResponseModel = require("../../db/models/ResponseModel");
const { connectToDatabase } = require("../../db/database");
const db = connectToDatabase();
const fs = require('fs');


router.get('/map-view', async (req, res) => {
  try {
    const facilityInstance = new facilityModel(db);
    const responseModel = new ResponseModel(db);
    const facilities = await facilityInstance.getAllFacilities();
    const lang = req.query.lang || 'en';
    
    // Add metrics to each facility
    const facilitiesWithMetrics = facilities.map(facility => {
      const id = facility.facility_id;
      const metrics = {
        avgWeight: responseModel.getWeightOfFacility(id)?.average_weight || 0,
        avgWait: responseModel.getWaitingTimeStats(id)?.average_wait_time_minutes || 0
      };
      return { ...facility, metrics };
    });

    res.render('map-view', { 
      facilities: facilitiesWithMetrics,
      currentLang: lang
    });
  } catch (error) {
    console.error('Error fetching facilities for map view:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const filters = req.query;
  const gov = false;

  const responseModel = new ResponseModel(db);

  try {
    const facilityInstance = new facilityModel(db);
    const facilities = await facilityInstance.getAllFacilities();

    const fullStats = facilities.map(facility => {
      const id = facility.facility_id;
      return {
        facility_id: id,
        name: facility.name,
        location: facility.location,
        type: facility.facility_type,
        wait_time: responseModel.getWaitingTimeStats(id),
        satisfaction: responseModel.getSatisfactionDistribution(id),
        confidentiality: responseModel.getConfidentialityStats(id),
        permission_before_exam: responseModel.getPermissionBeforeExamStats(id),
        test_completion: responseModel.getTestCompletionStats(id),
        medication_completion: responseModel.getMedicationCompletionStats(id),
        payment_modes: responseModel.getServicePaymentModes(id),
        problem_areas: responseModel.getProblemAreaFrequency(id),
        positive_areas: responseModel.getPositiveAreaFrequency(id),
      };
    });

    const matched = fullStats.filter(f => applyFilters(f, filters));
    const totalCount = matched.length;

    // Paginate: get only 50 for current page
    const paginated = matched.slice((page - 1) * limit, page * limit);
    const lang = req.query.lang || 'en';
    res.render('facilities', {
      id: null,
      gov,
      facilities: paginated,
      page,
      currentLang: lang,
      totalCount
    });

  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const facilityInstance = new facilityModel(db);
    const responseModel = new ResponseModel(db);
    const gov = false;
    const head0_name = null;


    const facilityDetails = await facilityInstance.getFacilityById(id);
    const facility = await facilityInstance.getFacilityById(id);

    // Generate report data 
    const waitTime = await responseModel.getWaitingTimeStats(id);
    const satisfaction = await responseModel.getSatisfactionDistribution(id);
    const confidentiality = await responseModel.getConfidentialityStats(id);
    const permission = await responseModel.getPermissionBeforeExamStats(id);
    const testCompletion = await responseModel.getTestCompletionStats(id);
    const medCompletion = await responseModel.getMedicationCompletionStats(id);
    const paymentModes = await responseModel.getServicePaymentModes(id);
    const problemAreas = await responseModel.getProblemAreaFrequency(id);
    const positiveAreas = await responseModel.getPositiveAreaFrequency(id);
    const recentResponses = await responseModel.getLatestResponses(id);
    const summaryStats = await responseModel.getSummaryStats(id);
    /*
        const report = responseModel.generateFacilityReport({
          id,
          date: new Date().toLocaleDateString(),
          waitTime,
          satisfaction,
          confidentiality,
          permission,
          testCompletion,
          medCompletion,
          paymentModes,
          problemAreas,
          positiveAreas,
          recentResponses,
          summaryStats,
        });
    */
    const lang = req.query.lang || 'en';
    res.render('facilities_id', {
      id,
      gov,
      facilityDetails,
      facility,
      head0_name,
      reportData: {
        id,
        date: new Date().toLocaleDateString(),
        waitTime,
        satisfaction,
        confidentiality,
        permission,
        testCompletion,
        medCompletion,
        paymentModes,
        problemAreas,
        positiveAreas,
        recentResponses,
      
        summaryStats
      },
      currentLang: lang,
    });


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
  /*
  if (filters.confidentiality === 'yes') {
      const percent = facility.confidentiality.average_percent_yes;
      if (!percent || percent < 50) return false;
    }
      */
  if (filters.confidentiality) {
    const percent = facility.confidentiality.average_percent_yes || 0;
    console.log("confi", percent);
    if (filters.confidentiality === 'somewhat') {
      if (percent < 50) return false;
    }

    if (filters.confidentiality === 'very') {
      if (percent < 70) return false;
    }

    // if it's "not", we skip filtering
    return true;
  }


  // 3. Permission before exam
  if (filters.permission_before_exam) {
    const percent = facility.permission_before_exam.average_percent_yes || 0;
    console.log("per", percent);
    if (filters.confidentiality === 'somewhat') {
      if (percent < 50) return false;
    }

    if (filters.confidentiality === 'very') {
      if (percent < 70) return false;
    }

    // if it's "not", we skip filtering
    return true;
  }

  // 4. Gave all tes eds test_completion
  if (filters.received_all_tests) {
    const percent = facility.test_completion.average_percent_yes || 0;
    console.log("periii", percent);
    if (filters.confidentiality === 'somewhat') {
      if (percent < 50) return false;
    }

    if (filters.confidentiality === 'very') {
      if (percent < 70) return false;
    }

    // if it's "not", we skip filtering
    return true;
  }
  // 4. Gave all meds test_completion
  if (filters.received_all_meds) {
    const percent = facility.medication_completion.average_percent_yes || 0;
    console.log("poi", percent);
    if (filters.confidentiality === 'somewhat') {
      if (percent < 50) return false;
    }

    if (filters.confidentiality === 'very') {
      if (percent < 70) return false;
    }

    // if it's "not", we skip filtering
    return true;
  }

  // 5. Payment method
  if (filters.service_payment_mode) {
    const found = facility.payment_modes.find(e => e.service_payment_mode === filters.service_payment_mode)?.count || 0;
    if (found === 0) return false;
  }

  return true;
}


module.exports = router;
