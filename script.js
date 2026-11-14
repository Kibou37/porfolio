(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  var toggle = document.querySelector(".header__toggle");
  var nav = document.querySelector(".header__nav");

  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("header__nav--open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("page--nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
  }

  var icon = {
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14.5 12 8.5l6 6" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>'
  };

  var topButton = document.createElement("button");
  topButton.type = "button";
  topButton.className = "to-top";
  topButton.setAttribute("aria-label", "Наверх");
  topButton.innerHTML = icon.up;
  topButton.hidden = true;
  document.body.appendChild(topButton);

  function syncTopButton() {
    topButton.hidden = window.scrollY < 480;
  }

  syncTopButton();
  window.addEventListener("scroll", syncTopButton, { passive: true });
  topButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  function bindShots(shots, pageShot) {
    if (!shots.length) return;
    var dialog = document.createElement("dialog");
    dialog.className = pageShot ? "lightbox lightbox--page" : "lightbox";
    dialog.setAttribute("aria-label", "Просмотр кадра");
    dialog.innerHTML =
      '<div class="lightbox__bar">' +
      '<p class="lightbox__count" aria-live="polite"></p>' +
      '<button type="button" class="lightbox__close" aria-label="Закрыть">' + icon.close + "</button>" +
      "</div>" +
      '<div class="lightbox__stage">' +
      '<button type="button" class="lightbox__prev" aria-label="Предыдущий кадр">' + icon.prev + "</button>" +
      '<img alt="">' +
      '<button type="button" class="lightbox__next" aria-label="Следующий кадр">' + icon.next + "</button>" +
      "</div>";
    var view = dialog.querySelector("img");
    view.className = "lightbox__photo";
    var scroller = null;
    if (pageShot) {
      scroller = document.createElement("div");
      scroller.className = "lightbox__scroll";
      scroller.tabIndex = 0;
      view.replaceWith(scroller);
      scroller.appendChild(view);
    }
    if (shots.length < 2) {
      dialog.querySelector(".lightbox__prev").hidden = true;
      dialog.querySelector(".lightbox__next").hidden = true;
    }
    document.body.appendChild(dialog);

    var count = dialog.querySelector(".lightbox__count");
    var current = 0;
    var lastFocus = null;

    function showShot(index) {
      current = (index + shots.length) % shots.length;
      var shot = shots[current];
      view.src = shot.currentSrc || shot.src;
      view.alt = shot.alt;
      view.width = shot.naturalWidth || shot.width;
      view.height = shot.naturalHeight || shot.height;
      if (scroller) scroller.scrollTop = 0;
      count.textContent = current + 1 + " / " + shots.length;
    }

    function openShot(index) {
      lastFocus = document.activeElement;
      showShot(index);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      if (scroller) scroller.focus();
    }

    shots.forEach(function (shot, index) {
      shot.tabIndex = 0;
      shot.setAttribute("role", "button");
      shot.setAttribute("aria-haspopup", "dialog");
      shot.addEventListener("click", function () {
        openShot(index);
      });
      shot.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openShot(index);
      });
    });

    dialog.querySelector(".lightbox__close").addEventListener("click", function () {
      dialog.close();
    });
    dialog.querySelector(".lightbox__prev").addEventListener("click", function () {
      showShot(current - 1);
    });
    dialog.querySelector(".lightbox__next").addEventListener("click", function () {
      showShot(current + 1);
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      view.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showShot(current + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showShot(current - 1);
      }
    });

    var touchStartX = 0;
    var touchStartY = 0;
    dialog.addEventListener(
      "touchstart",
      function (event) {
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
      },
      { passive: true }
    );
    dialog.addEventListener(
      "touchend",
      function (event) {
        var deltaX = event.changedTouches[0].clientX - touchStartX;
        var deltaY = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) < 48 || Math.abs(deltaY) > Math.abs(deltaX)) return;
        showShot(current + (deltaX < 0 ? 1 : -1));
      },
      { passive: true }
    );
  }

  document.querySelectorAll(".gallery").forEach(function (gallery) {
    bindShots(Array.prototype.slice.call(gallery.querySelectorAll(".gallery__photo")));
  });
  document.querySelectorAll(".case__media").forEach(function (media) {
    bindShots(Array.prototype.slice.call(media.querySelectorAll(".case__photo")), true);
  });

  var phoneCarousel = window.matchMedia("(max-width: 500px)");

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".case__track");
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(root.querySelectorAll(".case__dot"));
    var index = 0;
    var startX = 0;

    if (slides.length < 2) {
      root.querySelectorAll(".case__arrow, .case__dots").forEach(function (node) {
        node.hidden = true;
      });
      return;
    }

    function show(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach(function (dot, dotIndex) {
        var current = dotIndex === index;
        dot.classList.toggle("case__dot--current", current);
        if (current) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
      });
    });

    root.querySelector(".case__arrow--prev").addEventListener("click", function () {
      show(index - 1);
    });
    root.querySelector(".case__arrow--next").addEventListener("click", function () {
      show(index + 1);
    });

    root.addEventListener(
      "touchstart",
      function (event) {
        if (!phoneCarousel.matches) return;
        startX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    root.addEventListener(
      "touchend",
      function (event) {
        if (!phoneCarousel.matches) return;
        var delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) < 48) return;
        root.dataset.swiped = "1";
        show(index + (delta < 0 ? 1 : -1));
      },
      { passive: true }
    );

    root.addEventListener(
      "click",
      function (event) {
        if (!root.dataset.swiped) return;
        delete root.dataset.swiped;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  });

  document.querySelectorAll("[data-cycle]").forEach(function (root) {
    var frames = Array.prototype.slice.call(root.querySelectorAll(".cycle__frame"));
    if (!frames.length) return;

    var index = 0;

    function show(next) {
      frames.forEach(function (frame, frameIndex) {
        frame.classList.toggle("cycle__frame--current", frameIndex === next);
      });
    }

    show(0);
    if (reduce || frames.length < 2) return;

    window.setInterval(function () {
      index = (index + 1) % frames.length;
      show(index);
    }, 3400);
  });

  var nodes = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach(function (node) {
      node.classList.add("reveal--in");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal--in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" }
  );

  nodes.forEach(function (node) {
    observer.observe(node);
  });
})();
