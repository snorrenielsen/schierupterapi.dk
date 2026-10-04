const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('navigation') || document.querySelector('nav');

toggle?.addEventListener('click', () => {
  const isOpen = toggle.classList.toggle('active');
  nav.classList.toggle('open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  toggle?.classList.remove('active');
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));

// Headeren må aldrig stå skjult når mobilmenuen åbnes eller lukkes
toggle?.addEventListener('click', updateHeader);

// ---------------------------------------------------------------
// ---------------------------------------------------------------
// Skjul headeren ved scroll ned, vis den igen ved scroll op
// ---------------------------------------------------------------
const siteHeader = document.querySelector('.site-header');
let lastScrollY = window.scrollY;
let scrollTicking = false;

function updateHeader() {
  scrollTicking = false;
  // Mens mobilmenuen er åben skal headeren blive liggende
  const menuOpen = toggle?.classList.contains('active');
  const y = Math.max(0, window.scrollY);

  if (menuOpen || y < 120) {
    siteHeader?.classList.remove('is-hidden');
  } else if (y > lastScrollY) {
    siteHeader?.classList.add('is-hidden');
  } else {
    siteHeader?.classList.remove('is-hidden');
  }

  lastScrollY = y;
}

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateHeader);
}, { passive: true });

// FAQ-ankere
// "Læs mere"-links i kortene peger på #parterapi, #familieterapi og
// #oplevelsesorienteret-terapi. En lukket <details> kan ikke få
// scrollet til af sig selv, så vi åbner den og ruller ned manuelt.
// ---------------------------------------------------------------
function openFaqFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  if (target.tagName === 'DETAILS') target.open = true;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.addEventListener('hashchange', openFaqFromHash);
window.addEventListener('load', openFaqFromHash);

// Citaterne læses fra markup'en i index.html, så du kan rette teksten der.
// Tilføj eller fjern et <blockquote class="quote-slide"> for at ændre antallet.
const quotes = Array.from(
  document.querySelectorAll('.quote-viewport .quote-slide'),
  (slide) => slide.innerHTML.trim()
);

const quoteSection = document.querySelector('.testimonial-strip');
const quoteViewport = document.querySelector('.quote-viewport');
const dots = document.querySelector('[data-quote-dots]');
let currentQuote = 0;
let quoteTimer;

function showQuote(index) {
  currentQuote = (index + quotes.length) % quotes.length;
  quoteViewport.innerHTML = `
    <blockquote class="quote-slide is-active">${quotes[currentQuote]}</blockquote>`;
  dots.querySelectorAll('button').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === currentQuote);
    dot.setAttribute('aria-current', i === currentQuote ? 'true' : 'false');
  });
}

if (quoteSection && dots && quotes.length) {
  quotes.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Vis citat ${index + 1}`);
    dot.addEventListener('click', () => {
      showQuote(index);
      restartQuoteTimer();
    });
    dots.appendChild(dot);
  });

  document.querySelector('[data-quote-prev]')?.addEventListener('click', () => {
    showQuote(currentQuote - 1);
    restartQuoteTimer();
  });
  document.querySelector('[data-quote-next]')?.addEventListener('click', () => {
    showQuote(currentQuote + 1);
    restartQuoteTimer();
  });

  function restartQuoteTimer() {
    clearInterval(quoteTimer);
    quoteTimer = setInterval(() => showQuote(currentQuote + 1), 7000);
  }

  showQuote(0);
  restartQuoteTimer();
}

// ---------------------------------------------------------------
// Formularbeskyttelse
// Static site med formsubmit.co understøtter ingen CAPTCHA, så vi
// bruger to simple filtre: et honeypot-felt (skjult felt som bots
// udfylder) og en tidsgrænse (reelle brugere bruger mere end 3 sek.).
// Uden JavaScript sendes formularen stadig – bare uden filtrene.
// ---------------------------------------------------------------
const MIN_FILL_MS = 3000;
const pageLoadedAt = Date.now();

function setStatus(form, message, isError) {
  const status = form.querySelector('.form-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('show', Boolean(message));
  status.classList.toggle('is-error', Boolean(isError));
}

document.querySelectorAll('form.form').forEach((form) => {
  const honeypot = form.querySelector('input[name="website"]');
  const submit = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (event) => {
    const botFilledHoneypot = honeypot && honeypot.value !== '';
    const filledTooFast = Date.now() - pageLoadedAt < MIN_FILL_MS;

    if (botFilledHoneypot || filledTooFast) {
      event.preventDefault();
      setStatus(form, 'Beskeden kunne ikke sendes. Prøv venligst igen om et øjeblik.', true);
      return;
    }

    if (submit) submit.disabled = true;
    setStatus(form, 'Tak! Jeg vender tilbage hurtigst muligt.', false);
  });
});
