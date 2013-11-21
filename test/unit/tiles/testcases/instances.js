var assert = require('assert');

describe('jive', function () {
    describe('#tiles.instances', function () {

        it('save', function (done) {
            var jive = this['jive'];
            var testUtils = this['testUtils'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            var instance = testUtils.createExampleInstance();
            instance['id'] = undefined;
            jive.tiles.save(instance).then(
                function(o) {
                    if ( !o ) {
                        assert.fail(o, instance, 'expected saved instance' );
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

            var instance = testUtils.createExampleInstance();
            jive.tiles.save(instance).then( function(saved) {

                var id = instance['id'];
                var newName = jive.util.guid();
                saved['name'] = newName;

                // resave to update
                jive.tiles.save(saved).then( function(updated) {
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

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
                var instance2 = instances[1];

                // by criteria
                return jive.tiles.find( {
                    'name' : instance2['name']
                }).then( function(found) {
                    if ( !found || found.length < 0) {
                        assert.fail();
                    }

                    if ( found.length > 1 ) {
                        assert.fail();
                    }

                    if ( found[0]['name'] !== instance2['name'] ) {
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

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {

                // by criteria
                return jive.tiles.find( {
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

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
                var instance2 = instances[1];

                return jive.tiles.findByID( instance2['id'] )
                    .then(function(found) {
                        if ( !found ) {
                            assert.fail();
                        }

                        if ( found['name'] !== instance2['name'] ) {
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

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {

                // by criteria
                return jive.tiles.findByID(jive.util.guid() ).then(function(found) {
                    if ( found ) {
                        assert.fail();
                    }
                });
            }).finally(function() {
                done();
            });
        });

        it('find by definition name', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
                var instance = instances[1];
                // by criteria
                return jive.tiles.findByDefinitionName(instance['name']).then(function(found) {
                    if ( !found || found.length < 1) {
                        assert.fail();
                    }
                    if ( found.length !== 1 ) {
                        assert.fail();
                    }

                    if ( found[0]['id'] !== instance['id'] ) {
                        assert.fail();
                    }
                });
            }).finally(function() {
                done();
            });
        });

        it('find by scope', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
                var instance2 = instances[1];

                return jive.tiles.findByScope( instance2['scope'] )
                    .then(function(found) {
                        if ( !found ) {
                            assert.fail();
                        }

                        if ( found['scope'] !== instance2['scope'] ) {
                            assert.fail();
                        }
                    });
            }).finally(function() {
                done();
            });
        });

        it('find by guid', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
                var instance2 = instances[1];

                return jive.tiles.findByGuid( instance2['guid'] )
                    .then(function(found) {
                        if ( !found ) {
                            assert.fail();
                        }

                        if ( found['guid'] !== instance2['guid'] ) {
                            assert.fail();
                        }
                    });
            }).finally(function() {
                done();
            });
        });

//        it('find all', function (done) {
//            var jive = this['jive'];
//
//            // setup memory persistence
//            jive.context['persistence'] = new jive.persistence.memory();
//
//            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
//
//                // by criteria
//                return jive.tiles.instances.findAll()
//                    .then( function(found) {
//                        if ( !found || found.length < 1) {
//                            assert.fail();
//                        }
//
//                        if ( found.length != 3 ) {
//                            assert.fail();
//                        }
//
//                        return require('q').resolve();
//                    });
//            }).finally(function() {
//                    done();
//                });
//        });
//
//        it('remove', function (done) {
//            var jive = this['jive'];
//
//            // setup memory persistence
//            jive.context['persistence'] = new jive.persistence.memory();
//
//            this['testUtils'].persistExampleInstances(jive, 3).then( function(instances) {
//
//                var instance = instances[1];
//
//                return jive.tiles.instances.remove(instance['id'])
//                    .then( function(found) {
//                        if ( !found ) {
//                            assert.fail();
//                        }
//
//                        if ( found['id'] !== instance['id'] ) {
//                            assert.fail();
//                        }
//
//                        return require('q').resolve();
//                    });
//            }).finally(function() {
//                    done();
//                });
//        });
//
    });

});