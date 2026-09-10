(function () {
  'use strict';

  var chipContainer = document.getElementById('filter-chips');
  var cards = document.querySelectorAll('[data-card-category]');
  var sections = document.querySelectorAll('[data-section-category]');
  var emptyState = document.getElementById('filter-empty');
  if (!chipContainer || !cards.length) return;

  var chips = Array.prototype.slice.call(chipContainer.querySelectorAll('.chip'));

  function applyFilter(category, pushState) {
    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.category === category));
    });

    var visibleCount = 0;
    cards.forEach(function (card) {
      var matches;
      if (category === 'all') {
        matches = true;
      } else if (category === 'nonstandard') {
        matches = card.dataset.cardStandard === 'nonstandard';
      } else {
        matches = card.dataset.cardCategory === category;
      }
      card.hidden = !matches;
      if (matches) visibleCount++;
    });

    sections.forEach(function (section) {
      var hasVisible = section.querySelector('[data-card-category]:not([hidden])') !== null;
      section.hidden = !hasVisible;
    });

    if (emptyState) emptyState.hidden = visibleCount > 0;

    if (pushState) {
      var url = new URL(window.location.href);
      if (category === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', category);
      }
      window.history.replaceState({}, '', url);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      applyFilter(chip.dataset.category, true);
    });
  });

  var initial = new URL(window.location.href).searchParams.get('category') || 'all';
  applyFilter(initial, false);
})();
