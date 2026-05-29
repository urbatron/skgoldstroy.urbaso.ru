(function () {
  const YM_ID = window.YM_COUNTER_ID || null;

  function reachGoal(name, params = {}) {
    if (YM_ID && typeof window.ym === 'function') {
      window.ym(YM_ID, 'reachGoal', name, params);
    }
    window.dispatchEvent(new CustomEvent('goldstroy:goal', { detail: { name, params } }));
  }

  function initMetrikaScaffold() {
    if (!YM_ID || window.ym) return;
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  function initHeader() {
    const header = document.getElementById('header');
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (burger && nav) {
      burger.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('active');
        burger.classList.toggle('active', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
        if (isOpen) reachGoal('open_lead_menu');
      });
      nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
        nav.classList.remove('active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }));
    }
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function phoneMask(input) {
    const digits = input.value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
    let value = digits;
    if (digits.startsWith('7')) value = '+7';
    if (digits.length > 1) value += ' ' + digits.slice(1, 4);
    if (digits.length >= 5) value += ' ' + digits.slice(4, 7);
    if (digits.length >= 8) value += '-' + digits.slice(7, 9);
    if (digits.length >= 10) value += '-' + digits.slice(9, 11);
    input.value = value;
  }

  function getUtm() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    params.forEach((value, key) => {
      if (key.startsWith('utm_') || ['yclid', 'gclid', 'fbclid', 'vkclid'].includes(key)) result[key] = value;
    });
    if (Object.keys(result).length) localStorage.setItem('goldstroy_utm', JSON.stringify(result));
    return result;
  }

  function showFormMessage(form, text, type) {
    let box = form.querySelector('.form-message');
    if (!box) {
      box = document.createElement('p');
      box.className = 'form-message';
      form.appendChild(box);
    }
    box.textContent = text;
    box.dataset.type = type;
  }

  function initForms() {
    const currentUtm = getUtm();
    const storedUtm = localStorage.getItem('goldstroy_utm');
    document.querySelectorAll('input[name="phone"]').forEach((input) => {
      input.addEventListener('input', () => phoneMask(input));
    });
    document.querySelectorAll('form[data-form]').forEach((form) => {
      const pageInput = form.querySelector('input[name="page_url"]');
      const utmInput = form.querySelector('input[name="utm"]');
      if (pageInput) pageInput.value = window.location.href;
      if (utmInput) utmInput.value = JSON.stringify(Object.keys(currentUtm).length ? currentUtm : (storedUtm ? JSON.parse(storedUtm) : {}));
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (form.elements.company && form.elements.company.value) return;
        if (!form.checkValidity()) {
          form.reportValidity();
          showFormMessage(form, 'Заполните обязательные поля и согласие на обработку данных.', 'error');
          return;
        }
        const button = form.querySelector('button[type="submit"]');
        const original = button ? button.textContent : '';
        if (button) { button.disabled = true; button.textContent = 'Отправка...'; }
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.source = document.title;
        payload.path = window.location.pathname;
        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error('Network response was not ok');
          reachGoal(`form_${form.dataset.form || 'lead'}_success`, payload);
          window.location.href = '/thank-you/';
        } catch (error) {
          reachGoal(`form_${form.dataset.form || 'lead'}_fallback`, payload);
          showFormMessage(form, 'Заявка зафиксирована на сайте. Если ответ нужен срочно, напишите в Telegram или WhatsApp.', 'success');
          form.reset();
        } finally {
          if (button) { button.disabled = false; button.textContent = original; }
        }
      });
    });
  }

  function initGoals() {
    document.querySelectorAll('[data-goal]').forEach((element) => {
      element.addEventListener('click', () => reachGoal(element.dataset.goal, { href: element.getAttribute('href') || '' }));
    });
  }

  function initFilters() {
    const buttons = document.querySelectorAll('.filters [data-filter]');
    const cards = document.querySelectorAll('.project-card');
    buttons.forEach((button) => button.addEventListener('click', () => {
      const filter = button.dataset.filter.toLowerCase();
      buttons.forEach((item) => item.classList.toggle('active', item === button));
      cards.forEach((card) => {
        const haystack = `${card.dataset.area || ''} ${card.dataset.material || ''} ${card.dataset.style || ''} ${card.textContent}`.toLowerCase();
        card.hidden = filter !== 'все' && !haystack.includes(filter.replace(' м²', ''));
      });
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMetrikaScaffold();
    initHeader();
    initSmoothScroll();
    initForms();
    initGoals();
    initFilters();
  });
})();
