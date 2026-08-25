(() => {
  const forms = document.querySelectorAll('[data-form]');
  forms.forEach((form) => {
    const note = form.querySelector('[data-note]');
    const answer = form.querySelector('input[name="kc_captcha"]');
    const buttons = form.querySelectorAll('.choices button');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        answer.value = btn.dataset.answer;
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const payload = Object.fromEntries(new FormData(form));
      note.className = 'form-note';
      note.textContent = 'Sending...';
      submit.disabled = true;
      try {
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        note.className = 'form-note ' + (body.ok ? 'ok' : 'err');
        note.textContent = body.ok ? body.message : body.error;
        if (body.ok) {
          form.reset();
          answer.value = '';
          buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        }
      } catch {
        note.className = 'form-note err';
        note.textContent = 'Network error. Please try again.';
      } finally {
        submit.disabled = false;
      }
    });
  });
})();
