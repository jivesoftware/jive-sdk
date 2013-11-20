var assert = require('assert');

describe('jive.util', function () {
    before(function (done) {
        done();
    });

    after(function (done) {
        done();
    });

    describe('#guid()', function () {
        it('generates a unique guid', function (done) {
            var jive = this['jive'];
            var guid = jive.util.guid();
            if ( !guid ) {
                assert.fail( guid, '<a guid>');
            }

            var nextGuid = jive.util.guid();
            if ( guid === nextGuid ) {
                assert.fail( nextGuid, '<unique guide>');
            }

            done();
        });

        it('generates a repeating guid', function (done) {
            var jive = this['jive'];
            var guid = jive.util.guid('jive');
            var nextGuid = jive.util.guid('jive');

            if ( guid !== nextGuid ) {
                assert.fail( nextGuid, guid );
            }
            done();
        });
    });

});