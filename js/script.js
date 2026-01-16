// js/script.js

(function () {
  var currentDate = new Date();
  var yearTarget = document.querySelector('[data-current-year]');
  var dateTarget = document.querySelector('[data-current-date]');

  if (yearTarget) {
    yearTarget.textContent = currentDate.getFullYear();
  }

  if (dateTarget) {
    dateTarget.textContent = currentDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  var announcements = [
    'Dual-language program applications open on Monday.',
    'Facilities inspection scheduled for Friday at 2 PM.',
    'New cafeteria vendor onboarding completed.'
  ];

  var announcementList = document.querySelector('#announcement-list');

  if (announcementList) {
    announcementList.innerHTML = announcements
      .map(function (item) {
        return '<li>• ' + item + '</li>';
      })
      .join('');
  }

  var progressBars = document.querySelectorAll('.progress-bar');
  progressBars.forEach(function (bar) {
    var progressValue = bar.getAttribute('data-progress');
    if (progressValue) {
      bar.style.width = progressValue + '%';
    }
  });

  var studentSearch = document.querySelector('#student-search');
  var studentRows = Array.prototype.slice.call(
    document.querySelectorAll('#student-table tbody tr')
  );
  var resultCount = document.querySelector('#student-result-count');

  function updateResultCount(visibleCount) {
    if (resultCount) {
      resultCount.textContent = visibleCount + ' students shown';
    }
  }

  if (studentRows.length) {
    updateResultCount(studentRows.length);
  }

  if (studentSearch) {
    studentSearch.addEventListener('input', function (event) {
      var query = event.target.value.toLowerCase().trim();
      var visible = 0;

      studentRows.forEach(function (row) {
        var rowText = row.textContent.toLowerCase();
        var matches = rowText.includes(query);
        row.style.display = matches ? '' : 'none';
        if (matches) {
          visible += 1;
        }
      });

      updateResultCount(visible);
    });
  }
})();
