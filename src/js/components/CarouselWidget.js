import {classNames, select} from '../settings.js';

class CarouselWidget {
  constructor(slides) {
    const thisWidget = this;

    thisWidget.slides = slides;

    thisWidget.initInterval();
    thisWidget.activateDots();
    thisWidget.addActive(slides[0]);
    const dot = document.querySelector(select.carousel.dots + '1');
    thisWidget.selectDot(dot);
  }

  addActive(slide) {
    slide.classList.add(classNames.pages.active);
  }

  removeActive(slide) {
    slide.classList.remove(classNames.pages.active);
  }

  initInterval() {
    const thisWidget = this;

    setInterval(function () {
      for (var slideIndex = 0; slideIndex < thisWidget.slides.length; slideIndex++) {
        if (slideIndex + 1 == thisWidget.slides.length) {
          thisWidget.addActive(thisWidget.slides[0]);
          thisWidget.slides[0].style.zIndex = 100;

          const dot = document.querySelector(select.carousel.dots + '1');
          thisWidget.selectDot(dot);

          setTimeout(thisWidget.removeActive, 350, thisWidget.slides[slideIndex]);

          break;
        }
        if (thisWidget.slides[slideIndex].classList.contains(classNames.pages.active)) {
          thisWidget.slides[slideIndex].removeAttribute('style');

          setTimeout(thisWidget.removeActive, 350, thisWidget.slides[slideIndex]);
          thisWidget.addActive(thisWidget.slides[slideIndex + 1]);

          const dot = document.querySelector(select.carousel.dots + (slideIndex + 2));
          thisWidget.selectDot(dot);

          break;
        }
      }
    },
    3000);
  }

  activateDots() {
    const thisWidget = this;

    thisWidget.dots = document.querySelectorAll(select.carousel.dots);

    for (let dot of thisWidget.dots) {
      dot.addEventListener('click', function() {
        thisWidget.selectDot(dot);
      });
    }
  }

  selectDot(dot) {
    const thisWidget = this;

    for (let otherDot of thisWidget.dots) {
      otherDot.classList.remove(classNames.carousel.clickedDot);
    }
    dot.classList.add(classNames.carousel.clickedDot);
  }
}

export default CarouselWidget;
