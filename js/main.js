(function () {
  // set year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // set active nav link
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".navbar .nav-link").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });

  // simple counter animation
  const counters = document.querySelectorAll("[data-count]");
  const animate = (el) => {
    const end = Number(el.dataset.count || 0);
    const dur = 900;
    const start = performance.now();
    const from = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const val = Math.round(from + (end - from) * p);
      el.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: .35 }) : null;

  counters.forEach(c => {
    if (io) io.observe(c);
    else c.textContent = Number(c.dataset.count || 0).toLocaleString();
  });

  // Projects filter (projects.html)
  const filterBtns = document.querySelectorAll("[data-filter]");
  const projectCards = document.querySelectorAll("[data-project]");
  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        projectCards.forEach(card => {
          const tags = (card.dataset.project || "").split(",").map(s => s.trim());
          const show = (f === "all") || tags.includes(f);
          card.classList.toggle("d-none", !show);
        });
      });
    });
  }

  // HERO BACKGROUND SLIDESHOW
  (function () {
    const hero = document.querySelector(".hero-slideshow");
    if (!hero) return;

    const images = [
      "assets/images/hero-1.jpg",
      "assets/images/hero-2.jpg",
      "assets/images/home7.jpg",
      "assets/images/team4.jpg",
      "assets/images/home3.jpg"
    ];

    let i = 0;

    // Preload images (smooth)
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Set initial background
    hero.style.backgroundImage = `url('${images[i]}')`;

    setInterval(() => {
      // optional fade
      hero.classList.add("fade-bg");
      hero.style.opacity = "0";

      setTimeout(() => {
        i = (i + 1) % images.length;
        hero.style.backgroundImage = `url('${images[i]}')`;
        hero.style.opacity = "1";
      }, 400);

    }, 5000);
  })();

  // Multi-level dropdown support (Bootstrap 5)
  document.querySelectorAll(".dropdown-submenu > a").forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const submenu = this.nextElementSibling;
      if (!submenu) return;

      // close other open submenus inside same parent
      const parentMenu = this.closest(".dropdown-menu");
      parentMenu.querySelectorAll(".dropdown-menu.show").forEach((m) => {
        if (m !== submenu) m.classList.remove("show");
      });

      submenu.classList.toggle("show");
    });
  });

  // Close submenus when main dropdown closes
  document.querySelectorAll(".dropdown").forEach((dd) => {
    dd.addEventListener("hide.bs.dropdown", () => {
      dd.querySelectorAll(".dropdown-menu.show").forEach((m) => m.classList.remove("show"));
    });
  });

  // Load navbar on all pages
fetch("includes/navbar.html")
  .then(res => res.text())
  .then(data => {
    const nav = document.getElementById("navbar");
    if (nav) nav.innerHTML = data;
  });

  // Active nav link highlighting
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".navbar .nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
    }
  });
});


  // Contact form demo (client-side only)
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      const toastEl = document.getElementById("sentToast");
      if (toastEl) {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
      }
      form.reset();
      form.classList.remove("was-validated");
    });
  }
})();
