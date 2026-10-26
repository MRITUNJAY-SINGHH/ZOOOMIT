(function () {
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
  // Event delegation ensures accordion always toggles cleanly, even if dynamically loaded or nested
  document.addEventListener("click", function (e) {
    const header = e.target.closest(".accordion-header");
    if (header) {
      const item = header.closest(".accordion-item");
      if (!item) return;

      e.preventDefault();
      const isAlreadyActive = item.classList.contains("active");

      // Close sibling accordion items in the same list
      const parentList = item.closest("ul") || item.parentElement;
      if (parentList) {
        parentList.querySelectorAll(".accordion-item").forEach(function (accordionItem) {
          accordionItem.classList.remove("active");
        });
      }

      // Toggle active state
      if (!isAlreadyActive) {
        item.classList.add("active");
      }
      return;
    }

    // Also support clicking on the accordion item padding when closed
    const item = e.target.closest(".accordion-item");
    if (item && !item.classList.contains("active") && !e.target.closest(".accordion-body")) {
      const parentList = item.closest("ul") || item.parentElement;
      if (parentList) {
        parentList.querySelectorAll(".accordion-item").forEach(function (accordionItem) {
          accordionItem.classList.remove("active");
        });
      }
      item.classList.add("active");
    }
  });

  // Ensure button types are set to button
  function setupAccordionElements() {
    const accordionButtons = document.querySelectorAll(".accordion-header button");
    accordionButtons.forEach(function (btn) {
      btn.setAttribute("type", "button");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupAccordionElements);
  } else {
    setupAccordionElements();
  }

  // ======================== Active Brand Slider (About Us Page) ========================
  if (typeof Swiper !== "undefined" && document.querySelector(".brand-slider")) {
    new Swiper(".brand-slider", {
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
            block: "start",
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
})();
