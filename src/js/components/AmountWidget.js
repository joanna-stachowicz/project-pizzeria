import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
  constructor(element, step) {
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.step = step;
    thisWidget.maxValue = settings.amountWidget.defaultMax;

    thisWidget.getElements(element);

    thisWidget.initActions();

    thisWidget.renderValue();
    // console.log('AmountWidget:', thisWidget);
  }

  getElements() {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  setValue(value) {
    const thisWidget = this;

    const newValue = thisWidget.parseValue(value);

    if (newValue != thisWidget.value && thisWidget.isValid(newValue)) {
      thisWidget.value = newValue;
      thisWidget.announce();
    }

    thisWidget.renderValue();
  }

  parseValue(value) {
    return parseFloat(value);
  }

  setMax(value){
    const thisWidget = this;
    thisWidget.maxValue = value;

    if (thisWidget.value > thisWidget.maxValue){
      thisWidget.value = thisWidget.maxValue;
    }
  }

  isValid(value) {
    const thisWidget = this;

    return !isNaN(value) // sprawdza, czy value nie jest nieliczbą; funkcja isNaN sprawdza, czy przekazana wartość jest NotaNumber
    && value >= settings.amountWidget.defaultMin
    && value <= thisWidget.maxValue;
  }

  renderValue() {
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }

  initActions() {
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.dom.input.value);
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function (event) {
      event.preventDefault();
      const valueDecreased = thisWidget.value - thisWidget.step ;
      thisWidget.setValue(valueDecreased);
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function (event) {
      event.preventDefault();
      const valueIncreased = thisWidget.value + thisWidget.step ;
      thisWidget.setValue(valueIncreased);
    });
  }

  announce() {           // tworzy instancje klasy Event wbudowanej w JS; ten event zostanie wywołany na kontenerze widgetu
    const thisWidget = this;

    const event = new CustomEvent('updated', {           // event, którego właściwości możemy kontrolować
      bubbles: true                                      // dzięki właśc. 'bubbles' ten event po wykonaniu na jakimś elemencie będzie przekazany jego rodzicowi oraz rodzicowi rodzica itd. (aż do <body>, document i window)
    });                                                  // event 'click' bąbelkuje domyślnie
    thisWidget.dom.wrapper.dispatchEvent(event);
  }

}

export default AmountWidget;
