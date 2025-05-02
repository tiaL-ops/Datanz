const express = require("express");
const router = express.Router();
const { connectToDatabase } = require("../../db/database");
const FacilityModel = require("../../db/models/FacilityModel");
const ResponseModel = require("../../db/models/ResponseModel");

const db = connectToDatabase();
const facilityModel = new FacilityModel(db);
const responseModel = new ResponseModel(db);

router.get("/", (req, res) => {

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
    negativeCategory,
    startDate,
    endDate,

    timeQuestionId
  } = req.query;

  // Load facilities
  let facilities;
  if (region) {
    facilities = db
      .prepare(`SELECT * FROM Facility WHERE location LIKE ?`)
      .all(`${region}%`);
  } else {
    facilities = db.prepare(`SELECT * FROM Facility`).all();
  }


  let timeFilteredWeights = [];
  let timeQuestion = timeQuestionId ? Number(timeQuestionId) : 17;

  if (startDate && endDate) {
    timeFilteredWeights = responseModel.getFacilityWeightbyTime(timeQuestion, startDate, endDate);
  }

  // Map facilities to metrics
  const results = facilities.map(f => {
    const id = f.facility_id;

    // Choose weight data
    let weightStats = {};
    if (startDate && endDate) {
      const found = timeFilteredWeights.find(w => w.facility_id === id);
      weightStats = found || {};
    } else {
      weightStats = responseModel.getWeightOfFacility(id) || {};
    }

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

    return { ...f, metrics };
  });

  // Apply Filters
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

  // Best and Worst Category handling
  let bestBy = null;
  if (bestCategory) {
    bestBy = responseModel.getBestWorstByArea(bestCategory);
  }

  let worstBy = null;
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
    } else {
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

  // Sorting
  const sortedByWeight = [...filtered].sort((a, b) => {
    return (b.metrics.avgWeight || 0) - (a.metrics.avgWeight || 0);
  });

  const topThreeBest = sortedByWeight.slice(0, 10);
  const bottomTenWorst = sortedByWeight.slice(-10).reverse();

  // overall avergae wait
    const weights = filtered.map(item => item.metrics.avgWeight || 0);
    const total = weights.reduce((sum, w) => sum + w, 0);
    const averageWeight = total / weights.length;


    const belowAverage = filtered.filter(item => (item.metrics.avgWeight || 0) < averageWeight);
    const countBelowAverage = belowAverage.length;
  

    const worstPerformers = [...belowAverage].sort((a, b) => {
  return (a.metrics.avgWeight || 0) - (b.metrics.avgWeight || 0);
});

  // Render
  const lang = req.query.lang || 'en';
  const trendData = responseModel.getAverageSatisfactionOverTime(startDate || '2024-01-01', endDate || '2024-12-31');
  res.render("government", {
    username,
    filters: req.query,
    areas,
    bestBy,
    worstBy,
    results: filtered,
    topThreeBest,
    bottomTenWorst,
    trendData,
    belowAverage,
    countBelowAverage,
    currentLang: lang,
    toggled: false
  });
});

router.get("/worst", (req, res) => {

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
    negativeCategory,
    startDate,
    endDate,

    timeQuestionId
  } = req.query;

  // Load facilities
  let facilities;
  if (region) {
    facilities = db
      .prepare(`SELECT * FROM Facility WHERE location LIKE ?`)
      .all(`${region}%`);
  } else {
    facilities = db.prepare(`SELECT * FROM Facility`).all();
  }


  let timeFilteredWeights = [];
  let timeQuestion = timeQuestionId ? Number(timeQuestionId) : 17;

  if (startDate && endDate) {
    timeFilteredWeights = responseModel.getFacilityWeightbyTime(timeQuestion, startDate, endDate);
  }

  // Map facilities to metrics
  const results = facilities.map(f => {
    const id = f.facility_id;

    // Choose weight data
    let weightStats = {};
    if (startDate && endDate) {
      const found = timeFilteredWeights.find(w => w.facility_id === id);
      weightStats = found || {};
    } else {
      weightStats = responseModel.getWeightOfFacility(id) || {};
    }

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

    return { ...f, metrics };
  });

  // Apply Filters
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

  // Best and Worst Category handling
  let bestBy = null;
  if (bestCategory) {
    bestBy = responseModel.getBestWorstByArea(bestCategory);
  }

  let worstBy = null;
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
    } else {
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

  // Sorting
  const sortedByWeight = [...filtered].sort((a, b) => {
    return (b.metrics.avgWeight || 0) - (a.metrics.avgWeight || 0);
  });

  const topThreeBest = sortedByWeight.slice(0, 10);
  const bottomTenWorst = sortedByWeight.slice(-10).reverse();

  // Render
  const lang = req.query.lang || 'en';
  const trendData = responseModel.getAverageSatisfactionOverTime(startDate || '2024-01-01', endDate || '2024-12-31');
  res.render("worst", {
    username,
    filters: req.query,
    areas,
    bestBy,
    worstBy,
    results: filtered,
    topThreeBest,
    bottomTenWorst,
    trendData,
    currentLang: lang,
    toggled: false
  });
});

router.get("/advanced-search", (req, res) => {

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
    negativeCategory,
    startDate,
    endDate,

    timeQuestionId
  } = req.query;

  // Load facilities
  let facilities;
  if (region) {
    facilities = db
      .prepare(`SELECT * FROM Facility WHERE location LIKE ?`)
      .all(`${region}%`);
  } else {
    facilities = db.prepare(`SELECT * FROM Facility`).all();
  }


  let timeFilteredWeights = [];
  let timeQuestion = timeQuestionId ? Number(timeQuestionId) : 17;

  if (startDate && endDate) {
    timeFilteredWeights = responseModel.getFacilityWeightbyTime(timeQuestion, startDate, endDate);
  }

  // Map facilities to metrics
  const results = facilities.map(f => {
    const id = f.facility_id;

    // Choose weight data
    let weightStats = {};
    if (startDate && endDate) {
      const found = timeFilteredWeights.find(w => w.facility_id === id);
      weightStats = found || {};
    } else {
      weightStats = responseModel.getWeightOfFacility(id) || {};
    }

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

    return { ...f, metrics };
  });

  // Apply Filters
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

  // Best and Worst Category handling
  let bestBy = null;
  if (bestCategory) {
    bestBy = responseModel.getBestWorstByArea(bestCategory);
  }

  let worstBy = null;
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
    } else {
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

  // Sorting
  const sortedByWeight = [...filtered].sort((a, b) => {
    return (b.metrics.avgWeight || 0) - (a.metrics.avgWeight || 0);
  });

  const topThreeBest = sortedByWeight.slice(0, 10);
  const bottomTenWorst = sortedByWeight.slice(-10).reverse();

  // Render
  const lang = req.query.lang || 'en';
  const trendData = responseModel.getAverageSatisfactionOverTime(startDate || '2024-01-01', endDate || '2024-12-31');
  res.render("advanced", {
    username,
    filters: req.query,
    areas,
    bestBy,
    worstBy,
    results: filtered,
    topThreeBest,
    bottomTenWorst,
    trendData,
    currentLang:lang,
    toggled: false
  });
});

router.get("/api/trend/:facilityId", (req, res) => {
  const { facilityId } = req.params;
  const { startDate, endDate } = req.query;

  let trendData = [];
  if (facilityId) {
    trendData = responseModel.getAverageSatisfactionOverTimeFacilities(facilityId, startDate || '2020-01-01', endDate || '2100-01-01');
  }

  res.json(trendData);
});

router.get('/api/trend-all', (req, res) => {
  const { startDate, endDate } = req.query;
  const trend = responseModel.getAverageSatisfactionOverTime(startDate || '2024-01-01', endDate || '2024-12-31');

  res.json(trend);
});
router.get("/api/trend-region/:region", (req, res) => {
  console.log("called aoi region");
  const { region } = req.params;
  const { startDate, endDate } = req.query;

  try {
    let data = responseModel.getAverageSatisfactionOverTimeRegion(region, startDate || "2024-01-01", endDate || '2024-12-31');

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch region trend data." });
  }
});



module.exports = router;
