/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
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
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      //obiekt.właściwość(klucz) = wartość;
      thisProduct.id = id;             // tworzę thisProduct.id i .data, żeby móc z nich korzystać w innych metodach tej samej klasy
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      // console.log('new Product:', thisProduct);
    }

    renderInMenu() {
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);        // tworzę kod HTML produktów
      // console.log(generatedHTML);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);        // przekształcam HTML w obiekt DOM, aby istaniała możliwość wyświetlenia HTMLa na stronie (na razie się nie wyświetla)
      // console.log(thisProduct.element);
      // console.log(thisProduct);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);  // szukam miejsca, gdzie chcę umieścicć ten obiekt DOM

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);          // umieszczam obiekt DOM w konkretnym miejscu
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;

      /* START: click event listener to trigger */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        // console.log('clicked');

        /* prevent default action for event */
        event.preventDefault();

        /* toggle active class on element of thisProduct */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);        // element bieżącego produktu

        /* find all active products */
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
        // console.log(activeProducts);

        /* START LOOP: for each active product */
        for (let activeProduct of activeProducts) {

          /* START: if the active product isn't the element of thisProduct */
          if (activeProduct != thisProduct.element) {

            /* remove class active for the active product */
            activeProduct.classList.remove(classNames.menuProduct.wrapperActive);

            /* END: if the active product isn't the element of thisProduct */
          }

          /* END LOOP: for each active product */
        }

        /* END: click event listener to trigger */
      });
    }

    initOrderForm() {       // dodanie listenerów eventów do formularza, jego kontrolek i guzika dodania do koszyka
      const thisProduct = this;
      // console.log('initOrderForm');

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();            // blokowanie wysłania formularza z przeładowaniem strony i zmiany adresu strony po kliknięciu w link
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {             // obliczanie ceny produktu

      const thisProduct = this;
      // console.log('processOrder');

      /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
      const formData = utils.serializeFormToObject(thisProduct.form);          // formData - zawiera zaznaczone opcje
      // console.log('formData', formData);

      /* set variable price to equal thisProduct.data.price */
      thisProduct.params = {};            // wybrane opcje do zamówionego produktu

      let price = thisProduct.data.price;
      // console.log(price);

      /* START LOOP: for each paramId in thisProduct.data.params */
      for (let paramId in thisProduct.data.params) {

        /* save the element in thisProduct.data.params with key paramId as const param */
        const param = thisProduct.data.params[paramId];
        // console.log(param);

        /* START LOOP: for each optionId in param.options */
        for (let optionId in param.options) {
          // console.log(optionId);

          /* save the element in param.options with key optionId as const option */
          const option = param.options[optionId];
          // console.log(option);

          /* START IF: if option is selected and option is not default */
          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
          if (optionSelected && !option.default) {
            /* add price of option to variable price */
            price += option.price;
            /* END IF: if option is selected and option is not default */
          }
          /* START ELSE IF: if option is not selected and option is default */
          else if (!optionSelected && option.default) {
            /* deduct price of option from price */
            price -= option.price;
            /* END ELSE IF: if option is not selected and option is default */
          }

          /* save all found images as const selector */
          const selector = '.' + paramId + '-' + optionId;
          const optionImages = thisProduct.imageWrapper.querySelectorAll(selector);
          // console.log(optionImages);

          /* add 'active' class to the image */
          /* START IF: If option is selected */
          if (optionSelected) {
            if (!thisProduct.params[paramId]) {
              // console.log(thisProduct.params[paramId]);            // czy parametr został już dodany?
              thisProduct.params[paramId] = {
                label: param.label,
                options: {},
              };
            }
            thisProduct.params[paramId].options[optionId] = option.label;

            for (let optionImage of optionImages) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            }
          /* END IF: If option is selected */
          }
          else {
            for (let optionImage of optionImages) {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

          /* END LOOP: for each optionId in param.options */
        }
        /* END LOOP: for each paramId in thisProduct.data.params */
      }

      /* multiply price by amount */
      // price *= thisProduct.amountWidget.value;
      thisProduct.priceSingle = price;                           // właściwość produktu z ceną 1 sztuki
      thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;        // właściwość produktu z ceną całkowią price (price * ilość)

      /* set the contents of thisProduct.priceElem to be the value of variable price */
      // thisProduct.priceElem.innerHTML = price;
      thisProduct.priceElem.innerHTML = thisProduct.price;

      // console.log(thisProduct.params);
    }

    initAmountWidget() {       // tworzy instancję klasy AmountWidget i zapisuje ją we właściwości produktu
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });

    }

    addToCart() {            // przekazuje całą instancję jako argument metody app.cart.add
      const thisProduct = this;

      thisProduct.name = thisProduct.data.name;
      thisProduct.amount = thisProduct.amountWidget.value;

      /* hej koszyku dodaj mnie */
      app.cart.add(thisProduct);    // app.cart -- wywołanie instancji klasy Cart (zapisanej w thisApp.cart)  // app - stała globalna // cart - klucz wewnątrz tej stałej // add - wywołanie metody w obcej klasie
    }                              // metoda add otrzymuje odwołanie do instancji, dzięki czemu może odczytać jej właściwości i wykoanć jej metody
  }

  class AmountWidget {
    constructor(element) {          // odniesienie do elementu, w którym widget ma zostać zainicjowany
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.input.value = settings.amountWidget.defaultValue;
      // console.log(thisWidget.value);

      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();

      // console.log('AmountWidget:', thisWidget);
      // console.log('constructor arguments:', element);
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;    // tworzymy kopię elementu, aby móc z niego korzystać we wszystkich metodach tej klasy, np. announce
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {                   // ustawianie nowej wartości widgetu
      const thisWidget = this;

      const newValue = parseInt(value);

      /* TODO: Add validation */
      // newValue - będziemy sprawdzać, czy wartość jest poprawna, czy mieści się w zakresie; jeśli tak, zostanie zapisana jako wartość thisWidget.value

      if (newValue != thisWidget.value && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        // console.log(newValue);
        // console.log(thisWidget.value);
        thisWidget.value = newValue;            // zapisanie wartości przekazanego arg. po przekonwertowaniu go na liczbę
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;   // ustawienie nowej wartości inputa; dzięki temu nowa wartość wyswietli się na stronie
    }

    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        const valueDecreased = thisWidget.value - 1;
        thisWidget.setValue(valueDecreased);
      });

      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        const valueIncreased = thisWidget.value + 1;
        thisWidget.setValue(valueIncreased);
      });
    }

    announce() {           // tworzy instancje klasy Event wbudowanej w JS; ten event zostanie wywołany na kontenerze widgetu
      const thisWidget = this;

      const event = new CustomEvent('updated', {           // event, którego właściwości możemy kontrolować
        bubbles: true                                      // dzięki właśc. 'bubbles' ten event po wykonaniu na jakimś elemencie będzie przekazany jego rodzicowi oraz rodzicowi rodzica itd. (aż do <body>, document i window)
      });                                                  // event 'click' bąbelkuje domyślnie
      thisWidget.element.dispatchEvent(event);
    }

  }

  /* pokazywanie i ukrywanie koszyka; dodawanie/usuwanie produktów; podliczanie ceny zamówienia */
  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];    // produkty dodane do koszyka
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

      thisCart.getElements(element);
      thisCart.initActions();

      // console.log('new Cart:', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};     // wszystkie elementy DOM wyszukane w komponencie koszyka (ułatwi nazewnictwo)

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);     // podsumowanie koszyka - górna belka
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

      for (let key of thisCart.renderTotalsKeys) {
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
      }
    }

    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener ('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener ('updated', function() {
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener ('remove', function(event) {
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener ('submit', function(event) {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    sendOrder() {
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.order;       // w url jest adres endpointu

      const payload = {         // ładunek - dane wysyłane do serwera
        totalPrice: thisCart.totalPrice,
        totalNumber: thisCart.totalNumber,
        subtotalPrice: thisCart.subtotalPrice,
        deliveryFee: thisCart.deliveryFee,
        phone: thisCart.dom.phone.value,
        address: thisCart.dom.address.value,
        products: [],
      };

      for (let product of thisCart.products) {
        const data = product.getData();
        payload.products.push(data);
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function(response) {
          return response.json();
        }).then(function(parsedResponse) {
          console.log('parsedResponse', parsedResponse);
        });
    }

    add(menuProduct) {
      const thisCart = this;

      // console.log('adding product:', menuProduct);

      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);
      // console.log(generatedHTML);

      /* create element using utils.createElementFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      /* add element to cart */
      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct (menuProduct, generatedDOM));
      // console.log('thisCart.products', thisCart.products);

      thisCart.update();

    }

    update() {
      const thisCart = this;

      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for (let cartProduct of thisCart.products) {
        console.log(cartProduct);

        thisCart.subtotalPrice = thisCart.subtotalPrice + cartProduct.price;
        thisCart.totalNumber = thisCart.totalNumber + cartProduct.amount;
      }

      thisCart.totalPrice = this.subtotalPrice + this.deliveryFee;

      console.log('total number: ', thisCart.totalNumber);
      console.log('subtotal price: ', thisCart.subtotalPrice);
      console.log('total price: ', thisCart.totalPrice);

      for (let key of thisCart.renderTotalsKeys) {
        for (let elem of thisCart.dom[key]) {
          elem.innerHTML = thisCart[key];
        }
      }
    }

    remove(cartProduct) {
      const thisCart = this;

      const index = thisCart.products.indexOf(cartProduct);

      const removedProduct = thisCart.products.splice(index, 1);
      console.log('removed product: ', removedProduct);

      cartProduct.dom.wrapper.remove();

      thisCart.update();
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      // console.log('new CartProduct: ', thisCartProduct);
      // console.log('productData: ', menuProduct);
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget() {       // tworzy instancję klasy AmountWidget i zapisuje ją we właściwości produktu
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.amountWidget.setValue(thisCartProduct.amount);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function() {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });

    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent ('remove', {
        bubbles: true,
        detail: {                                    // właśc. detail - przekazanie informacji do handlera eventu
          cartProduct: thisCartProduct,              // przekazujemy odwołanie do tej instancji, dla której kliknięto guzik usuwania
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
      console.log('the remove method is called');
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener ('click', function(event) {
        event.preventDefault();
      });

      thisCartProduct.dom.remove.addEventListener ('click', function(event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    getData() {
      const thisCartProduct = this;

      const data = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        params: thisCartProduct.params,
      };
      return data;

    }
  }

  const app = {
    initMenu: function () {                                   // initMenu to metoda lub klucz (nazwa właściwości), którego wartość jest funkcją
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

      fetch(url)
        .then(function(rawResponse) {
          return rawResponse.json();
        })
        .then(function(parsedResponse) {
          console.log('parsedResponse', parsedResponse);

          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();
        });

      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },

    init: function () {
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();

      thisApp.initCart();
    },

    initCart: function () {               // inicjuje instancję koszyka  // przekażemy jej wrapper - kontener; element okalacjący - koszyka
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };

  app.init();
}
