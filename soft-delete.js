'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends6 = require('babel-runtime/helpers/extends');

var _extends7 = _interopRequireDefault(_extends6);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _debug2 = require('./debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)();

exports.default = function (Model, _ref) {
  var _ref$deletedAt = _ref.deletedAt;
  var deletedAt = _ref$deletedAt === undefined ? 'deletedAt' : _ref$deletedAt;
  var _ref$_isDeleted = _ref._isDeleted;

  var _isDeleted = _ref$_isDeleted === undefined ? '_isDeleted' : _ref$_isDeleted;

  var _ref$scrub = _ref.scrub;
  var scrub = _ref$scrub === undefined ? false : _ref$scrub;

  debug('SoftDelete mixin for Model %s', Model.modelName);

  debug('options', { deletedAt: deletedAt, _isDeleted: _isDeleted, scrub: scrub });

  var properties = Model.definition.properties;

  var scrubbed = {};
  if (scrub !== false) {
    var propertiesToScrub = scrub;
    if (!Array.isArray(propertiesToScrub)) {
      propertiesToScrub = (0, _keys2.default)(properties).filter(function (prop) {
        return !properties[prop].id && prop !== _isDeleted;
      });
    }
    scrubbed = propertiesToScrub.reduce(function (obj, prop) {
      return (0, _extends7.default)({}, obj, (0, _defineProperty3.default)({}, prop, null));
    }, {});
  }

  Model.defineProperty(deletedAt, { type: Date, required: false, default: false });
  Model.defineProperty(_isDeleted, { type: Boolean, required: true, default: false });

  Model.destroyAll = function softDestroyAll(where, cb) {
    var _extends3;

    return Model.updateAll(where, (0, _extends7.default)({}, scrubbed, (_extends3 = {}, (0, _defineProperty3.default)(_extends3, deletedAt, new Date()), (0, _defineProperty3.default)(_extends3, _isDeleted, true), _extends3))).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.remove = Model.destroyAll;
  Model.deleteAll = Model.destroyAll;

  Model.destroyById = function softDestroyById(id, cb) {
    var _extends4;

    return Model.updateAll({ id: id }, (0, _extends7.default)({}, scrubbed, (_extends4 = {}, (0, _defineProperty3.default)(_extends4, deletedAt, new Date()), (0, _defineProperty3.default)(_extends4, _isDeleted, true), _extends4))).then(function (result) {
      return typeof cb === 'function' ? cb(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? cb(error) : _promise2.default.reject(error);
    });
  };

  Model.removeById = Model.destroyById;
  Model.deleteById = Model.destroyById;

  Model.prototype.destroy = function softDestroy(options, cb) {
    var _extends5;

    var callback = cb === undefined && typeof options === 'function' ? options : cb;

    return this.updateAttributes((0, _extends7.default)({}, scrubbed, (_extends5 = {}, (0, _defineProperty3.default)(_extends5, deletedAt, new Date()), (0, _defineProperty3.default)(_extends5, _isDeleted, true), _extends5))).then(function (result) {
      return typeof cb === 'function' ? callback(null, result) : result;
    }).catch(function (error) {
      return typeof cb === 'function' ? callback(error) : _promise2.default.reject(error);
    });
  };

  Model.prototype.remove = Model.prototype.destroy;
  Model.prototype.delete = Model.prototype.destroy;

  // Emulate default scope but with more flexibility.
  var queryNonDeleted = (0, _defineProperty3.default)({}, _isDeleted, false);
  var _findOrCreate = Model.findOrCreate;
  Model.findOrCreate = function findOrCreateDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (!query.where) query.where = {};

    if (!query.deleted) {
      query.where = { and: [query.where, queryNonDeleted] };
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return _findOrCreate.call.apply(_findOrCreate, [Model, query].concat(rest));
  };

  var _find = Model.find;
  Model.find = function findDeleted() {
    var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // if (!query.where) query.where = {};

    if (!query.deleted) {
      if (!query.where) {
        query.where = queryNonDeleted;
      } else {
        query.where = { and: [query.where, queryNonDeleted] };
      }
    }

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    return _find.call.apply(_find, [Model, query].concat(rest));
  };

  var _count = Model.count;
  Model.count = function countDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because count only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = { and: [where, queryNonDeleted] };

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    return _count.call.apply(_count, [Model, whereNotDeleted].concat(rest));
  };

  var _update = Model.update;
  Model.update = Model.updateAll = function updateDeleted() {
    var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Because update/updateAll only receives a 'where', there's nowhere to ask for the deleted entities.
    var whereNotDeleted = { and: [where, queryNonDeleted] };

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    return _update.call.apply(_update, [Model, whereNotDeleted].concat(rest));
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvZnQtZGVsZXRlLmpzIl0sIm5hbWVzIjpbImRlYnVnIiwiTW9kZWwiLCJkZWxldGVkQXQiLCJfaXNEZWxldGVkIiwic2NydWIiLCJtb2RlbE5hbWUiLCJwcm9wZXJ0aWVzIiwiZGVmaW5pdGlvbiIsInNjcnViYmVkIiwicHJvcGVydGllc1RvU2NydWIiLCJBcnJheSIsImlzQXJyYXkiLCJmaWx0ZXIiLCJwcm9wIiwiaWQiLCJyZWR1Y2UiLCJvYmoiLCJkZWZpbmVQcm9wZXJ0eSIsInR5cGUiLCJEYXRlIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwiQm9vbGVhbiIsImRlc3Ryb3lBbGwiLCJzb2Z0RGVzdHJveUFsbCIsIndoZXJlIiwiY2IiLCJ1cGRhdGVBbGwiLCJ0aGVuIiwicmVzdWx0IiwiY2F0Y2giLCJlcnJvciIsInJlamVjdCIsInJlbW92ZSIsImRlbGV0ZUFsbCIsImRlc3Ryb3lCeUlkIiwic29mdERlc3Ryb3lCeUlkIiwicmVtb3ZlQnlJZCIsImRlbGV0ZUJ5SWQiLCJwcm90b3R5cGUiLCJkZXN0cm95Iiwic29mdERlc3Ryb3kiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJ1cGRhdGVBdHRyaWJ1dGVzIiwiZGVsZXRlIiwicXVlcnlOb25EZWxldGVkIiwiX2ZpbmRPckNyZWF0ZSIsImZpbmRPckNyZWF0ZSIsImZpbmRPckNyZWF0ZURlbGV0ZWQiLCJxdWVyeSIsImRlbGV0ZWQiLCJhbmQiLCJyZXN0IiwiY2FsbCIsIl9maW5kIiwiZmluZCIsImZpbmREZWxldGVkIiwiX2NvdW50IiwiY291bnQiLCJjb3VudERlbGV0ZWQiLCJ3aGVyZU5vdERlbGV0ZWQiLCJfdXBkYXRlIiwidXBkYXRlIiwidXBkYXRlRGVsZXRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxRQUFRLHNCQUFkOztrQkFFZSxVQUFDQyxLQUFELFFBQWtGO0FBQUEsNEJBQXhFQyxTQUF3RTtBQUFBLE1BQXhF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QUFNO0FBQUE7O0FBR3ZELFdBQU9LLE9BQU9KLElBQVAsZ0JBQVl0RCxLQUFaLEVBQW1CNkQsZUFBbkIsU0FBdUNSLElBQXZDLEVBQVA7QUFDRCxHQUpEOztBQU1BLE1BQU1TLFVBQVU5RCxNQUFNK0QsTUFBdEI7QUFDQS9ELFFBQU0rRCxNQUFOLEdBQWUvRCxNQUFNMEIsU0FBTixHQUFrQixTQUFTc0MsYUFBVCxHQUE0QztBQUFBLFFBQXJCeEMsS0FBcUIsdUVBQWIsRUFBYTs7QUFDM0U7QUFDQSxRQUFNcUMsa0JBQWtCLEVBQUVULEtBQUssQ0FBRTVCLEtBQUYsRUFBU3NCLGVBQVQsQ0FBUCxFQUF4Qjs7QUFGMkUsdUNBQU5PLElBQU07QUFBTkEsVUFBTTtBQUFBOztBQUczRSxXQUFPUyxRQUFRUixJQUFSLGlCQUFhdEQsS0FBYixFQUFvQjZELGVBQXBCLFNBQXdDUixJQUF4QyxFQUFQO0FBQ0QsR0FKRDtBQUtELEMiLCJmaWxlIjoic29mdC1kZWxldGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgX2RlYnVnIGZyb20gJy4vZGVidWcnO1xuY29uc3QgZGVidWcgPSBfZGVidWcoKTtcblxuZXhwb3J0IGRlZmF1bHQgKE1vZGVsLCB7IGRlbGV0ZWRBdCA9ICdkZWxldGVkQXQnLCBfaXNEZWxldGVkID0gJ19pc0RlbGV0ZWQnLCBzY3J1YiA9IGZhbHNlIH0pID0+IHtcbiAgZGVidWcoJ1NvZnREZWxldGUgbWl4aW4gZm9yIE1vZGVsICVzJywgTW9kZWwubW9kZWxOYW1lKTtcblxuICBkZWJ1Zygnb3B0aW9ucycsIHsgZGVsZXRlZEF0LCBfaXNEZWxldGVkLCBzY3J1YiB9KTtcblxuICBjb25zdCBwcm9wZXJ0aWVzID0gTW9kZWwuZGVmaW5pdGlvbi5wcm9wZXJ0aWVzO1xuXG4gIGxldCBzY3J1YmJlZCA9IHt9O1xuICBpZiAoc2NydWIgIT09IGZhbHNlKSB7XG4gICAgbGV0IHByb3BlcnRpZXNUb1NjcnViID0gc2NydWI7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHByb3BlcnRpZXNUb1NjcnViKSkge1xuICAgICAgcHJvcGVydGllc1RvU2NydWIgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgICAgICAuZmlsdGVyKHByb3AgPT4gIXByb3BlcnRpZXNbcHJvcF0uaWQgJiYgcHJvcCAhPT0gX2lzRGVsZXRlZCk7XG4gICAgfVxuICAgIHNjcnViYmVkID0gcHJvcGVydGllc1RvU2NydWIucmVkdWNlKChvYmosIHByb3ApID0+ICh7IC4uLm9iaiwgW3Byb3BdOiBudWxsIH0pLCB7fSk7XG4gIH1cblxuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShkZWxldGVkQXQsIHt0eXBlOiBEYXRlLCByZXF1aXJlZDogZmFsc2UsZGVmYXVsdDpmYWxzZX0pO1xuICBNb2RlbC5kZWZpbmVQcm9wZXJ0eShfaXNEZWxldGVkLCB7dHlwZTpCb29sZWFuLCByZXF1aXJlZDogdHJ1ZSwgZGVmYXVsdDogZmFsc2V9KTtcblxuICBNb2RlbC5kZXN0cm95QWxsID0gZnVuY3Rpb24gc29mdERlc3Ryb3lBbGwod2hlcmUsIGNiKSB7XG4gICAgcmV0dXJuIE1vZGVsLnVwZGF0ZUFsbCh3aGVyZSwgeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2IobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucmVtb3ZlID0gTW9kZWwuZGVzdHJveUFsbDtcbiAgTW9kZWwuZGVsZXRlQWxsID0gTW9kZWwuZGVzdHJveUFsbDtcblxuICBNb2RlbC5kZXN0cm95QnlJZCA9IGZ1bmN0aW9uIHNvZnREZXN0cm95QnlJZChpZCwgY2IpIHtcbiAgICByZXR1cm4gTW9kZWwudXBkYXRlQWxsKHsgaWQ6IGlkIH0sIHsgLi4uc2NydWJiZWQsIFtkZWxldGVkQXRdOiBuZXcgRGF0ZSgpLCBbX2lzRGVsZXRlZF06IHRydWUgfSlcbiAgICAgIC50aGVuKHJlc3VsdCA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNiKG51bGwsIHJlc3VsdCkgOiByZXN1bHQpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgPyBjYihlcnJvcikgOiBQcm9taXNlLnJlamVjdChlcnJvcikpO1xuICB9O1xuXG4gIE1vZGVsLnJlbW92ZUJ5SWQgPSBNb2RlbC5kZXN0cm95QnlJZDtcbiAgTW9kZWwuZGVsZXRlQnlJZCA9IE1vZGVsLmRlc3Ryb3lCeUlkO1xuXG4gIE1vZGVsLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gc29mdERlc3Ryb3kob3B0aW9ucywgY2IpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IChjYiA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSA/IG9wdGlvbnMgOiBjYjtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUF0dHJpYnV0ZXMoeyAuLi5zY3J1YmJlZCwgW2RlbGV0ZWRBdF06IG5ldyBEYXRlKCksIFtfaXNEZWxldGVkXTogdHJ1ZSB9KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpID8gY2FsbGJhY2sobnVsbCwgcmVzdWx0KSA6IHJlc3VsdClcbiAgICAgIC5jYXRjaChlcnJvciA9PiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSA/IGNhbGxiYWNrKGVycm9yKSA6IFByb21pc2UucmVqZWN0KGVycm9yKSk7XG4gIH07XG5cbiAgTW9kZWwucHJvdG90eXBlLnJlbW92ZSA9IE1vZGVsLnByb3RvdHlwZS5kZXN0cm95O1xuICBNb2RlbC5wcm90b3R5cGUuZGVsZXRlID0gTW9kZWwucHJvdG90eXBlLmRlc3Ryb3k7XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IHNjb3BlIGJ1dCB3aXRoIG1vcmUgZmxleGliaWxpdHkuXG4gIHZhciBxdWVyeU5vbkRlbGV0ZWQgPSB7IFtfaXNEZWxldGVkXTogZmFsc2UgfTtcbiAgY29uc3QgX2ZpbmRPckNyZWF0ZSA9IE1vZGVsLmZpbmRPckNyZWF0ZTtcbiAgTW9kZWwuZmluZE9yQ3JlYXRlID0gZnVuY3Rpb24gZmluZE9yQ3JlYXRlRGVsZXRlZChxdWVyeSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgaWYgKCFxdWVyeS53aGVyZSkgcXVlcnkud2hlcmUgPSB7fTtcblxuICAgIGlmICghcXVlcnkuZGVsZXRlZCkge1xuICAgICAgcXVlcnkud2hlcmUgPSB7IGFuZDogWyBxdWVyeS53aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICB9XG5cbiAgICByZXR1cm4gX2ZpbmRPckNyZWF0ZS5jYWxsKE1vZGVsLCBxdWVyeSwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX2ZpbmQgPSBNb2RlbC5maW5kO1xuICBNb2RlbC5maW5kID0gZnVuY3Rpb24gZmluZERlbGV0ZWQocXVlcnkgPSB7fSwgLi4ucmVzdCkge1xuICAgIC8vIGlmICghcXVlcnkud2hlcmUpIHF1ZXJ5LndoZXJlID0ge307XG5cbiAgICBpZiAoIXF1ZXJ5LmRlbGV0ZWQpIHtcbiAgICAgIGlmICghcXVlcnkud2hlcmUpXG4gICAgICB7XG4gICAgICAgIHF1ZXJ5LndoZXJlID0gcXVlcnlOb25EZWxldGVkO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBxdWVyeS53aGVyZSA9IHsgYW5kOiBbIHF1ZXJ5LndoZXJlLCBxdWVyeU5vbkRlbGV0ZWQgXSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBfZmluZC5jYWxsKE1vZGVsLCBxdWVyeSwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX2NvdW50ID0gTW9kZWwuY291bnQ7XG4gIE1vZGVsLmNvdW50ID0gZnVuY3Rpb24gY291bnREZWxldGVkKHdoZXJlID0ge30sIC4uLnJlc3QpIHtcbiAgICAvLyBCZWNhdXNlIGNvdW50IG9ubHkgcmVjZWl2ZXMgYSAnd2hlcmUnLCB0aGVyZSdzIG5vd2hlcmUgdG8gYXNrIGZvciB0aGUgZGVsZXRlZCBlbnRpdGllcy5cbiAgICBjb25zdCB3aGVyZU5vdERlbGV0ZWQgPSB7IGFuZDogWyB3aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICByZXR1cm4gX2NvdW50LmNhbGwoTW9kZWwsIHdoZXJlTm90RGVsZXRlZCwgLi4ucmVzdCk7XG4gIH07XG5cbiAgY29uc3QgX3VwZGF0ZSA9IE1vZGVsLnVwZGF0ZTtcbiAgTW9kZWwudXBkYXRlID0gTW9kZWwudXBkYXRlQWxsID0gZnVuY3Rpb24gdXBkYXRlRGVsZXRlZCh3aGVyZSA9IHt9LCAuLi5yZXN0KSB7XG4gICAgLy8gQmVjYXVzZSB1cGRhdGUvdXBkYXRlQWxsIG9ubHkgcmVjZWl2ZXMgYSAnd2hlcmUnLCB0aGVyZSdzIG5vd2hlcmUgdG8gYXNrIGZvciB0aGUgZGVsZXRlZCBlbnRpdGllcy5cbiAgICBjb25zdCB3aGVyZU5vdERlbGV0ZWQgPSB7IGFuZDogWyB3aGVyZSwgcXVlcnlOb25EZWxldGVkIF0gfTtcbiAgICByZXR1cm4gX3VwZGF0ZS5jYWxsKE1vZGVsLCB3aGVyZU5vdERlbGV0ZWQsIC4uLnJlc3QpO1xuICB9O1xufTtcblxuIl19
