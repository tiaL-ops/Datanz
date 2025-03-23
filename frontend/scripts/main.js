document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const facilityList = document.getElementById('facilityList');
    const facilities = facilityList.getElementsByTagName('li');
  
    // Filter the list as the user types
    searchInput.addEventListener('input', function() {
      const filter = searchInput.value.toLowerCase();
      for (let i = 0; i < facilities.length; i++) {
        const facilityName = facilities[i].textContent.toLowerCase();
        if (facilityName.indexOf(filter) > -1) {
          facilities[i].classList.remove('hidden');
        } else {
          facilities[i].classList.add('hidden');
        }
      }
    });
  });
  