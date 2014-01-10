var assert = require('assert'),
    Babbler = require('../lib/Babbler'),
    Block = require('../lib/block/Block'),
    Reply = require('../lib/block/Reply'),
    Action = require('../lib/block/Action'),
    Decision = require('../lib/block/Decision');

describe('Babbler', function() {
  var emma, jack;

  beforeEach(function () {
    emma = new Babbler('emma').subscribe();
    jack = new Babbler('jack').subscribe();
  });

  afterEach(function () {
    // there shouldn't be any open conversations left
    assert.equal(Object.keys(emma.conversations).length, 0);
    assert.equal(Object.keys(jack.conversations).length, 0);

    emma.unsubscribe();
    jack.unsubscribe();

    emma = null;
    jack = null;
  });

  it('should create and destroy a babbler', function() {
    var susan = new Babbler('susan').subscribe();
    assert.ok(susan instanceof Babbler);
    susan.unsubscribe();
  });

  it('should throw an error when creating a babbler with wrong syntax', function() {
    assert.throws (function () {new Babbler(); });
    assert.throws (function () {Babbler('whoops'); });
  });

  describe ('listen', function () {

    it ('should listen to a message', function () {
      emma.listen('test', new Block());

      assert.equal(Object.keys(emma.listeners).length, 1);
    });

    it ('should throw an error when calling listen wrongly', function () {
      assert.throws(function () {emma.listen({'a': 'not a string'})});
      assert.throws(function () {emma.listen()});
    });

  });

  describe ('tell', function () {
    
    it('should tell a message', function(done) {
      emma.listen('test')
          .run(function (data) {
            assert.equal(data, null);
            done();
          });

      jack.tell('emma', 'test');
    });

    it('should tell a message with data', function(done) {
      emma.listen('test')
          .run(function (data) {
            assert.deepEqual(data, {a:2, b:3});
            done();
          });

      jack.tell('emma', 'test', {a:2, b:3});
    });

  });

  describe ('ask', function () {

    it('should ask a question and reply', function(done) {
      emma.listen('add')
          .reply(function (data) {
            return data.a + data.b;
          });

      jack.ask('emma', 'add', {a:2, b:3})
          .listen(function (result) {
            assert.equal(result, 5);
            done();
          });
    });

    it ('should ask a question, reply, and reply on the reply', function(done) {
      emma.listen('count')
          .reply(function (count) {
            return count + 1;
          })
          .listen(function (count) {
            assert.equal(count, 3);
            done();
          });

      jack.ask('emma', 'count', 0)
          .listen()
          .reply(function (count) {
            return count + 2;
          });
    });

    it('should make a decision during a conversation', function(done) {
      emma.listen('are you available?')
          .reply(function (data) {
            assert.strictEqual(data, undefined);
            return 'yes';
          });

      jack.ask('emma', 'are you available?')
          .listen()
          .decide(function (response) {
            assert.equal(response, 'yes');
            return response;
          }, {
            yes: new Action(function (response) {
              assert.equal(response, 'yes');
              done();
            })
          });
    });

    it('should run action nodes', function(done) {
      var logs = [];

      emma.listen('are you available?')
          .run(function (response) {
            logs.push('log 1');
          })
          .reply(function (response) {
            logs.push('log 2');
            assert.strictEqual(response, undefined);
            return 'yes';
          });

      jack.ask('emma', 'are you available?')
          .listen(function (response) {
            assert.equal(response, 'yes');
            logs.push('log 3');
          })
          .run(function () {
            logs.push('log 4');

            assert.deepEqual(logs, ['log 1', 'log 2', 'log 3', 'log 4']);

            done();
          });
    });

    it ('should keep state in the context during the conversation', function(done) {
      emma.listen('question')
          .run(function (response, context) {
            context.a = 1;
          })
          .decide(function (response, context) {
            context.b = 2;
            assert.equal(context.a, 1);

            return 'first'
          }, {
            first: new Reply(function (response, context) {
                  assert.equal(response, 'a');
                  assert.equal(context.a, 1);
                  assert.equal(context.b, 2);
                  context.c = 3;

                  return 'b';
                })
                .run(function (response, context) {
                  assert.equal(response, 'c');
                  assert.equal(context.a, 1);
                  assert.equal(context.b, 2);
                  assert.equal(context.c, 3);
                  done();
                })
          });

      jack.ask('emma', 'question', 'a')
          .run(function (response, context) {
            context.a = 1;
          })
          .reply(function (response, context) {
            assert.equal(response, 'b');
            assert.equal(context.a, 1);

            return 'c';
          });
    });

  });

});
