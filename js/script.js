// ===== AOS (Animate On Scroll) =====
const initAOS = () => {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.aosDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
};

// ===== CURSOR GLOW =====
const initCursorGlow = () => {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  const speed = 0.15;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    glow.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  const animate = () => {
    glowX += (mouseX - glowX) * speed;
    glowY += (mouseY - glowY) * speed;
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';
    requestAnimationFrame(animate);
  };
  animate();
};

// ===== HEADER SCROLL =====
const initHeaderScroll = () => {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add('scrolled');
      header.classList.remove('header-transparent');
    } else {
      header.classList.remove('scrolled');
      header.classList.add('header-transparent');
    }

    // Hide on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 300) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }

    lastScroll = currentScroll;
  });
};

// ===== HERO PARALLAX =====
const initHeroParallax = () => {
  const heroImg = document.getElementById('heroImg');
  if (!heroImg) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * 0.5;
    heroImg.style.transform = `translateY(${parallax}px) scale(1.05)`;
  });
};

// ===== COUNTER ANIMATION =====
const initCounters = () => {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, 16);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
};

// ===== SMOOTH SCROLL =====
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.length <= 1) return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = 80;
        const targetPosition = target.offsetTop - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
};

// ===== NOTIFICATION HELPER =====
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  const bgColor = type === 'success' 
    ? 'linear-gradient(135deg, #4caf50, #45a049)' 
    : 'linear-gradient(135deg, #ff4c4c, #d32f2f)';
  const shadowColor = type === 'success' 
    ? 'rgba(76,175,80,0.3)' 
    : 'rgba(244,67,54,0.3)';

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 40px;
    background: ${bgColor};
    color: #fff;
    padding: 20px 32px;
    border-radius: 12px;
    box-shadow: 0 12px 40px ${shadowColor};
    z-index: 10000;
    font-size: 15px;
    font-weight: 600;
    animation: slideIn 0.4s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.4s ease forwards';
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

// ===== FORM SUBMIT =====
function sendForm(e) {
  e.preventDefault();
  const form = e.target;
  let hasError = false;

  form.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('error-field');
    const isInvalid = field.type === 'checkbox' ? !field.checked : !field.value.trim();
    if (isInvalid) {
      field.classList.add('error-field');
      hasError = true;
      field.addEventListener('input', function handler() {
        field.classList.remove('error-field');
        field.removeEventListener('input', handler);
      });
    }
  });

  if (hasError) {
    showNotification('Пожалуйста, заполните все обязательные поля', 'error');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const orig = btn.textContent;
  btn.textContent = 'Отправка...';
  btn.disabled = true;

  const data = {
    name: form.querySelector('[name="name"]')?.value || '',
    contact: form.querySelector('[name="telegram"]')?.value || form.querySelector('[name="contact"]')?.value || '',
    message: form.querySelector('[name="message"]')?.value || '',
    source: document.title
  };

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        showNotification('Спасибо! Свяжемся с вами в ближайшее время.', 'success');
        form.reset();
      } else {
        throw new Error('server error');
      }
    })
    .catch(() => {
      showNotification('Ошибка отправки. Напишите нам в Telegram: @sk_goldstroj', 'error');
    })
    .finally(() => {
      btn.textContent = orig;
      btn.disabled = false;
    });
}

// ===== MOBILE MENU =====
const initMobileMenu = () => {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.classList.toggle('nav-open');
  });

  // Close menu on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      nav.classList.remove('active');
      document.body.classList.remove('nav-open');
    });
  });
};

// ===== INIT =====
document.addEventListener('astro:page-load', () => {
  initAOS();
  initCursorGlow();
  initHeaderScroll();
  initHeroParallax();
  initCounters();
  initSmoothScroll();
  initMobileMenu();
});
