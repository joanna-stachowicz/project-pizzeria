import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import CarouselWidget from './components/CarouselWidget.js';

const app = {
  initPages: function () {             //ta metoda jest uruchamiana w momencie odświeżenia strony
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;   // kontenery podstron (section id="booking" i "order") - dzieci kontenera stron (<div id="pages">) // .children - zwraca tablicę
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisApp.pages[0].id; // jeśli zmienna zostałaby zdefiniowana wewnątrz pętli for, nie można by było z niej korzystać w innym miejscu

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;                    // nie zostaną wykonane kolejne iteracje pętli
      }
    }

    thisApp.activatePage(pageMatchingHash);     // <= aktywacja pierwszej z podstron w momencie otwarcia strony

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();

        /* get page id from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');  // w const id zapisujemy atr. href klikniętego elementu, w którym zamienimy znak '#' na pusty ciąg znaków => pozostaniemt tekst po '#'

        /* run thisApp.activatePage with that id */
        thisApp.activatePage(id);

        /* change URL hash */
        window.location.hash = '#/' + id;   // zapis '#/' sprawia, że strona się nie przewija w dół (na kontener o id="order") po kliknięciu w order
      });
    }
  },

  activatePage: function (pageId) {
    const thisApp = this;

    /* add class "active" to matching pages, remove from non-matching */
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);    // to, czy klasa zostanie nadana, czy nie, może być kontrolowana za pomocą drugiego argumentu
    }

    /* add class "active" to matching links, remove from non-matching */
    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }

    /* get elements cart and nav */
    const nav = document.querySelector(select.nav.mainNav);
    const cart = document.querySelector(select.containerOf.cart);

    /* add class 'visible' on main-nav and cart if home page is not turned on */
    if (pageId == 'home') {
      nav.classList.add(classNames.nav.invisible);
      cart.classList.add(classNames.cart.invisible);
    } else {
      nav.classList.remove(classNames.nav.invisible);
      cart.classList.remove(classNames.cart.invisible);
    }
  },

  initMenu: function () {   // initMenu to metoda lub klucz (nazwa właściwości), którego wartość jest funkcją
    const thisApp = this;
    // console.log('thisApp.data:', thisApp.data);

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function () {
    const thisApp = this;
    thisApp.data = {};

    const url = settings.db.url + '/' + settings.db.product;

    fetch(url)                             //wysłanie zapytania pod podany adres endpointu
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;

        /* execute initMenu method */
        thisApp.initMenu();
      });

    console.log('thisApp.data', JSON.stringify(thisApp.data));
  },

  initBooking: function () {
    const thisApp = this;

    thisApp.bookingWidget = document.querySelector(select.containerOf.booking);

    new Booking(thisApp.bookingWidget);
  },

  initCarousel: function () {
    const thisApp = this;

    thisApp.carouselWidget = document.getElementsByClassName(select.carousel.slides);
    console.log(thisApp.carouselWidget.length);

    new CarouselWidget(thisApp.carouselWidget);
  },

  init: function () {
    const thisApp = this;

    thisApp.initPages();

    thisApp.initData();

    thisApp.initCart();

    thisApp.initBooking();

    thisApp.initCarousel();
  },

  initCart: function () {               // inicjuje instancję koszyka  // przekażemy jej wrapper - kontener; element okalacjący - koszyka
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  },
};

app.init();

document.app = app;

