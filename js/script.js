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
        if (anchor.matches('[data-modal-open]')) return;
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }


  function ensureLeadModal() {
    let modal = document.getElementById('lead-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'lead-modal';
    modal.id = 'lead-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="lead-modal__backdrop" data-modal-close></div>
      <div class="lead-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
        <button class="lead-modal__close" type="button" data-modal-close aria-label="Закрыть окно">×</button>
        <h2 id="lead-modal-title">Оставьте телефон — мы свяжемся с вами</h2>
        <p>Уточним задачу, ответим на вопросы и подскажем, с чего начать расчет строительства.</p>
        <form class="lead-form modal-form" data-form="modal_lead" action="/thank-you/" method="post">
          <input type="text" name="company" class="hp" tabindex="-1" autocomplete="off">
          <input type="hidden" name="page_url">
          <input type="hidden" name="utm">
          <input type="hidden" name="form_type" value="modal_lead">
          <label>Имя<input name="name" autocomplete="name" placeholder="Ваше имя"></label>
          <label>Телефон<input name="phone" inputmode="tel" autocomplete="tel" required placeholder="+7 ___ ___-__-__"></label>
          <label class="policy"><input type="checkbox" name="policy" required> Согласен с <a href="/privacy/">политикой конфиденциальности</a></label>
          <button class="btn btn-gold" type="submit">Оставить заявку</button>
          <p class="form-note">Телефон обязателен. Имя можно не указывать.</p>
        </form>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function initLeadModal() {
    const modal = ensureLeadModal();
    const dialog = modal.querySelector('.lead-modal__dialog');
    const closeButtons = modal.querySelectorAll('[data-modal-close]');
    let lastFocused = null;

    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const openModal = () => {
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      const firstInput = modal.querySelector('input[name="phone"]') || modal.querySelector(focusableSelector);
      if (firstInput) firstInput.focus({ preventScroll: true });
    };
    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
    };

    document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      });
    });
    closeButtons.forEach((button) => button.addEventListener('click', closeModal));
    document.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeModal();
      if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(dialog.querySelectorAll(focusableSelector));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
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
          if (form.closest('.lead-modal')) {
            showFormMessage(form, 'Спасибо. Заявка отправлена, инженер свяжется с вами.', 'success');
            form.reset();
          } else {
            window.location.href = '/thank-you/';
          }
        } catch (error) {
          showFormMessage(form, 'Не удалось отправить заявку автоматически. Пожалуйста, позвоните по номеру в шапке сайта.', 'error');
        } finally {
          if (button) { button.disabled = false; button.textContent = original; }
        }
      });
    });
  }

  function initGoals() {
    document.querySelectorAll('[data-goal]').forEach((element) => {
      element.addEventListener('click', () => {
        if (element.matches('[data-modal-open]')) return;
        reachGoal(element.dataset.goal, { href: element.getAttribute('href') || '' });
      });
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
    initLeadModal();
    initSmoothScroll();
    initForms();
    initGoals();
    initFilters();
  });
})();
