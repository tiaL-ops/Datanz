function openFacilityPopup(facility) {
    document.getElementById('facilityModal').style.display = 'flex';
  
    document.getElementById('modalFacilityName').textContent = facility.name;
  
    const m = facility.metrics;
  
    const html = `
      <tr>
        <td>${facility.name}</td>
        <td>${facility.facility_code}</td>
        <td>${facility.location}</td>
        <td>${m.avgWait.toFixed(1)} min</td>
        <td>${m.avgSat}</td>
        <td>${(100 - m.yesConfi).toFixed(0)}%</td>
        <td>${(100 - m.yesPerm).toFixed(0)}%</td>
        <td>${(100 - m.yesTests).toFixed(0)}%</td>
        <td>${(100 - m.yesMeds).toFixed(0)}%</td>
        <td>${m.topPayMode || '-'}</td>
        <td>${m.topProblems.slice(0,3).join(", ") || '-'}</td>
        <td>${m.topPositives.slice(0,3).join(", ") || '-'}</td>
      </tr>
    `;
  
    document.getElementById('modalFacilityDetails').innerHTML = html;
  }

  function closeFacilityPopup() {
    document.getElementById('facilityModal').style.display = 'none';
  }
  function setLastMonth() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
  
    document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
  }
  