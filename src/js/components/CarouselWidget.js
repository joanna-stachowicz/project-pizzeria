import {classNames, select} from '../settings.js';

class CarouselWidget {
  constructor(slides) {
    const thisWidget = this;

    thisWidget.slides = slides;

    thisWidget.addActive(slides[0]);
    thisWidget.initInterval();
    thisWidget.activateDots();
  }

  addActive(slide) {
    slide.classList.add(classNames.pages.active);
  }

  removeActive(slide) {
    slide.classList.remove(classNames.pages.active);
  }

  withZ(slide) {
    slide.classList.add(classNames.carousel.zIndex);
  }

  withoutZ(slide) {
    slide.classList.remove(classNames.carousel.zIndex);
  }

  initInterval() {
    const thisWidget = this;

    setInterval(function() {
      for (let slideIndex = 0; slideIndex < thisWidget.slides.length; slideIndex++) {
        if (slideIndex + 1 == thisWidget.slides.length) {
          thisWidget.addActive(thisWidget.slides[0]);
          thisWidget.withZ(thisWidget.slides[0]);
          setTimeout(this.removeActive, 350, thisWidget.slides[slideIndex]);
          break;
        }
        if (thisWidget.slides[slideIndex].classList.contains(classNames.pages.active)) {
          thisWidget.withZ(thisWidget.slides[slideIndex]);
          setTimeout(thisWidget.removeActive, 350, thisWidget.slides[slideIndex]);
          thisWidget.addActive(thisWidget.slides[slideIndex + 1]);
          break;
        }
      }
    },
    3000);
  }

  activateDots() {
    const thisWidget = this;

    thisWidget.dots = document.querySelectorAll(select.carousel.dots);
  }
}

export default CarouselWidget;
