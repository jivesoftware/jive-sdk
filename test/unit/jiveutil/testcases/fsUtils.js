var assert = require('assert'),
    testUtils = require(process.cwd() + '/util/testUtils');

describe('jive', function () {

    describe('#util.fsGetSize()', function () {

        it('test with a regular file', function (done) {
            var jive = this['jive'];
            jive.util.fsGetSize(testUtils.getResourceFilePath('loremipsum.txt')).then(
                function ( size ) {
                    assert.equal(size, 15181, 'Wrong size.');
                    done();
                }
            );
        });

        it('test with an 0-bytes file', function (done) {
            var jive = this['jive'];
            jive.util.fsGetSize(testUtils.getResourceFilePath('zero.txt')).then(
                function ( size ) {
                    assert.equal(size, 0, 'Wrong size.');
                    done();
                }
            );
        });

        it('test with a non-existing file', function (done) {
            var jive = this['jive'];
            jive.util.fsGetSize(testUtils.getResourceFilePath('blahblah.txt')).then(
                function () {
                    assert.fail('Expected an error');
                },

                function ( e ) {
                    assert.equal(e.errno, 34, 'Not the expected error.')
                    done();
                }
            );
        });

        it('test with a directory', function (done) {
            var jive = this['jive'];
            jive.util.fsGetSize(testUtils.getResourceFilePath('')).then(
                function ( size ) {
                    assert.equal(size, 4096, 'Wrong size.');
                    done();
                }
            );

        });

    });

    describe('#util.fsexists()', function () {
        it('test with an existing file', function (done) {
            var jive = this['jive'];
            jive.util.fsexists(testUtils.getResourceFilePath('zero.txt')).then(
                function ( exists ) {
                    assert.equal(exists, true, 'Wrong exists value.');
                    done();
                }
            );
        });

        it('test with a non-existing file', function (done) {
            var jive = this['jive'];
            jive.util.fsexists(testUtils.getResourceFilePath('blahblah.txt')).then(
                function ( exists ) {
                    assert.equal(exists, false, 'Wrong exists value.');
                    done();
                }
            );
        });

        it('test with an existing directory', function (done) {
            var jive = this['jive'];
            jive.util.fsexists(testUtils.getResourceFilePath('')).then(
                function ( exists ) {
                    assert.equal(exists, true, 'Wrong exists value.');
                    done();
                }
            );
        });

        it('test with a non-existing directory', function (done) {
            var jive = this['jive'];
            jive.util.fsexists(testUtils.getResourceFilePath('dummy-folder/')).then(
                function ( exists ) {
                    assert.equal(exists, false, 'Wrong exists value.');
                    done();
                }
            );
        });
    });

    describe('#util.fscopy()', function () {

    });

    describe('#util.fsSimpleRename()', function () {

    });

    describe('#util.fsrename()', function () {

    });

    describe('#util.fsmkdir()', function () {

    });

    describe('#util.fsread()', function () {

    });

    describe('#util.fsreadJson()', function () {

    });

    describe('#util.fsreaddir()', function () {

    });

    describe('#util.fsrmdir()', function () {

    });

    describe('#util.fsisdir()', function () {

    });

    describe('#util.fswrite()', function () {

    });

    describe('#util.fsTemplateCopy()', function () {

    });

    describe('#util.fsTemplateWrite()', function () {

    });

    describe('#util.fsTemplateRead()', function () {

    });


});