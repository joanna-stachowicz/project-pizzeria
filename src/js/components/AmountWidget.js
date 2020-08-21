import {settings, select} from '../settings.js';

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

export default AmountWidget;
