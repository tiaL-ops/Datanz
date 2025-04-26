const express = require("express");
const router  = express.Router();
const { connectToDatabase } = require("../../db/database");
const FacilityModel          = require("../../db/models/FacilityModel");
const ResponseModel          = require("../../db/models/ResponseModel");

const db = connectToDatabase();
const facilityModel = new FacilityModel(db);
const responseModel = new ResponseModel(db);

router.get("/", (req, res) => {
  let toggled = false;
  const username = req.session.user?.username;
  const areas = ["Toilets", "Pharmacy/Drugs", "Reception", "Doctor's room"];

  const {
    region,
    waitThreshold,
    satThreshold,
    confiThreshold,
    permThreshold,
    testThreshold,
    medThreshold,
    problemArea,
    positiveArea,
    paymentMode,
    bestCategory,
    worstCategory,
    negativeCategory
  } = req.query;

  let facilities;
  if (region) {
    facilities = db
      .prepare(`SELECT * FROM Facility WHERE location LIKE ?`)
      .all(`${region}%`);
  } else {
    facilities = db.prepare(`SELECT * FROM Facility`).all();
  }

  const results = facilities.map(f => {
    const id = f.facility_id;
    const weightStats = responseModel.getWeightOfFacility(id) || {};

    const m = {
      avgWeight: weightStats.average_weight || 0,
      totalWeight: weightStats.total_weight || 0,
      totalResponses: weightStats.total_responses || 0,

      avgWait: responseModel.getWaitingTimeStats(id).average_wait_time_minutes || 0,
      avgSat: Number(responseModel.getSatisfactionDistribution(id).average) || 0,
      yesConfi: Number(responseModel.getConfidentialityStats(id).average_percent_yes) || 0,
      yesPerm: Number(responseModel.getPermissionBeforeExamStats(id).average_percent_yes) || 0,
      yesTests: Number(responseModel.getTestCompletionStats(id).average_percent_yes) || 0,
      yesMeds: Number(responseModel.getMedicationCompletionStats(id).average_percent_yes) || 0,
      topProblems: responseModel.getProblemAreaFrequency(id).map(p => p.problem_area),
      topPositives: responseModel.getPositiveAreaFrequency(id).map(p => p.positive_area),
      topPayMode: responseModel.getServicePaymentModes(id).most_common,
      areaSatisfaction: responseModel.getAreaSatisfactionWithScore(id)
    };
    return { ...f, metrics: m };
  });

  let filtered = results.filter(f => {
    const m = f.metrics;
    if (waitThreshold && m.avgWait <= Number(waitThreshold)) return false;
    if (satThreshold && m.avgSat >= Number(satThreshold)) return false;
    if (confiThreshold && (100 - m.yesConfi) < Number(confiThreshold)) return false;
    if (permThreshold && (100 - m.yesPerm) < Number(permThreshold)) return false;
    if (testThreshold && (100 - m.yesTests) < Number(testThreshold)) return false;
    if (medThreshold && (100 - m.yesMeds) < Number(medThreshold)) return false;
    if (problemArea && !m.topProblems.includes(problemArea)) return false;
    if (positiveArea && m.topPositives.includes(positiveArea)) return false;
    if (paymentMode && m.topPayMode !== paymentMode) return false;
    return true;
  });

  if (negativeCategory) {
    filtered = filtered.filter(f => {
      const row = f.metrics.areaSatisfaction.find(r => r.area === negativeCategory);
      return row && row.bad_count > 0;
    });
  }

  let bestBy = null, worstBy = null;
  if (bestCategory) {
    bestBy = responseModel.getBestWorstByArea(bestCategory);
  }
  if (worstCategory) {
    const questionMap = {
      'waiting_time': 8,
      'permission': 9,
      'confidentiality': 10,
      'tests': 12,
      'medications': 14,
      'satisfaction': 17
    };
  
    const questionId = questionMap[worstCategory];
  
    if (questionId) {
      let facilities = responseModel.getFacilityWeightByQuestion(questionId);
  
      // ADD METRICS here
      facilities = facilities.map(f => {
        const facility = facilityModel.getFacilityByCode(f.facility_code); // get full facility row
        if (!facility) return null;
  
        const id = facility.facility_id;
        const weightStats = responseModel.getWeightOfFacility(id) || {};
  
        const metrics = {
          avgWeight: weightStats.average_weight || 0,
          totalWeight: weightStats.total_weight || 0,
          totalResponses: weightStats.total_responses || 0,
          avgWait: responseModel.getWaitingTimeStats(id).average_wait_time_minutes || 0,
          avgSat: Number(responseModel.getSatisfactionDistribution(id).average) || 0,
          yesConfi: Number(responseModel.getConfidentialityStats(id).average_percent_yes) || 0,
          yesPerm: Number(responseModel.getPermissionBeforeExamStats(id).average_percent_yes) || 0,
          yesTests: Number(responseModel.getTestCompletionStats(id).average_percent_yes) || 0,
          yesMeds: Number(responseModel.getMedicationCompletionStats(id).average_percent_yes) || 0,
          topProblems: responseModel.getProblemAreaFrequency(id).map(p => p.problem_area),
          topPositives: responseModel.getPositiveAreaFrequency(id).map(p => p.positive_area),
          topPayMode: responseModel.getServicePaymentModes(id).most_common,
          areaSatisfaction: responseModel.getAreaSatisfactionWithScore(id)
        };
  
        return { ...facility, ...f, metrics };
      }).filter(Boolean); // remove nulls if facility not found
  
      if (facilities.length > 0) {
        worstBy = {
          area: worstCategory,
          worstFacilities: facilities.slice(0, 10)
        };
      }
  
    } else {
      // normal area based, not metric based
      let facilities = responseModel.getBestWorstByArea(worstCategory).worstFacilities || [];
  
      facilities = facilities.map(f => {
        const facility = facilityModel.getFacilityByCode(f.facility_code);
        if (!facility) return null;
  
        const id = facility.facility_id;
        const weightStats = responseModel.getWeightOfFacility(id) || {};
  
        const metrics = {
          avgWeight: weightStats.average_weight || 0,
          totalWeight: weightStats.total_weight || 0,
          totalResponses: weightStats.total_responses || 0,
          avgWait: responseModel.getWaitingTimeStats(id).average_wait_time_minutes || 0,
          avgSat: Number(responseModel.getSatisfactionDistribution(id).average) || 0,
          yesConfi: Number(responseModel.getConfidentialityStats(id).average_percent_yes) || 0,
          yesPerm: Number(responseModel.getPermissionBeforeExamStats(id).average_percent_yes) || 0,
          yesTests: Number(responseModel.getTestCompletionStats(id).average_percent_yes) || 0,
          yesMeds: Number(responseModel.getMedicationCompletionStats(id).average_percent_yes) || 0,
          topProblems: responseModel.getProblemAreaFrequency(id).map(p => p.problem_area),
          topPositives: responseModel.getPositiveAreaFrequency(id).map(p => p.positive_area),
          topPayMode: responseModel.getServicePaymentModes(id).most_common,
          areaSatisfaction: responseModel.getAreaSatisfactionWithScore(id)
        };
  
        return { ...facility, ...f, metrics };
      }).filter(Boolean);
  
      worstBy = {
        area: worstCategory,
        worstFacilities: facilities.slice(0, 10)
      };
    }
  }
  
   
  


  const sortedByWeight = [...filtered].sort((a, b) => {
    return (b.metrics.avgWeight || 0) - (a.metrics.avgWeight || 0);
  });

  
  

  const topThreeBest = sortedByWeight.slice(0, 10); 
  const bottomTenWorst = sortedByWeight.slice(-10).reverse();
  
  

  res.render("government", {
    username,
    filters: req.query,
    areas,
    bestBy,
    worstBy,
    results: filtered,
    topThreeBest,
    bottomTenWorst,
    toggled: false  
  });
});




module.exports = router;
