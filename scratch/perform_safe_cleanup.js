const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, '../Website');
const manifestPath = path.join(__dirname, 'deletion_manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('Manifest not found!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`Starting safe deletion of ${manifest.totalDeleted} confirmed unused files...`);

let deletedCount = 0;
let errors = 0;

manifest.deletedFiles.forEach(f => {
  const fullPath = path.join(WEBSITE_DIR, f.path);
  // SAFETY CHECK: Verify path starts inside Website/assets/
  const rel = path.relative(WEBSITE_DIR, fullPath).replace(/\\/g, '/');
  if (!rel.startsWith('assets/')) {
    console.error(`REFUSING to delete file outside assets/: ${fullPath}`);
    errors++;
    return;
  }

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      deletedCount++;
    } catch (err) {
      console.error(`Error deleting ${fullPath}:`, err.message);
      errors++;
    }
  }
});

console.log(`✓ Deleted ${deletedCount} unused asset files.`);

// Clean up any empty directories inside Website/assets/
function removeEmptyDirs(dir) {
  let entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      removeEmptyDirs(fullPath);
    }
  }
  entries = fs.readdirSync(dir);
  if (entries.length === 0 && dir !== path.join(WEBSITE_DIR, 'assets')) {
    try {
      fs.rmdirSync(dir);
      console.log(`✓ Removed empty directory: ${path.relative(WEBSITE_DIR, dir).replace(/\\/g, '/')}`);
    } catch (err) {
      // Ignore
    }
  }
}

removeEmptyDirs(path.join(WEBSITE_DIR, 'assets'));

// -------------------------------------------------------------
// 3. Optimize Website/assets/js/main.js
// -------------------------------------------------------------
const cleanMainJs = `"use strict";

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
`;

fs.writeFileSync(path.join(WEBSITE_DIR, 'assets/js/main.js'), cleanMainJs, 'utf8');
console.log('✓ Cleaned dead code from Website/assets/js/main.js');

// -------------------------------------------------------------
// 4. Optimize Website/tailwind.config.js
// -------------------------------------------------------------
const cleanTailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./*.html",
    "./partials/**/*.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    screens: {
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
      xxl: "1400px",
    },
    extend: {
      fontFamily: {
        PlusJakartaSans: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
        FontAwesome: ["Font Awesome 6 Pro"]
      },
      colors: {
        ColorDark: "#191919",
        ColorBlack: "#0A102F",
        ColorBlue: "#3147FF",
        ColorOffWhite: "#FAF9F5",
        ColorPurple: "#A259FF",
        ColorBluePurple: "#7949F6",
        ColorYellow: "#FFC900",
        ColorViolet: "#4B2AAD",
        ColorAtomicTangerine: "#FF9966",
        ColorLime: "#C1FF00",
        ColorLunarGreen: "#324438",
        ColorAlmond: "#EBDECE",
        ColorCorn: "#F4B905",
        ColorOil: "#221F1A",
        ColorPaleGold: "#FFD874",
        ColorEggSour: "#FFF4D9",
        ColorDenimDarkBlue: "#2D2B92",
        ColorCaribbeanGreen: "#15CF92",
        ColorMidnightMoss: "#010D09",
        ColorHoneySuckle: "#E9FF97",
      },
    },
  },
  plugins: [],
};
`;

fs.writeFileSync(path.join(WEBSITE_DIR, 'tailwind.config.js'), cleanTailwindConfig, 'utf8');
console.log('✓ Cleaned unused font families & updated content paths in Website/tailwind.config.js');

console.log('All safe cleanup actions completed successfully!');
