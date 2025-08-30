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
    const ok = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
    if (nstatus) {
      nstatus.textContent = ok ? 'Thanks! Please check your inbox.' : 'Enter a valid email.';
    }
    if (ok) nform.reset();
  });
})();

// =========================
// 📖 Full-Site Markdown Router
// =========================
(async () => {
  const mdEl = qs('#md-content'); // FAQ area
  const serviceCards = qs('#serviceCards');
  const hairList = qs('#price-hair .price-list');
  const beautyList = qs('#price-beauty .price-list');
  const spaList = qs('#price-spa .price-list');

  try {
    const res = await fetch('content.md');
    if (!res.ok) throw new Error('Failed to fetch content.md');
    const md = await res.text();

    // --- Helpers to parse by headings ---
    const splitBy = (text, regex) => {
      const parts = [];
      let lastIndex = 0;
      for (const m of text.matchAll(regex)) {
        const index = m.index;
        if (index > lastIndex) {
          parts.push({ title: null, body: text.slice(lastIndex, index) });
        }
        lastIndex = index + m[0].length;
        parts.push({ title: m[1].trim(), body: '' });
      }
      if (lastIndex < text.length) {
        if (parts.length && parts[parts.length-1].title && parts[parts.length-1].body === '') {
          parts[parts.length-1].body = text.slice(lastIndex);
        } else {
          parts.push({ title: null, body: text.slice(lastIndex) });
        }
      }
      return parts;
    };

    // Build section map for "# Heading"
    const topMatches = [...md.matchAll(/^#\s+(.+)\s*$/gm)];
    const sections = {};
    if (topMatches.length === 0) {
      sections['FAQ'] = md; // fallback
    } else {
      for (let i = 0; i < topMatches.length; i++) {
        const start = topMatches[i].index + topMatches[i][0].length;
        const end = i + 1 < topMatches.length ? topMatches[i+1].index : md.length;
        const name = topMatches[i][1].trim();
        sections[name] = md.slice(start, end).trim();
      }
    }

    const subOf = (section, sub) => {
      const txt = sections[section] || '';
      const m = [...txt.matchAll(/^##\s+(.+)\s*$/gm)];
      if (m.length === 0) return '';
      for (let i = 0; i < m.length; i++) {
        const name = m[i][1].trim();
        if (name.toLowerCase() === sub.toLowerCase()) {
          const start = m[i].index + m[i][0].length;
          const end = i + 1 < m.length ? m[i+1].index : txt.length;
          return txt.slice(start, end).trim();
        }
      }
      return '';
    };

    const html = (mdtxt) => (typeof marked !== 'undefined') ? marked.parse(mdtxt || '') : (mdtxt || '');

    // --- Hero ---
    const heroTitle = subOf('Hero', 'Title');
    const heroSub = subOf('Hero', 'Subhead');
    if (qs('#hero-title')) qs('#hero-title').innerHTML = html(heroTitle);
    if (qs('#hero-subhead')) qs('#hero-subhead').innerHTML = html(heroSub);

    // --- About ---
    const aboutTitle = subOf('About', 'Title');
    if (qs('#about-title')) qs('#about-title').innerHTML = html(aboutTitle);
    const aboutParas = subOf('About', 'Paragraphs')
      .split(/^-\s+/gm).map(s => s.trim()).filter(Boolean);
    if (qs('#about-p1') && aboutParas[0]) qs('#about-p1').innerHTML = html(aboutParas[0]);
    if (qs('#about-p2') && aboutParas[1]) qs('#about-p2').innerHTML = html(aboutParas[1]);

    // --- Services ---
    if (qs('#services-title')) {
      const stitle = subOf('Services', 'Title');
      if (stitle) qs('#services-title').innerHTML = html(stitle);
    }
    if (qs('#services-subhead')) {
      const ssub = subOf('Services', 'Subhead');
      if (ssub) qs('#services-subhead').innerHTML = html(ssub);
    }
    const serviceItemsRaw = subOf('Services', 'Items')
      .split(/^\-\s+/gm).map(s => s.trim()).filter(Boolean);
    // Format: category | Title | Description | Price | tags (space-separated)
    if (serviceCards && serviceItemsRaw.length) {
      const cardHTML = serviceItemsRaw.map(line => {
        const parts = line.split('|').map(p => p.trim());
        const category = (parts[0] || '').toLowerCase();
        const title = parts[1] || '';
        const desc = parts[2] || '';
        const price = parts[3] || '';
        const tags = parts[4] || '';
        return `
          <article class="card service ${category}">
            <h3>${title}</h3>
            <p>${desc}</p>
            <div class="price">${price}</div>
            <div class="actions mt-1">
              <button class="btn small book-btn" data-service="${title}">Book</button>
              <button class="btn small outline">Details</button>
            </div>
          </article>
        `;
      }).join('');
      serviceCards.innerHTML = cardHTML;
      // rebind hover and book buttons for newly injected cards
      qsa('.card.service').forEach(card => {
        on(card, 'mouseenter', () => card.classList.add('hovered'));
        on(card, 'mouseleave', () => card.classList.remove('hovered'));
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
    }

    // --- Pricing ---
    const pricingSub = subOf('Pricing', 'Subhead');
    if (qs('#pricing-subhead') && pricingSub) qs('#pricing-subhead').innerHTML = html(pricingSub);

    const buildPriceList = (sectionName, ulEl) => {
      if (!ulEl) return;
      const txt = sections['Pricing'] || '';
      // find ### sectionName
      const regex = new RegExp('^###\\s+' + sectionName.replace(/([.*+?^${}()|[\\]\\\\])/g, '\\\\$1') + '\\s*$', 'm');
      const m = txt.match(regex);
      if (!m) return;
      const start = m.index + m[0].length;
      const next = txt.slice(start).match(/^###\s+/m);
      const endIdx = next ? start + next.index : txt.length;
      const body = txt.slice(start, endIdx).trim();
      const lines = body.split(/^\-\s+/gm).map(s => s.trim()).filter(Boolean);
      ulEl.innerHTML = lines.map(line => {
        const [label, price] = line.split('|').map(s=>s.trim());
        return `<li><span>${label}</span> <span>${price || ''}</span></li>`;
      }).join('');
    };

    buildPriceList('Hair Services', hairList);
    buildPriceList('Beauty & Makeup', beautyList);
    buildPriceList('Spa & Wellness', spaList);

    // --- Testimonials ---
    const tTitle = subOf('Testimonials', 'Title');
    if (qs('#testimonials-title') && tTitle) qs('#testimonials-title').innerHTML = html(tTitle);
    const tSub = subOf('Testimonials', 'Subhead');
    if (qs('#testimonials-subhead') && tSub) qs('#testimonials-subhead').innerHTML = html(tSub);
    const tItems = subOf('Testimonials', 'Items').split(/^\-\s+/gm).map(s=>s.trim()).filter(Boolean);
    const tGrid = qs('.testimonial-grid');
    if (tGrid && tItems.length) {
      tGrid.innerHTML = tItems.map(item => {
        const [quote, name] = item.split('|').map(s=>s.trim());
        return `<figure class="t-card"><blockquote>${quote}</blockquote><figcaption>— ${name || 'Guest'}</figcaption></figure>`;
      }).join('');
    }

    // --- Booking ---
    const bTitle = subOf('Booking', 'Title');
    if (qs('#booking-title') && bTitle) qs('#booking-title').innerHTML = html(bTitle);
    const bSub = subOf('Booking', 'Subhead');
    if (qs('#booking-subhead') && bSub) qs('#booking-subhead').innerHTML = html(bSub);

    // --- Contact ---
    const cTitle = subOf('Contact', 'Title');
    if (qs('#contact-title') && cTitle) qs('#contact-title').innerHTML = html(cTitle);
    const cSub = subOf('Contact', 'Subhead');
    if (qs('#contact-subhead') && cSub) qs('#contact-subhead').innerHTML = html(cSub);
    const cList = qs('#contact-list');
    const details = subOf('Contact', 'Details').split(/^\-\s+/gm).map(s=>s.trim()).filter(Boolean);
    if (cList && details.length) {
      cList.innerHTML = details.map(line => {
        const [label, value] = line.split('|').map(s=>s.trim());
        return `<li><strong>${label}:</strong> ${value || ''}</li>`;
      }).join('');
    }
    const socials = subOf('Contact', 'Socials').split(/^\-\s+/gm).map(s=>s.trim()).filter(Boolean);
    const socialWrap = qs('#socials-list');
    if (socialWrap && socials.length) {
      socialWrap.innerHTML = socials.map(line => {
        const [name, url] = line.split('|').map(s=>s.trim());
        const safe = (url && url !== '#') ? `href="${url}"` : 'href="#"';
        return `<a class="btn small ghost" ${safe} target="_blank" rel="noopener">${name}</a>`;
      }).join('');
    }

    // --- Gallery (titles only) ---
    const gTitle = subOf('Gallery', 'Title');
    if (qs('#gallery-title') && gTitle) qs('#gallery-title').innerHTML = html(gTitle);
    const gSub = subOf('Gallery', 'Subhead');
    if (qs('#gallery-subhead') && gSub) qs('#gallery-subhead').innerHTML = html(gSub);

    // --- FAQ ---
    const faq = sections['FAQ'] || '';
    if (mdEl && faq) mdEl.innerHTML = html(faq);

  } catch (err) {
    console.error('Markdown routing failed:', err);
    if (mdEl) mdEl.textContent = 'Unable to load content.';
  }
})();

// =========================
// 🧩 End of Script
