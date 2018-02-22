// TODO: local storage feature testing requires mocking

var timetable = require('../js/timetable');
var assert    = require('assert');
describe('Tools', function () {
    describe('pad', function () {
        it('should left pad an empty string to 0', function () {
            assert.equal('0', timetable._.Tools.pad('', 1, 0));
        });
        it('should left pad 9 to 00009', function () {
            assert.equal('00009', timetable._.Tools.pad(9, 5, 0));
        });
    });
    describe('hourify', function () {
        it('should convert 11.5 to 1130', function () {
            assert.equal('1130', timetable._.Tools.hourify(11.5));
        })
    });
    describe('size', function () {
        it('should return 3 given the array', function () {
            assert.equal(3, timetable._.Tools.size([1, 2, 3]));
        });
        it('should return 4 given the object', function () {
            assert.equal(4, timetable._.Tools.size({1: 1, 2: 2, 3: 3, 4: 4}));
        })
    });
});