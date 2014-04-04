window.GalleryList = Backbone.Model.extend({
    defaults: {
        galleryIDs: []
    },
    useAppData : true,

    appDataKey: function() {
        return "gallery_list";
    },

    appDataFields:function () {
        return ["gallery_list"];
    },

    initialize: function() {
    },

    creatorId: function() {
        return this.get('userid');
    },

    parse:function(content) {
        //there should be only one user
        for (var userId in content) {

            //there should be only one data
            for (var dataId in content[userId]) {
                if (dataId && dataId.indexOf('gallery_list') == 0) {
                    var content = JSON.parse(content[userId][dataId]);
                    this.set('galleryIDs', content.galleryIDs);
                }
            }
        }

        //// ????
        for(var i in content) {
            this.set(i, content[i]);
        }

        this.trigger("parsed", this.get("galleryIDs") );
    },

    add: function( galleryID ) {
        var ids = this.get("galleryIDs");
        console.log("current", ids);
        if ( $.inArray(galleryID, ids) < 0 ) {
            ids.push( galleryID );
        }
        console.log("after", ids);
    },

    subtract: function( galleryID ) {
        var ids = this.get("galleryIDs");
        ids.splice(ids.indexOf(galleryID), 1);
    },

    titleExists: function( title ) {
        var ids = this.get("galleryIDs");
        $.each(ids, function () {
            var galleryID = this;
            var gallery = new GalleryModel({id:galleryID});
            gallery.bind('parsed', function (gallery) {
                // todo check if given title matches gallery title
            });
            gallery.fetch();
        });

        // todo wait for all parsed event handlers to complete and then return true/false
    }

});
