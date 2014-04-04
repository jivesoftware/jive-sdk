window.GalleryEntry = Backbone.Model.extend({
    initialize: function() {
    },

    fetch:function() {
        // override fetch to delegate to submodels for thumb and full source
        this.fetchThumb();
        this.fetchSource();
    },

    fetchThumb: function( callback ) {
        var imageId = this.get("id");
        var creatorId = this.get('userid');
        var thumb = new GalleryImage({id:"thumb_"+ imageId, userid: creatorId });
        var self = this;

        thumb.bind("parsed", function( thumbImage ) {
            self.trigger("fetchedThumbnail", thumbImage );
            if ( callback ) {
                callback( thumbImage );
            }
        });

        thumb.fetch();
    },

    fetchSource: function(callback) {
        var imageId = this.get("id");
        var creatorId = this.get('userid');
        var full = new GalleryImage({id:"image_"+ imageId, userid: creatorId });
        var self = this;

        full.bind("parsed", function( fullImage ) {
            self.trigger("fetchedFullSource", fullImage );
            if ( callback ) {
                callback( fullImage );
            }
        });

        full.fetch();
    },

    save: function( data, callback ) {
        // cascading save (thumbnail first, full image next)
        var thumb = new GalleryImage();
        thumb.set( {
            "id" :  "thumb_" + data.imageId,
            "src": data.previewSrc,
            "width": data.width,
            "height": data.height
        } );

        var onThumbSave = function () {
            var fullImage = new GalleryImage();
            fullImage.set( {
                "id" :  "image_" + data.imageId,
                "src": data.fullSrc,
                "width": data.width,
                "height": data.height
            } );

            fullImage.bind("saved", function() {
                callback( data.imageId );
            });

            fullImage.save();
        };

        thumb.bind("saved", onThumbSave );
        thumb.save();

    },

    destroy: function( data, callback ) {

        // cascading save (thumbnail first, full image next)

        var thumb = new GalleryImage();
        thumb.set( {
            "id" :  "thumb_" + data.imageId,
            "src": data.previewSrc,
            "width": data.width,
            "height": data.height
        } );

        var fullImage = new GalleryImage();
        fullImage.set( {
            "id" :  "image_" + data.imageId,
            "src": data.fullSrc,
            "width": data.width,
            "height": data.height
        } );

        var onThumbDestroy = function () {
            fullImage.destroy();
        };

        thumb.bind("destroy", onThumbDestroy );
        fullImage.bind("saved", function() {
            callback( data.imageId );
        });

        thumb.destroy();

    }
});