(function () {
  'use strict';

  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  if (!input || !list) return;

  var index = null;
  var indexPromise = null;
  var activeIndex = -1;
  var MAX_RESULTS = 8;

  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data;
        return data;
      })
      .catch(function () {
        index = [];
        return index;
      });
    return indexPromise;
  }

  // Warm the index as soon as the page is interactive.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadIndex);
  } else {
    setTimeout(loadIndex, 200);
  }

  function fuzzyScore(query, target) {
    if (!query) return 0;
    if (!target) return -1;
    query = query.toLowerCase();
    target = target.toLowerCase();
    if (target.indexOf(query) !== -1) {
      return 100 + (target.indexOf(query) === 0 ? 50 : 0) - Math.min(target.length, 40) * 0.2;
    }
    var ti = 0, score = 0, consecutive = 0;
    for (var qi = 0; qi < query.length; qi++) {
      var idx = target.indexOf(query[qi], ti);
      if (idx === -1) return -1;
      if (idx === ti) {
        consecutive++;
        score += 3 + consecutive;
      } else {
        consecutive = 0;
        score += 1;
      }
      ti = idx + 1;
    }
    return score;
  }

  function scoreItem(query, item) {
    var best = -Infinity;
    var isNumeric = /^\d+$/.test(query);
    var codeStr = String(item.code);

    if (isNumeric) {
      if (codeStr === query) return 1000;
      if (codeStr.indexOf(query) === 0) best = Math.max(best, 500 - codeStr.length);
    }

    var nameScore = fuzzyScore(query, item.name);
    if (nameScore >= 0) best = Math.max(best, nameScore * 4 + 200);

    if (codeStr.indexOf(query) !== -1) best = Math.max(best, 260);

    var summaryScore = fuzzyScore(query, item.summary);
    if (summaryScore >= 0) best = Math.max(best, summaryScore * 2);

    var kwScore = fuzzyScore(query, item.keywords);
    if (kwScore >= 0) best = Math.max(best, kwScore * 2.5);

    return best;
  }

  function search(query) {
    if (!index) return [];
    query = query.trim();
    if (!query) return [];
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var s = scoreItem(query, index[i]);
      if (s > -Infinity) scored.push({ item: index[i], score: s });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, MAX_RESULTS).map(function (x) { return x.item; });
  }

  function categoryLabel(cat) {
    return {
      informational: 'Informational',
      success: 'Success',
      redirection: 'Redirection',
      'client-error': 'Client Error',
      'server-error': 'Server Error',
    }[cat] || cat;
  }

  function render(results, query) {
    list.innerHTML = '';
    activeIndex = -1;

    if (!results.length) {
      var empty = document.createElement('li');
      empty.className = 'search-empty';
      empty.setAttribute('role', 'presentation');
      empty.textContent = query
        ? 'No matching status codes. Try a code number, name, or symptom.'
        : 'Start typing to search…';
      list.appendChild(empty);
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      input.removeAttribute('aria-activedescendant');
      return;
    }

    results.forEach(function (item, i) {
      var li = document.createElement('li');
      li.id = 'search-result-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.className = 'search-result';
      li.tabIndex = -1;

      var codeSpan = document.createElement('span');
      codeSpan.className = 'code-num badge-' + item.category;
      codeSpan.textContent = item.code;

      var body = document.createElement('span');
      body.className = 'search-result-body';

      var nameEl = document.createElement('span');
      nameEl.className = 'search-result-name';
      nameEl.textContent = item.name + ' · ' + categoryLabel(item.category);

      var summaryEl = document.createElement('span');
      summaryEl.className = 'search-result-summary';
      summaryEl.textContent = item.summary;

      body.appendChild(nameEl);
      body.appendChild(summaryEl);
      li.appendChild(codeSpan);
      li.appendChild(body);

      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        navigateTo(item.code);
      });
      li.addEventListener('mouseenter', function () {
        setActive(i);
      });

      list.appendChild(li);
    });

    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function setActive(i) {
    var options = list.querySelectorAll('[role="option"]');
    options.forEach(function (opt) { opt.setAttribute('aria-selected', 'false'); });
    activeIndex = i;
    if (i >= 0 && options[i]) {
      options[i].setAttribute('aria-selected', 'true');
      options[i].scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', options[i].id);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function navigateTo(code) {
    window.location.href = '/' + code;
  }

  function closeList() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }

  var currentResults = [];

  function runSearch() {
    loadIndex().then(function () {
      currentResults = search(input.value);
      render(currentResults, input.value.trim());
    });
  }

  input.addEventListener('input', runSearch);

  input.addEventListener('focus', function () {
    if (input.value.trim()) runSearch();
  });

  input.addEventListener('keydown', function (e) {
    var options = list.querySelectorAll('[role="option"]');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (list.hidden) { runSearch(); return; }
      if (options.length) setActive(Math.min(activeIndex + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (options.length) setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        navigateTo(currentResults[activeIndex].code);
      } else if (currentResults.length === 1) {
        e.preventDefault();
        navigateTo(currentResults[0].code);
      }
    } else if (e.key === 'Escape') {
      if (!list.hidden) {
        e.preventDefault();
        closeList();
      } else {
        input.blur();
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-combobox')) closeList();
  });

  // Global "/" shortcut to focus search, unless already typing somewhere.
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    var active = document.activeElement;
    var tag = active && active.tagName ? active.tagName.toLowerCase() : '';
    var isEditable = tag === 'input' || tag === 'textarea' || (active && active.isContentEditable);
    if (isEditable) return;
    e.preventDefault();
    input.focus();
    input.select();
  });

  // Check if URL has ?q= parameter
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var q = urlParams.get('q');
    if (q) {
      input.value = q;
      runSearch();
    }
  } catch (err) {}
})();
