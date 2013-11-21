var assert = require('assert');

describe('jive', function () {
    describe('#tiles.definitions', function () {

        it('save', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            var definition = testUtils.createExampleDefinition();
            definition['id'] = undefined;

            jive.tiles.definitions.save(definition).then(
                function(o) {
                    if ( !o ) {
                        assert.fail(o, definition, 'expected saved definition' );
                    }

                    if ( !o['id'] ) {
                        assert.fail();
                    }

                    done();
                },
                function(e) {
                    assert.fail(e);
                }
            );
        });

        it('update', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            var definition = testUtils.createExampleDefinition();
            jive.tiles.definitions.save(definition).then( function(saved) {

                var id = definition['id'];
                var newName = jive.util.guid();
                saved['name'] = newName;

                // resave to update
                jive.tiles.definitions.save(saved).then( function(updated) {
                    if ( updated['name'] !== newName ) {
                        assert.fail(updated['name'], newName, 'did not expected name change');
                    }

                    if ( updated['id'] !== id ) {
                        assert.fail(updated['id'], newName, 'did not expect id change');
                    }

                    done();
                });

            });
        });

        it('find', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleDefinitions(jive, 3).then( function(definitions) {
                var definition2 = definitions[1];

                // by criteria
                return jive.tiles.definitions.find( {
                    'name' : definition2['name']
                }).then( function(found) {
                    if ( !found || found.length < 0) {
                        assert.fail();
                    }

                    if ( found.length > 1 ) {
                        assert.fail();
                    }

                    if ( found[0]['name'] !== definition2['name'] ) {
                        assert.fail();
                    }

                    return require('q').resolve();
                });
            }).finally(function() {
                done();
            });
        });

        it('find failed', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleDefinitions(jive, 3).then( function(definitions) {

                // by criteria
                return jive.tiles.definitions.find( {
                    'name' : jive.util.guid()
                }).then( function(found) {
                    if ( !found ) {
                        assert.fail();
                    }

                    if ( found.length > 0 ) {
                        assert.fail();
                    }

                    return require('q').resolve();
                });
            }).finally(function() {
                done();
            });
        });

        it('find by ID', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleDefinitions(jive, 3).then( function(definitions) {
                var definition2 = definitions[1];

                return jive.tiles.definitions.findByID( definition2['id'] )
                .then(function(found) {
                    if ( !found ) {
                        assert.fail();
                    }

                    if ( found['name'] !== definition2['name'] ) {
                        assert.fail();
                    }
                });
            }).finally(function() {
                done();
            });
        });

        it('find by ID failed', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleDefinitions(jive, 3).then( function(definitions) {

                // by criteria
                return jive.tiles.definitions.findByID(jive.util.guid() ).then(function(found) {
                    if ( found ) {
                        assert.fail();
                    }
                });
            }).finally(function() {
                done();
            });
        });

        it('find all', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleDefinitions(jive, 3).then( function(definitions) {

                // by criteria
                return jive.tiles.definitions.findAll()
                    .then( function(found) {
                        if ( !found || found.length < 1) {
                            assert.fail();
                        }

                        if ( found.length != 3 ) {
                            assert.fail();
                        }

                        return require('q').resolve();
                    });
            }).finally(function() {
                done();
            });
        });

        it('remove', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleDefinitions(jive, 3).then( function(definitions) {

                var definition = definitions[1];

                return jive.tiles.definitions.remove(definition['id'])
                    .then( function(found) {
                        if ( !found ) {
                            assert.fail();
                        }

                        if ( found['id'] !== definition['id'] ) {
                            assert.fail();
                        }

                        return require('q').resolve();
                    });
            }).finally(function() {
                done();
            });
        });

    });

});