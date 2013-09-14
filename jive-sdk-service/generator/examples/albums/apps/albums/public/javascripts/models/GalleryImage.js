window.GalleryImage = Backbone.Model.extend({
    defaults: {
        width: '',
        height: 0,
        src: '',
        userid: '',
        created: 0
    },
    useAppData : true,

    appDataKey: function() {
        return this.get('id');
    },

    getImageKey: function() {
        return this.get('id');
    },

    appDataFields:function () {
        return [this.get('id')];
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
                if (dataId && dataId.indexOf( this.getImageKey() ) == 0) {
                    var content = JSON.parse(content[userId][dataId]);

                    this.set('id', dataId);
                    this.set('width', content.width);
                    this.set('height', content.height);
                    this.set('src', content.src);
                    this.set('created', content.created);
                    this.set('userid', userId);
                }
            }
        }

        //// ????
        for(var i in content) {
            this.set(i, content[i]);
        }

        this.trigger("parsed", this );
    },

    save: function(key, value, options) {
        if( this.isNew() ) {
            this.set('created', new Date().getTime());
        }
        //super call
        Backbone.Model.prototype.save.call(this, key, value, options);
    },

    destroy: function(key, value, options) {
        Backbone.Model.prototype.destroy.call(this, key, value, options);

    }
});
