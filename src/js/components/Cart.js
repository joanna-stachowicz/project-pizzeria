import {settings, select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {                       // pokazywanie i ukrywanie koszyka; dodawanie/usuwanie produktów; podliczanie ceny zamówienia
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

    fetch(url, options)              // wysyłamy zapytania pod takie adresy (numery telefonów)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse) {
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

export default Cart;
