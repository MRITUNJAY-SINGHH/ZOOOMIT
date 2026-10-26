"use strict";

// ::::: Global Javascript :::::
// ================================ Animate Interaction on Scroll ==================================
if (typeof JOS !== "undefined") {
  JOS.init({
    passive: false,
    once: true,
    animation: "fade-up",
    timingFunction: "ease",
    threshold: 0,
    delay: 0.5,
    duration: 0.7,
    scrollDirection: "down",
    rootMargin: "0% 0% 15% 0%",
  });
}

// ======================================== FAQ Accordion ======================================
function initAccordions() {
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    if (!header) return;

    header.style.cursor = "pointer";
    const btn = header.querySelector("button");
    if (btn) {
      btn.setAttribute("type", "button");
    }

    header.addEventListener("click", (e) => {
      if (e) {
        e.preventDefault();
      }

      const isAlreadyActive = item.classList.contains("active");

      // Close all accordion items within the same parent list
      const parentList = item.closest("ul") || item.parentElement;
      if (parentList) {
        parentList.querySelectorAll(".accordion-item").forEach((accordionItem) => {
          accordionItem.classList.remove("active");
        });
      }

      // If it was not active before clicking, open it!
      if (!isAlreadyActive) {
        item.classList.add("active");
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAccordions);
} else {
  initAccordions();
}

// ======================== Active Brand Slider (About Us Page) ========================
if (typeof Swiper !== "undefined" && document.querySelector(".brand-slider")) {
  var brandSlider = new Swiper(".brand-slider", {
    slidesPerView: 2,
    spaceBetween: 90,
    speed: 1200,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    breakpoints: {
      768: {
        slidesPerView: 3,
      },
      992: {
        slidesPerView: 4,
      },
      1200: {
        slidesPerView: 5,
      },
    },
  });
}

// ======================== Dynamic Copyright Year ========================
const yearElement = document.getElementById("current-year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ======================== Smooth Scroll For Hash Links ========================
document.addEventListener("click", function (e) {
  const link = e.target.closest('a[href*="#"]');
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href === "#") return;

  const hashIdx = href.indexOf("#");
  if (hashIdx === -1) return;

  const path = href.substring(0, hashIdx);
  const targetId = href.substring(hashIdx);

  // If link points to an anchor on current page
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const isCurrentPage = !path || path === currentPath || (path === "index.html" && (currentPath === "" || currentPath === "index.html"));

  if (isCurrentPage) {
    try {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        if (history.pushState) {
          history.pushState(null, "", targetId);
        }
      }
    } catch (err) {
      // Ignore invalid query selector
    }
  }
});
