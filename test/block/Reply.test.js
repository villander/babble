var assert = require('assert'),
    Reply = require('../../lib/block/Reply');

describe('Reply', function() {

  it('should create a reply', function () {
    var reply1 = new Reply(function () {});
    assert.ok(reply1 instanceof Reply);

    var reply2 = new Reply(function () {}, new Reply(function () {}));
    assert.ok(reply2 instanceof Reply);
  });

  it('should throw an error when wrongly creating a reply', function () {
    assert.throws(function () { Reply(function () {}) }, SyntaxError);
    assert.throws(function () { new Reply()}, TypeError);
    assert.throws(function () { new Reply('bla')}, TypeError);
  });

  it('should execute a reply without arguments', function () {
    var reply = new Reply(function (response, context) {
      assert.strictEqual(response, undefined);
      assert.strictEqual(context, undefined);
      return 'foo';
    });

    var next = reply.execute();
    assert.deepEqual(next, {
      result: 'foo',
      block: undefined
    })
  });

  it('should execute a reply with context', function () {
    var context = {a: 2};
    var reply = new Reply(function (response, context) {
      assert.strictEqual(response, undefined);
      assert.deepEqual(context, {a: 2});
      return 'foo';
    });

    var next = reply.execute(context);
    assert.deepEqual(next, {
      result: 'foo',
      block: undefined
    })
  });

  it('should execute a reply with context and argument', function () {
    var context = {a: 2};
    var reply = new Reply(function (response, context) {
      assert.strictEqual(response, 'hello world');
      assert.deepEqual(context, {a: 2});
      return 'foo'
    });

    var next = reply.execute(context, 'hello world');
    assert.deepEqual(next, {
      result: 'foo',
      block: undefined
    })
  });

  it('should execute a reply with next block', function () {
    var reply = new Reply(function () {return 'foo'});
    var nextReply = new Reply (function () {return 'foo'});
    reply.chain(nextReply);

    var next = reply.execute();
    assert.strictEqual(next.result, 'foo');
    assert.strictEqual(next.block, nextReply);
  });

  it('should throw an error when callback does not return a result', function () {
    var reply = new Reply(function (response, context) {
      return undefined;
    });

    assert.throws(function () {reply.execute();});
  });

});
