(function () {
  "use strict";

  const menu = document.querySelector(".menu-block");
  if (!menu) return;

  const menuMain = menu.querySelector(".site-menu-main");
  const submenuAll = menu.querySelectorAll(".sub-menu");
  const goBack = menu.querySelector(".go-back");
  const menuTrigger = document.querySelector(".mobile-menu-trigger");
  const closeMenu = menu.querySelector(".mobile-menu-close");
  const menuOverlay = document.querySelector(".menu-overlay");

  let subMenu;
  let subMenuArray = [];
  let subMenuTextArray = [];

  function last(array) {
    return array[array.length - 1];
  }
  function last2(array) {
    return array[array.length - 2];
  }

  function toggleMenu() {
    if (!menu) return;
    const isActive = menu.classList.toggle("active");
    if (menuOverlay) {
      menuOverlay.classList.toggle("active", isActive);
    }
    if (menuTrigger) {
      menuTrigger.setAttribute("aria-expanded", isActive ? "true" : "false");
    }
  }

  if (menuMain) {
    menuMain.addEventListener("click", (e) => {
      if (!menu.classList.contains("active")) {
        return;
      }
      if (e.target.closest(".nav-item-has-children")) {
        const hasChildren = e.target.closest(".nav-item-has-children");
        showSubMenu(hasChildren);
      } else if (e.target.closest(".nav-link-item")) {
        // Close mobile drawer when user taps a navigation link
        toggleMenu();
      }
    });
  }

  if (goBack) {
    goBack.addEventListener("click", () => {
      const lastItem = last(subMenuArray);
      const lastItemText = last2(subMenuTextArray);
      subMenuArray.pop();
      subMenuTextArray.pop();
      if (subMenuArray.length >= 0 && lastItem) {
        const lastEl = document.getElementById(lastItem);
        if (lastEl) {
          lastEl.style.animation = "slideRight 0.5s ease forwards";
          setTimeout(() => {
            lastEl.classList.remove("active");
          }, 300);
        }
        const currentTitleEl = menu.querySelector(".current-menu-title");
        if (currentTitleEl) {
          currentTitleEl.innerHTML = lastItemText || "";
        }
      }
      if (subMenuArray.length === 0) {
        const headEl = menu.querySelector(".mobile-menu-head");
        if (headEl) headEl.classList.remove("active");
      }
    });
  }

  if (menuTrigger) {
    menuTrigger.addEventListener("click", () => {
      toggleMenu();
    });
  }

  if (closeMenu) {
    closeMenu.addEventListener("click", () => {
      toggleMenu();
    });
  }

  if (menuOverlay) {
    menuOverlay.addEventListener("click", () => {
      toggleMenu();
    });
  }

  // Close menu on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && menu.classList.contains("active")) {
      toggleMenu();
    }
  });

  function showSubMenu(hasChildren) {
    for (let i = 0; i < submenuAll.length; i++) {
      submenuAll[i].classList.remove("active");
    }
    subMenu = hasChildren.querySelector(".sub-menu");
    if (!subMenu) return;
    subMenuArray.push(subMenu.id);
    subMenu.classList.add("active");
    subMenu.style.animation = "slideLeft 0.5s ease forwards";
    const dropTrigger = hasChildren.querySelector(".drop-trigger");
    const menuTitle = dropTrigger ? dropTrigger.textContent : "";
    subMenuTextArray.push(menuTitle);

    const currentTitleEl = menu.querySelector(".current-menu-title");
    if (currentTitleEl) currentTitleEl.innerHTML = menuTitle;
    const headEl = menu.querySelector(".mobile-menu-head");
    if (headEl) headEl.classList.add("active");
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 991) {
      if (menu && menu.classList.contains("active")) {
        toggleMenu();
      }
    }
  });
})();
