var babble = require('../index');

var emma = babble.babbler('emma').subscribe(),
    jack = babble.babbler('jack').subscribe();

emma.listen('hi')
    .listen(printMessage)
    .decide(function (message, context) {
      return (message.indexOf('age') != -1) ? 'age' : 'name';
    }, {
      'name': babble.tell('hi, my name is emma'),
      'age':  babble.tell('hi, my age is 27')
    });

jack.tell('emma', 'hi')
    .tell(function (message, context) {
      if (Math.random() > 0.5) {
        return 'my name is jack'
      } else {
        return 'my age is 25';
      }
    })
    .listen()
    .run(printMessage);

function printMessage (message, context) {
  console.log(context.from + ': ' + message);
  return message;
}