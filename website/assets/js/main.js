"use strict";

// ::::: GLobal Javascript ::::
// ================================Animate Interaction on Scroll ==================================
JOS.init({
  // disable: false, // Disable JOS gloabaly | Values :  'true', 'false'
  // debugMode: true, // Enable JOS debug mode | Values :  'true', 'false'
  passive: false, // Set the passive option for the scroll event listener | Values :  'true', 'false'

  once: true, // Disable JOS after first animation | Values :  'true', 'false' || Int : 0-1000
  animation: "fade-up", // JOS global animation type | Values :  'fade', 'slide', 'zoom', 'flip', 'fade-right', 'fade-left', 'fade-up', 'fade-down', 'zoom-in-right', 'zoom-in-left', 'zoom-in-up', 'zoom-in-down', 'zoom-out-right', 'zoom-out-left', 'zoom-out-up', 'zoom-out-down', 'flip-right', 'flip-left', 'flip-up', 'flip-down, spin, revolve, stretch, "my-custom-animation"
  // animationInverse: "static", // Set the animation type for the element when it is scrolled out of view | Values :  'fade', 'slide', 'zoom', 'flip', 'fade-right', 'fade-left', 'fade-up', 'fade-down', 'zoom-in-right', 'zoom-in-left', 'zoom-in-up', 'zoom-in-down', 'zoom-out-right', 'zoom-out-left', 'zoom-out-up', 'zoom-out-down', 'flip-right', 'flip-left', 'flip-up', 'flip-down, spin, revolve, stretch, "my-custom-animation"
  timingFunction: "ease", // JOS global timing function | Values :  'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'steps()', 'cubic-bezier()', 'my-custom-timing-function'
  //mirror : false, // Set whether the element should animate back when scrolled out of view | Values :  'true', 'false'
  threshold: 0, // Set gloabal the threshold for the element to be visible | Values :  0-1
  delay: 0.5, // Set global the delay for the animation to start | Values :  0,1,2,3,4,5
  duration: 0.7, // Set global the duration for the animation playback | Values :  flota : 0-1 & int : 0,1,2,3,4,5

  // startVisible: "true", // Set whether the element should animate when the page is loaded | Values :  'true', 'false' || MS : 0-10000
  scrollDirection: "down", // Set the scroll direction for the element to be visible | Values :  'up', 'down', 'none'
  //scrollProgressDisable: true // disable or enable scroll callback function | Values :  'true', 'false'
  // intersectionRatio: 0.4, // Set the intersection ratio between which the element should be visible | Values :  0-1 (automaticaly set)
  // rootMargin_top: "0%", // Set by which percent the element should animate out (Recommended value between 10% to -30%)
  // rootMargin_bottom: "-50%", // Set by which percent the element should animate out (Recommended value between -10% to -60%)
  rootMargin: "0% 0% 15% 0%", // Set the root margin for the element to be visible | Values :  _% _% _% _%  (automaticaly set)
});

// ======================================== Accordion ======================================
function initAccordions() {
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    if (!header) return;

    // Ensure pointer cursor on header and button
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
      // If it was already active, it will now stay closed (toggled off).
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

//:::::::::::::::::::::::::::::::::::::::::: Template JavaScript ::::::::::::::::::::::::::::::::::

// ========================TF-1 : Brand Slider================================
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

// ========================TF-2 : Brand Slider================================
var brandSlider = new Swiper(".brand-slider-2", {
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
    1400: {
      slidesPerView: 6,
    },
  },
});
// ========================TF-3 : Testimonial Slider================================
var testimonialOne = new Swiper(".testimonial-one", {
  navigation: {
    nextEl: ".slider-nav-btn-next",
    prevEl: ".slider-nav-btn-prev",
  },
});

// Get all tab buttons and content sections
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

// Add click event listeners to tab buttons
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove 'active' class from all tab buttons and hide all tab content
    tabButtons.forEach((btn) => {
      btn.classList.remove("active");
    });
    tabContents.forEach((content) => {
      content.classList.add("hidden");
    });

    // Get the data-tab attribute of the clicked button
    const tabId = button.getAttribute("data-tab");
    const correspondingTab = document.getElementById(tabId);

    // Add 'active' class to the clicked button and show the corresponding tab content
    button.classList.add("active");
    correspondingTab.classList.remove("hidden");
  });
});

// ========================TF-1 : Testimonial Slider================================
const testimonialSlider = new Swiper('.testimonial-slider', {
  // Optional parameters
  slidesPerView: 1,
  loop: true,
  spaceBetween: 30,

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});

// JS Toggle Button
function toggleSwitch() {
  var month = document.querySelectorAll(".month");
  var annual = document.querySelectorAll(".annual");
  for (var i = 0; i < month.length; i++) {
    if (document.getElementById("toggle").checked == true) {
      month[i].classList.add("hidden");
      annual[i].classList.remove("hidden");
    } else {
      month[i].classList.remove("hidden");
      annual[i].classList.add("hidden");
    }
  }
}

// Dynamic Copyright Year
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
