

function lefti(id) {
    console.log("hiiii left");
    const container = document.getElementById(id);
    if (container) {
      container.scrollBy({
        left: -300,
        behavior: 'smooth' 
      });
     
    } else {
      console.error("Scroll container not found with ID:", id);
    }
  }

  function scrollRight(id) {
    console.log("hiiii right");
    const container = document.getElementById(id);
     if (container) {
      container.scrollBy({
        left: 300, 
        behavior: 'smooth' 
      });
    
     } else {
       console.error("Scroll container not found with ID:", id);
     }
  }

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

window.addEventListener('DOMContentLoaded', () => {
  loadTrendData();
});
//trend dchart
let chart = null;

function drawTrend(trendData) {
const ctx = document.getElementById('timeTrendChart').getContext('2d');



if (chart) {
  chart.destroy();  // destroy previous chart
}

chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: trendData.map(item => item.date),
    datasets: [{
      label: 'Average Satisfaction',
      data: trendData.map(item => item.average_satisfaction),
      fill: false,
      borderColor: 'blue',
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Satisfaction Score' }, min: 0, max: 5 }
    }
  }
});
}


const trendSelect = document.getElementById('trendFacilitySelect');
const startInput  = document.getElementById('startDate');
const endInput    = document.getElementById('endDate');

trendSelect.addEventListener('change', loadTrendData);
startInput?.addEventListener('change', loadTrendData);
endInput?.addEventListener('change', loadTrendData);


window.addEventListener('DOMContentLoaded', loadTrendData);

async function loadTrendData() {
const selected  = trendSelect.value;
const startDate = startInput?.value || '';
const endDate   = endInput?.value   || '';

let url;
if (selected === 'all') {
  url = `/government/api/trend-all?startDate=${startDate}&endDate=${endDate}`;
} 
else if (selected.startsWith('facility-')) {
  // facility-123 → 123
  const facilityId = selected.substring('facility-'.length);
  url = `/government/api/trend/${facilityId}?startDate=${startDate}&endDate=${endDate}`;
} 
else if (selected.startsWith('region-')) {
  // region-North → North
  const regionName = selected.substring('region-'.length);
  url = `/government/api/trend-region/${encodeURIComponent(regionName)}?startDate=${startDate}&endDate=${endDate}`;
} 
else {
  console.error('Invalid selection:', selected);
  return;
}

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  drawTrend(data);
} catch (err) {
  console.error('Error fetching trend data:', err);
}
}
// Select the DATANZ link
const datanzLink = document.getElementById("datanzLink");

// Add a click event listener
datanzLink.addEventListener("click", (event) => {
event.preventDefault(); // Prevent the default link behavior

// Display a confirmation dialog
const userConfirmed = confirm(
  "You are leaving the Government page. Click Cancel to abort action or OK to return to the main page."
);

// If the user clicks "OK", navigate to the main page
if (userConfirmed) {
  window.location.href = "/"; // Redirect to the main page
}
});

const backToTopBtn = document.getElementById("backToTop");

// Show button when page is scrolled
window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

// Smooth scroll to top
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

