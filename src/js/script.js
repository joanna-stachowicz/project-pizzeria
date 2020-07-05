/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',      // zmiana widoczności opcji ma się odbywać na kliknięcie
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      //obiekt.właściwość(klucz) = wartość;
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.initAkordion();

      console.log('new Product:', thisProduct);
    }
    renderInMenu() {
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      console.log(generatedHTML);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }
    initAkordion() {
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      const clickedElement = thisProduct.element.querySelector(select.menuProduct.clickable);

      /* START: click event listener to trigger */
      clickedElement.addEventListener('click', function (event) {
        console.log('clicked');

        /* prevent default action for event */
        event.preventDefault();

        /* toggle active class on element of thisProduct */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);

        /* find all active products */
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
        console.log(activeProducts);

        /* START LOOP: for each active product */


          /* START: if the active product isn't the element of thisProduct */


            /* remove class active for the active product */


            /* END: if the active product isn't the element of thisProduct */


          /* END LOOP: for each active product */


        /* END: click event listener to trigger */

    }
  }

  const app = {
    initMenu: function () {                                   // initMenu to metoda lub klucz, którego wartość jest funkcją
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = dataSource;                             // .data - klucz wewnątrz obiektu app    dataSource - jego wartość
    },

    init: function () {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();

      thisApp.initMenu();
    },
  };

  app.init();
}
