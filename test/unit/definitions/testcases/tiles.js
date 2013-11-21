var assert = require('assert');

var sampleDefinition = {
    "displayName": "JIRA Filter Results",
    "name": "filterresults",
    "description": "Shows the issues/results for a saved filter.",
    "style": "LIST",
    "icons": {
        "16": "http://jira-pp.appfusions.com/images/jira16.png",
        "48": "http://jira-pp.appfusions.com/images/jira48.png",
        "128": "http://jira-pp.appfusions.com/images/jira128.png"
    },
    "action": "/filterresults/action",
    "definitionDirName": "filterresults"
};

var createExampleDefinition = function() {
    return JSON.parse( JSON.stringify(sampleDefinition) );
};

describe('jive', function () {
    describe('#tiles.definitions', function () {

        it('save new', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            var definition = createExampleDefinition();
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

        it('save update', function (done) {
            var jive = this['jive'];

            // setup memory persistence
            jive.context['persistence'] = new jive.persistence.memory();

            var definition = createExampleDefinition();
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

    });

});