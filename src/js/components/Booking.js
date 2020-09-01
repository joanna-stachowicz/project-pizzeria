import {templates, select, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
  constructor(wrapper) {
    const thisBooking = this;

    thisBooking.render(wrapper);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {         // pobiera dane z API używając adresów z parametrami filtrującymi wyniki
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    // console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking
        + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsRepeat.join('&'),
    };

    // console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {     // ten zapis oznacza: potraktuj pierwszy argument jako tablicę i pierwszy element z tej tablicy zapisz w zmiennej bookings
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log('loop', hourBlock);

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;       // tego dnia o tej godzinie wszystkie stoliki są dostępne

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {

      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove(classNames.booking.tableSelected);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  getMaxHours(){
    const thisBooking = this;
    let minHours = settings.hours.close - thisBooking.hour;
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (table.classList.contains(classNames.booking.tableSelected)) {
        let possibleHours = 0;
        for (let hour = 0.0; hour < minHours; hour += 0.5) {
          const hourBlock = thisBooking.hour + hour;
          if (typeof thisBooking.booked[thisBooking.date][hourBlock] == 'undefined') {
            possibleHours = hour + 0.5;
          } else if (thisBooking.booked[thisBooking.date][hourBlock].indexOf(tableId) == -1) {
            possibleHours = hour + 0.5;
          } else {
            break;
          }
        }
        if (possibleHours < minHours)
          minHours = possibleHours;
      }
    }
    return minHours;
  }

  initSelectTable() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        if (!(table.classList.contains(classNames.booking.tableBooked))) {
          table.classList.toggle(classNames.booking.tableSelected);
          const maxHours = thisBooking.getMaxHours();
          thisBooking.hoursAmount.setMax(maxHours);
        }
      });
    }
  }

  getStarters() {
    const thisBooking = this;

    const formData = utils.serializeFormToObject(thisBooking.dom.form);

    if (formData.hasOwnProperty(select.booking.starter)) {
      return formData[select.booking.starter];
    } else {
      return [];
    }
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (typeof thisBooking.booked[thisBooking.date] == 'undefined') {
        continue;
      }

      for (let hourBlock = thisBooking.hour; hourBlock < thisBooking.hour + thisBooking.hoursAmount.value; hourBlock += 0.5) {

        if (typeof thisBooking.booked[thisBooking.date][hourBlock] == 'undefined') {
          continue;
        }

        if (thisBooking.booked[thisBooking.date][hourBlock].indexOf(tableId) != -1) {
          alert('Nie można zarezerwować tego stolika.');
          return;
        }
      }
    }

    for (let table of thisBooking.dom.tables) {
      if (table.classList.contains(classNames.booking.tableSelected)) {
        let tableId = table.getAttribute(settings.booking.tableIdAttribute);
        if (!isNaN(tableId)) {
          tableId = parseInt(tableId);
        }

        const payload = {
          date: thisBooking.date,
          hour: thisBooking.hourPicker.value,
          table: tableId,
          duration: thisBooking.hoursAmount.value,
          ppl: thisBooking.peopleAmount.value,
          starters: thisBooking.getStarters(),
        };

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };

        fetch(url, options)
          .then(function (response) {
            return response.json();
          })
          .then(function (parsedResponse) {
            console.log('parsedResponse', parsedResponse);
          });
      }
    }
  }

  render(bookingWidget) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = bookingWidget;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount, 1);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount, 0.5);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.initSelectTable();

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
}

export default Booking;
