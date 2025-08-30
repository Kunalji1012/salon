document.addEventListener('DOMContentLoaded', function () {
  // =========================
  // 🌐 Utility Helpers
  // =========================
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // =========================
  // ⏳ Loader
  // =========================
  const loader = qs('#page-loader');
  window.addEventListener('load', () => {
    if (!loader) return;
    setTimeout(() => loader.classList.add('hide'), 350);
    setTimeout(() => loader.remove(), 900);
  });

  // =========================
  // 📅 Year in Footer
  // =========================
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // =========================
  // 🎨 Theme Toggle (data-theme)
  // =========================
  const toggle = qs('#themeToggle');
  if (toggle) {
    on(toggle, 'click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      toggle.textContent = isDark ? '🌙' : '☀️';
    });
  }

  // =========================
  // 📜 Smooth Scroll
  // =========================
  qsa('.nav-links a').forEach(link => {
    on(link, 'click', e => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const target = qs(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // =========================
  // 🖼️ Hero Slider
  // =========================
  (() => {
    const slidesWrap = qs('#slides');
    if (!slidesWrap) return;

    const slides = qsa('.slide', slidesWrap);
    let i = 0;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slidesWrap.style.transform = `translateX(-${i * 100}%)`;
    };

    const next = qs('#nextSlide');
    const prev = qs('#prevSlide');
    on(next, 'click', () => go(i + 1));
    on(prev, 'click', () => go(i - 1));

    setInterval(() => go(i + 1), 5000);
  })();

  // =========================
  // 💇 Service Cards Hover
  // =========================
  qsa('.card.service').forEach(card => {
    on(card, 'mouseenter', () => card.classList.add('hovered'));
    on(card, 'mouseleave', () => card.classList.remove('hovered'));
  });

  // =========================
  // 📝 Booking Form Validation
  // =========================
  (() => {
    const form = qs('#bookForm');
    if (!form) return;

    const status = qs('#formStatus');
    const fields = ['name', 'phone', 'service', 'date'];
    const errors = {
      name: 'Enter your name.',
      phone: 'Enter a valid phone number.',
      service: 'Choose a service.',
      date: 'Pick a date.'
    };

    const validPhone = v => /^[6-9]\d{9}$/.test(v) || /^\+91\s?[6-9]\d{9}$/.test(v);

    const showError = (input, msg) => {
      let err = input.nextElementSibling;
      if (!err || !err.classList.contains('error')) {
        err = document.createElement('div');
        err.className = 'error';
        input.insertAdjacentElement('afterend', err);
      }
      err.textContent = msg;
    };

    on(form, 'submit', e => {
      e.preventDefault();
      let ok = true;
      fields.forEach(id => {
        const input = qs('#' + id);
        let msg = '';
        if (!input.value.trim()) msg = errors[id];
        if (id === 'phone' && input.value.trim() && !validPhone(input.value)) msg = errors[id];
        showError(input, msg);
        if (msg) ok = false;
      });

      if (!ok) {
        if (status) status.textContent = 'Please fix the highlighted fields.';
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      if (status) status.textContent = "Booking confirmed! We'll WhatsApp you shortly.";
      console.log('Booking:', data);
      form.reset();
    });

    fields.forEach(id => {
      const input = qs('#' + id);
      if (!input) return;
      on(input, 'input', () => showError(input, ''));
      on(input, 'blur', () => {
        if (!input.value.trim()) showError(input, errors[id]);
        if (id === 'phone' && input.value.trim() && !validPhone(input.value)) {
          showError(input, errors[id]);
        }
      });
    });

    qsa('.book-btn').forEach(btn => {
      on(btn, 'click', () => {
        const s = btn.dataset.service || '';
        const sel = qs('#service');
        if (sel && s) sel.value = s;
        const section = qs('#booking');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    });
  })();

  // =========================
  // 📧 Newsletter Form
  // =========================
  (() => {
    const nform = qs('#newsletterForm');
    if (!nform) return;

    const emailInput = qs('#email', nform);
    const nstatus = qs('.nstatus', nform);

    on(nform, 'submit', e => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (nstatus) {
        nstatus.textContent = ok ? 'Thanks! Please check your inbox.' : 'Enter a valid email.';
      }
      if (ok) nform.reset();
    });
  })();

  // =========================
  // 🧩 Service Filters
  // =========================
  (() => {
    const chips = qsa('.chip');
    const cards = qsa('#serviceCards .card.service');
    if (!chips.length || !cards.length) return;

    chips.forEach(chip => {
      on(chip, 'click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        cards.forEach(card => {
          const tags = card.className;
          card.style.display = (filter === 'all' || tags.includes(filter)) ? '' : 'none';
        });
      });
    });
  })();

  // =========================
  // 📱 Mobile Nav Toggle
  // =========================
  (() => {
    const navToggle = qs('#navToggle');
    const navLinks = qs('#primary-menu');
    if (!navToggle || !navLinks) return;

    on(navToggle, 'click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('show');
    });
  })();
});
