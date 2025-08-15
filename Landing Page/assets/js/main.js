(function ($) {
  "use strict";

  // ==========================================
  //      Start Document Ready function
  // ==========================================
  $(document).ready(function () {
    // ============== Mobile Nav Menu Dropdown Js Start =======================
    function toggleSubMenu() {
      if ($(window).width() <= 991) {
        $(".has-submenu")
          .off("click")
          .on("click", function () {
            $(this)
              .toggleClass("active")
              .siblings(".has-submenu")
              .removeClass("active")
              .find(".nav-submenu")
              .slideUp(300);
            $(this).find(".nav-submenu").stop(true, true).slideToggle(300);
          });
      } else {
        $(".has-submenu").off("click");
      }
    }

    toggleSubMenu();
    $(window).resize(toggleSubMenu);
    // ============== Mobile Nav Menu Dropdown Js End =======================

    // ===================== Scroll Back to Top Js Start ======================
    var progressPath = document.querySelector(".progress-wrap path");
    var pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "none";
    progressPath.style.strokeDasharray = pathLength + " " + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 10ms linear";
    var updateProgress = function () {
      var scroll = $(window).scrollTop();
      var height = $(document).height() - $(window).height();
      var progress = pathLength - (scroll * pathLength) / height;
      progressPath.style.strokeDashoffset = progress;
    };
    updateProgress();
    $(window).scroll(updateProgress);
    var offset = 50;
    var duration = 550;
    jQuery(window).on("scroll", function () {
      if (jQuery(this).scrollTop() > offset) {
        jQuery(".progress-wrap").addClass("active-progress");
      } else {
        jQuery(".progress-wrap").removeClass("active-progress");
      }
    });
    jQuery(".progress-wrap").on("click", function (event) {
      event.preventDefault();
      jQuery("html, body").animate({ scrollTop: 0 }, duration);
      return false;
    });
    // ===================== Scroll Back to Top Js End ======================

    // ========================== add active class to navbar menu current page Js Start =====================
    function dynamicActiveMenuClass(selector) {
      let FileName = window.location.pathname.split("/").reverse()[0];

      // If we are at the root path ("/" or no file name), keep the activePage class on the Home item
      if (FileName === "" || FileName === "index.html") {
        // Keep the activePage class on the Home link
        selector
          .find("li.nav-menu__item.has-submenu")
          .eq(0)
          .addClass("activePage");
      } else {
        // Remove activePage class from all items first
        selector.find("li").removeClass("activePage");

        // Add activePage class to the correct li based on the current URL
        selector.find("li").each(function () {
          let anchor = $(this).find("a");
          if ($(anchor).attr("href") == FileName) {
            $(this).addClass("activePage");
          }
        });

        // If any li has activePage element, add class to its parent li
        selector.children("li").each(function () {
          if ($(this).find(".activePage").length) {
            $(this).addClass("activePage");
          }
        });
      }
    }

    if ($("ul").length) {
      dynamicActiveMenuClass($("ul"));
    }
    // ========================== add active class to navbar menu current page Js End =====================

    // ========================== Settings Panel Js Start =====================
    $(".settings-button").on("click", function () {
      $(".settings-panel").toggleClass("active");
      $(this).toggleClass("active");
    });

    $(document).on(
      "click",
      ".settings-panel__buttons .settings-panel__button",
      function () {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
      }
    );

    // Cursor start
    $(".cursor-animate").on("click", function () {
      $("body").removeClass("remove-animate-cursor");
    });

    $(".cursor-default").on("click", function () {
      $("body").addClass("remove-animate-cursor");
    });
    // Cursor end

    // Direction start
    $(".direction-ltr").on("click", function () {
      $("html").attr("dir", "ltr");
    });

    $(".direction-rtl").on("click", function () {
      $("html").attr("dir", "rtl");
    });
    // Direction end
    // ========================== Settings Panel Js End =====================

    // ********************* Toast Notification Js start *********************
    function toastMessage(messageType, messageTitle, messageText, messageIcon) {
      let $toastContainer = $("#toast-container");

      let $toast = $("<div>", {
        class: `toast-message ${messageType}`,
        html: `
        <div class="toast-message__content">
          <span class="toast-message__icon">
            <i class="${messageIcon}"></i>
          </span>
          <div class="flex-grow-1">
            <div class="d-flex align-items-start justify-content-between mb-1">
              <h6 class="toast-message__title">${messageTitle}</h6>
              <button type="button" class="toast-message__close">
                <i class="ph-bold ph-x"></i>
              </button>
            </div>
            <span class="toast-message__text">${messageText}</span>
          </div>
        </div>
        <div class="progress__bar"></div>
      `,
      });

      $toastContainer.append($toast);

      setTimeout(() => {
        $toast.addClass("active");
      }, 50);

      let totalDuration = 3500;
      let startTime = Date.now();
      let remainingTime = totalDuration;
      let toastTimeout = setTimeout(hideToast, remainingTime);

      function hideToast() {
        $toast.removeClass("active");
        setTimeout(() => {
          $toast.remove();
        }, 500);
      }

      // Remove Toast on Close Button Click
      $toast.find(".toast-message__close").on("click", function () {
        $toast.removeClass("active");
        setTimeout(() => {
          $toast.remove();
        }, 500);
      });

      // Pause Timeout on Hover
      $toast.on("mouseenter", function () {
        remainingTime -= Date.now() - startTime;
        clearTimeout(toastTimeout);
      });

      // Resume Timeout on Mouse Leave
      $toast.on("mouseleave", function () {
        startTime = Date.now();
        toastTimeout = setTimeout(hideToast, remainingTime);
      });
    }
    // ********************* Toast Notification Js End *********************

    // ======================== Top Features Slider Start ==========================
    if ($(".top-features-slider").length > 0) {
      $(".top-features-slider").marquee({
        pauseOnHover: true,
        duplicated: true,
        allowCss3Support: true,
        css3easing: "linear",
        easing: "linear",
        delayBeforeStart: 0,
        duration: 24000,
        direction: $("html").attr("dir") === "rtl" ? "right" : "left",
        gap: 32,
        pauseOnCycle: false,
        startVisible: true,
      });
    }
    // ======================== Top Features Slider end ==========================

    // ================================= Brand slider Start =========================
    var brandSlider = new Swiper(".brand-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      autoplay: true,
      speed: 1500,
      grabCursor: true,
      loop: true,
      slidesPerView: 7,
      breakpoints: {
        300: {
          slidesPerView: 2,
        },
        575: {
          slidesPerView: 3,
        },
        768: {
          slidesPerView: 4,
        },
        992: {
          slidesPerView: 5,
        },
        1200: {
          slidesPerView: 6,
        },
        1400: {
          slidesPerView: 7,
        },
      },
    });
    // ================================= Brand slider End =========================

    // ================================= Testimonials slider Start =========================
    var testimonialsFour = new Swiper(".testimonials-four-slider", {
      autoplay: {
        delay: 1000,
        disableOnInteraction: false,
      },
      effect: "fade",
      autoplay: true,
      speed: 500,
      grabCursor: true,
      loop: true,
      slidesPerView: 1,
      navigation: {
        // ✅ Add navigation settings
        nextEl: "#testimonials-four-next",
        prevEl: "#testimonials-four-prev",
      },
    });
    // ================================= Testimonials slider End =========================

    // ================================= Testimonials Five slider Start =========================
    var testimonialsFive = new Swiper(".testimonials-five-slider", {
      slidesPerView: 3,
      spaceBetween: 30,
      loop: true,
      grabCursor: true,
      speed: 500,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".testimonials-five-slider-pagination",
        clickable: true,
      },
      breakpoints: {
        300: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        1200: {
          slidesPerView: 3,
        },
      },
    });
    // ================================= Testimonials Five slider End =========================

    // ================================= Testimonials Five slider Start =========================
    var pricingFive = new Swiper(".pricing-five-slider", {
      slidesPerView: 3,
      spaceBetween: 30,
      loop: true,
      grabCursor: true,
      speed: 500,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".pricing-five-slider-pagination",
        clickable: true,
        renderBullet: function (index, className) {
          return '<span class="' + className + '">' + (index + 1) + "</span>";
        },
      },
      breakpoints: {
        300: {
          slidesPerView: 1,
        },
        992: {
          slidesPerView: 2,
        },
      },
    });
    // ================================= Testimonials Five slider End =========================

    // ========================= Counter Up Js Start ===================
    const counterUp = window.counterUp.default;

    const callback = (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting && !el.classList.contains("is-visible")) {
          counterUp(el, {
            duration: 3500,
            delay: 16,
          });
          el.classList.add("is-visible");
        }
      });
    };
    const IO = new IntersectionObserver(callback, { threshold: 1 });

    // Banner statistics Counter
    const statisticsCounter = document.querySelectorAll(".counter");
    if (statisticsCounter.length > 0) {
      statisticsCounter.forEach((counterNumber) => {
        IO.observe(counterNumber);
      });
    }

    // performance Count
    const performanceCount = document.querySelectorAll(".counter");
    if (performanceCount.length > 0) {
      performanceCount.forEach((counterNumber) => {
        IO.observe(counterNumber);
      });
    }
    // ========================= Counter Up Js End ===================

    // ========================= AOS Js Start ===================
    // AOS.init();
    AOS.init({
      once: true,
    });
    // ========================= AOS Js End ===================

    // ========================= Animated Radial Progress Js Start ===================
    function animateProgress() {
      $("svg.radial-progress").each(function () {
        // Check if the element is within the viewport
        const elementTop = $(this).offset().top;
        const elementBottom = elementTop + $(this).outerHeight();
        const viewportTop = $(window).scrollTop();
        const viewportBottom = viewportTop + $(window).height();

        if (elementBottom > viewportTop && elementTop < viewportBottom) {
          const percent = $(this).data("percentage");
          const radius = $(this).find("circle.complete").attr("r");
          const circumference = 2 * Math.PI * radius;
          const strokeDashOffset =
            circumference - (percent / 100) * circumference;

          // Animate the circle
          $(this)
            .find("circle.complete")
            .css("stroke-dashoffset", strokeDashOffset);
        }
      });
    }

    // Trigger animation on scroll and page load
    $(window).on("scroll", animateProgress);
    animateProgress(); // Run on page load
    // ========================= Animated Radial Progress Js End ===================

    // ========================= ShowCase Slider Js start ===================
    var showCaseSlider = new Swiper(".show-case-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      autoplay: true,
      speed: 1500,
      grabCursor: true,
      loop: true,
      spaceBetween: 24,
      slidesPerView: 4,
      centeredSlides: true,
      breakpoints: {
        300: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 2,
        },
        1200: {
          slidesPerView: 3,
        },
        1201: {
          slidesPerView: 4,
        },
      },
    });
    // ========================= ShowCase Slider Js End ===================

    // ========================= Accordion Tabs Image Change Js Start ===================
    $(document).on("click", ".accordion-button", function () {
      const $faqImage = $("#faqImage");
      const newImageSrc = $(this).data("img");

      if (newImageSrc && $faqImage.attr("src") !== newImageSrc) {
        $faqImage.css("opacity", ".3");
        setTimeout(() => {
          $faqImage.attr("src", newImageSrc).css("opacity", "1");
        }, 300);
      }
    });
    // ========================= Accordion Tabs Image Change Js End ===================

    // ========================= Testimonials Tab Js start ===================
    $(document).on("click", ".testimonials-item", function () {
      $(".testimonials-item").removeClass("active");
      $(this).addClass("active");
    });
    // ========================= Testimonials Tab Js End ===================

    // ========================== Set Text In Custom dropdown Js Start =================================
    $(".selectable-text-list li").each(function () {
      var thisItem = $(this);

      thisItem.on("click", function () {
        const listText = thisItem.text();
        var item = thisItem
          .parent()
          .parent()
          .find(".selected-text")
          .text(listText);
      });
    });
    // ========================== Set Text In Custom dropdown Js End =================================

    // ========================== Domain Select Js Start =================================
    $(document).on("click", ".domain-item-button", function () {
      const selectedDomain = $(this).data("domain");

      const $wrapper = $(this).closest(".select-domain-wrapper");
      const $select = $wrapper.find(".select-domain");

      $select.val(selectedDomain);

      // Remove and add active class
      $wrapper.find(".domain-item-button").removeClass("active-domain");
      $(this).addClass("active-domain");
    });

    // ========================== Domain Select Js End =================================

    // ========================== About Two Js Start =====================
    var aboutTwoThumbsSliderOne = new Swiper(".about-two-thumbs-slider-one", {
      slidesPerView: 2,
      grabCursor: true,
      loop: true,
      centeredSlides: true,
      direction: "vertical",
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      speed: 6000,
      autoplay: {
        delay: 0,
        enabled: true,
      },
    });

    var aboutTwoThumbsSliderTwo = new Swiper(".about-two-thumbs-slider-two", {
      slidesPerView: 2,
      grabCursor: true,
      loop: true,
      centeredSlides: true,
      direction: "vertical",
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      speed: 6000,
      autoplay: {
        delay: 0,
        enabled: true,
        reverseDirection: true,
        disableOnInteraction: false,
      },
    });
    // ========================== About Two Js End =====================

    // ========================== hosting plan slider Js start =====================
    var hostingPlanSlider = new Swiper(".hosting-plan-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      autoplay: false,
      speed: 1500,
      grabCursor: true,
      loop: true,
      slidesPerView: 4,
      navigation: {
        nextEl: ".swiper-hosting-button-next",
        prevEl: ".swiper-hosting-button-prev",
      },
      pagination: {
        el: ".swiper-hosting-pagination",
        clickable: true,
      },
      breakpoints: {
        300: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
        1199: {
          slidesPerView: 4,
        },
      },
    });
    // ========================== hosting plan slider Js End =====================

    // ========================== Add Attribute For Bg Image Js Start ====================
    $(".background-img").css("background", function () {
      var bg = "url(" + $(this).data("background-image") + ")";
      return bg;
    });
    // ========================== Add Attribute For Bg Image Js End =====================

    // ========================= ShowCase Slider Js start ===================
    var serviceSlider = new Swiper(".service-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      autoplay: false,
      speed: 1500,
      grabCursor: true,
      loop: true,
      spaceBetween: 24,
      slidesPerView: 4,
      pagination: {
        el: ".service-slider-pagination",
        clickable: true,
      },
      breakpoints: {
        300: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
        1300: {
          slidesPerView: 4,
        },
      },
    });
    // ========================= ShowCase Slider Js End ===================

    // ================================= Brand slider Start =========================
    var brandThreeSlider = new Swiper(".brand-three-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      autoplay: true,
      speed: 1500,
      grabCursor: true,
      loop: true,
      slidesPerView: 7,
      breakpoints: {
        300: {
          slidesPerView: 2,
        },
        575: {
          slidesPerView: 3,
        },
        768: {
          slidesPerView: 4,
        },
        992: {
          slidesPerView: 5,
        },
        1200: {
          slidesPerView: 6,
        },
        1400: {
          slidesPerView: 7,
        },
      },
    });
    // ================================= Brand slider End =========================

    // ========================= Plan Execute slider Js start ===================
    var planExecuteSlider = new Swiper(".plan-execute-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      speed: 1500,
      grabCursor: true,
      loop: true,
      spaceBetween: 24,
      slidesPerView: 4,
      pagination: {
        el: ".plan-execute-pagination",
        clickable: true,
      },
      breakpoints: {
        300: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
        1300: {
          slidesPerView: 4,
        },
      },
    });
    // ========================= Plan Execute slider Js End ===================

    // ========================= Testimonials Three slider Js start ===================
    var planExecuteSlider = new Swiper(".testimonials-three-slider", {
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      autoplay: false,
      speed: 1500,
      grabCursor: true,
      loop: true,
      spaceBetween: 24,
      slidesPerView: 1,
      pagination: {
        el: ".plan-execute-pagination",
        clickable: true,
      },
    });
    // ========================= Testimonials Three slider Js End ===================

    // ========================= magnific Popup Js Start =====================
    $(".play-button").magnificPopup({
      type: "iframe",
      removalDelay: 300,
      mainClass: "mfp-fade",
    });
    // ========================= magnific Popup Js End =====================

    // ========================= List gird View Js Start =====================
    $(document).on("click", ".list-view-btn", function () {
      const $btn = $(this);
      const $gridViewBtn = $(".grid-view-btn");
      const $body = $("body");

      $body.removeClass("grid-view");
      $btn.removeClass("text-heading").addClass("text-main-600");
      $gridViewBtn.removeClass("text-main-600");
    });

    $(document).on("click", ".grid-view-btn", function () {
      const $btn = $(this);
      const $listViewBtn = $(".list-view-btn");
      const $body = $("body");

      $body.addClass("grid-view");
      $btn.removeClass("text-heading").addClass("text-main-600");
      $listViewBtn.removeClass("text-main-600");
    });
    // ========================= List gird View Js End =====================

    // ========================= Range Slider Js Start =====================
    $(document).ready(function () {
      var $rangeInput = $(".range-input input"),
        $priceInput = $(".price-input input"),
        $range = $(".slider .progress"),
        priceGap = 1000;

      // Update the range and price inputs when the price input fields change
      $priceInput.on("input", function () {
        var minPrice = parseInt($priceInput.eq(0).val(), 10),
          maxPrice = parseInt($priceInput.eq(1).val(), 10);

        if (
          maxPrice - minPrice >= priceGap &&
          maxPrice <= parseInt($rangeInput.eq(1).attr("max"), 10)
        ) {
          if ($(this).hasClass("input-min")) {
            $rangeInput.eq(0).val(minPrice);
            $range.css(
              "inset-inline-start",
              (minPrice / parseInt($rangeInput.eq(0).attr("max"), 10)) * 100 +
                "%"
            );
          } else {
            $rangeInput.eq(1).val(maxPrice);
            $range.css(
              "inset-inline-end",
              100 -
                (maxPrice / parseInt($rangeInput.eq(1).attr("max"), 10)) * 100 +
                "%"
            );
          }
        }
      });

      // Update the price input fields and range visual when the range slider is dragged
      $rangeInput.on("input", function () {
        var minVal = parseInt($rangeInput.eq(0).val(), 10),
          maxVal = parseInt($rangeInput.eq(1).val(), 10);

        if (maxVal - minVal < priceGap) {
          if ($(this).hasClass("range-min")) {
            $rangeInput.eq(0).val(maxVal - priceGap);
          } else {
            $rangeInput.eq(1).val(minVal + priceGap);
          }
        } else {
          $priceInput.eq(0).val(minVal);
          $priceInput.eq(1).val(maxVal);
          $range.css(
            "inset-inline-start",
            (minVal / parseInt($rangeInput.eq(0).attr("max"), 10)) * 100 + "%"
          );
          $range.css(
            "inset-inline-end",
            100 -
              (maxVal / parseInt($rangeInput.eq(1).attr("max"), 10)) * 100 +
              "%"
          );
        }
      });
    });
    // ========================= Range Slider Js End =====================

    // ========================= Shop Details Slider Js Start =====================
    var shopSmallThumbs = new Swiper(".shop-small-thumbs", {
      loop: true,
      spaceBetween: 10,
      slidesPerView: 4,
      freeMode: true,
      watchSlidesProgress: true,
    });
    var shopThumbs = new Swiper(".shop-thumbs", {
      loop: true,
      spaceBetween: 10,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      thumbs: {
        swiper: shopSmallThumbs,
      },
    });
    // ========================= Shop Details Slider Js End =====================

    // ========================= Color Picker Js Start =====================
    $(document).on("click", ".color-picker", function () {
      $(".color-picker__color").css("transform", "scale(1)");

      $(this).find(".color-picker__color").css("transform", "scale(2)");
    });
    // ========================= Color Picker Js End =====================

    // ========================= Size Picker Js Start =====================
    $(document).on("click", ".size-btn", function () {
      $(".size-btn").removeClass("bg-main-600 text-white border-main-600");

      $(this).addClass("bg-main-600 text-white border-main-600");
    });
    // ========================= Size Picker Js End =====================

    // ========================= Increment & Decrement Js Start =====================
    $(document).on("click", ".increment-btn", function () {
      const $input = $(this).siblings(".input-value");
      let count = parseInt($input.val(), 10);
      $input.val(count + 1);
    });

    $(document).on("click", ".decrement-btn", function () {
      const $input = $(this).siblings(".input-value");
      let count = parseInt($input.val(), 10);
      if (count > 0) {
        $input.val(count - 1);
      }
    });
    // ========================= Increment & Decrement Js End =====================

    // ========================= Delete Item Js start ===================
    $(document).on("click", ".delete-button", function () {
      $(this).closest(".delete-item").addClass("d-none");

      toastMessage(
        "danger",
        "Deleted",
        "You deleted successfully!",
        "ph-bold ph-trash"
      );
    });

    // ========================= Delete Item Js End ===================

    // ========================= Form Submit Js Start ===================
    $(document).on("submit", ".form-submit", function (e) {
      e.preventDefault();

      $("input").val("");

      $("textarea").val("");

      toastMessage(
        "success",
        "Success",
        "Form submitted successfully!",
        "ph-fill ph-check-circle"
      );
    });
    // ========================= Form Submit Js End ===================

    // ================== Password Show Hide Js Start ==========
    $(".toggle-password").on("click", function () {
      $(this).toggleClass("active");
      var input = $($(this).attr("id"));
      if (input.attr("type") == "password") {
        input.attr("type", "text");
        $(this).removeClass("ph-bold ph-eye-slash");
        $(this).addClass("ph-bold ph-eye");
      } else {
        input.attr("type", "password");
        $(this).addClass("ph-bold ph-eye-slash");
      }
    });
    // ========================= Password Show Hide Js End ===========================

    // ========================= Active Tab Background animation Js Start ===================
    function moveBackground(wrapper) {
      var $activeTab = $(wrapper).find(".active").parent("li");
      var position = $activeTab.position();
      var width = $activeTab.width();

      $(wrapper)
        .find(".background")
        .css({
          "inset-inline-start": position.left + "px",
          width: width + "px",
        });
    }

    // Move Background on page load for each tab group
    $(".animate-background-wrapper").each(function () {
      moveBackground(this);
    });

    // Move Background on tab click
    $(".animate-background-wrapper .nav-link").on("click", function () {
      var wrapper = $(this).closest(".animate-background-wrapper");
      wrapper.find(".nav-link").removeClass("active");
      $(this).addClass("active");
      moveBackground(wrapper);
    });

    // ========================= Active Tab Background animation Js End ===================

    // ========================= See All Feature pricing plan Js Start ===================
    $(document).on("click", ".see-all-btn", function () {
      const $pricingItem = $(this).closest(".pricing-item");
      $pricingItem.toggleClass("expand");

      // Check if 'expand' class is added and update the button content accordingly
      if ($pricingItem.hasClass("expand")) {
        $(this).html(`
        Less features
        <i class="ph-bold ph-caret-up"></i>
      `);
      } else {
        $(this).html(`
        See all features
        <i class="ph-bold ph-caret-down"></i>
      `);
      }
    });
    // ========================= See All Feature pricing plan Js End ===================

    // ========================= Toggle Monthly Yearly duration pricing plan Js Start ===================
    $(document).on("change", ".pricing-item-toggle", function () {
      const $pricingItem = $(this).closest(".pricing-item");
      const $pricingDuration = $pricingItem.find(".pricing-duration");
      const $currentPrice = $pricingItem.find(".current-price");

      let priceValue = parseFloat($currentPrice.text().replace(/[^\d.-]/g, ""));

      if ($(this).prop("checked")) {
        if ($pricingDuration.text() === "/Monthly") {
          $pricingDuration.text("/Yearly");
          $currentPrice.text((priceValue * 10).toFixed(2));
        } else if ($pricingDuration.text() === "/Yearly") {
          $pricingDuration.text("/Monthly");
          $currentPrice.text((priceValue / 10).toFixed(2));
        }
      } else {
        if ($pricingDuration.text() === "/Monthly") {
          $pricingDuration.text("/Yearly");
          $currentPrice.text((priceValue * 10).toFixed(2));
        } else if ($pricingDuration.text() === "/Yearly") {
          $pricingDuration.text("/Monthly");
          $currentPrice.text((priceValue / 10).toFixed(2));
        }
      }
    });
    // ========================= Toggle Monthly Yearly duration pricing plan Js End ===================
  });
  // ==========================================
  //      End Document Ready function
  // ==========================================

  // ========================= Preloader Js Start =====================
  $(window).on("load", function () {
    $(".preloader").fadeOut();
  });
  // ========================= Preloader Js End=====================

  // ========================= Header Sticky Js Start ==============
  $(window).on("scroll", function () {
    if ($(window).scrollTop() >= 100) {
      $(".header").addClass("fixed-header");
    } else {
      $(".header").removeClass("fixed-header");
    }
  });
  // ========================= Header Sticky Js End===================
})(jQuery);
