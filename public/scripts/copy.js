(function () {
  'use strict';

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;

    var directText = btn.getAttribute('data-copy-text');
    var targetId = btn.getAttribute('data-copy-target');
    var text = directText;

    if (!text && targetId) {
      var codeEl = document.getElementById(targetId);
      text = codeEl ? codeEl.textContent : '';
    }
    if (!text) return;

    var originalLabel = btn.textContent;

    function flash(label) {
      btn.textContent = label;
      setTimeout(function () {
        btn.textContent = originalLabel;
      }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { flash('Copied!'); },
        function () { flash('Copy failed'); }
      );
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        flash('Copied!');
      } catch (err) {
        flash('Copy failed');
      }
      document.body.removeChild(textarea);
    }
  });
})();
