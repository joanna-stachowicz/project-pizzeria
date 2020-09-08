import {select} from '../settings.js';
import AmountWidget from './AmountWidget.js';

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

    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget, 1);
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

export default CartProduct;
