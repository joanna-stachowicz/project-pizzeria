import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

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

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem, 1);

    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });

  }

  addToCart() {            // przekazuje całą instancję jako argument metody app.cart.add
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;

    /* hej koszyku dodaj mnie */
    // app.cart.add(thisProduct);    // app.cart -- wywołanie instancji klasy Cart (zapisanej w thisApp.cart)  // app - stała globalna // cart - klucz wewnątrz tej stałej // add - wywołanie metody w obcej klasie
    // metoda add otrzymuje odwołanie do instancji, dzięki czemu może odczytać jej właściwości i wykoanć jej metody
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;
