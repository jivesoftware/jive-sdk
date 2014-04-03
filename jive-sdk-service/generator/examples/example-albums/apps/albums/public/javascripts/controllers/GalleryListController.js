window.GalleryListController = function(container, viewManager) {

    this.viewManager = viewManager;
    this.container = container;

    this.galleryList = function () {
        var galleryListModel = new GalleryList();
        var galleryListView = new GalleryListView({ container: this.container });

        galleryListModel.bind('parsed', function (galleryIDs) {

            if (!galleryIDs || galleryIDs.length < 1) {
                galleryListView.renderNoGalleries();
            }
            else {
                galleryListView.renderGalleries();

                galleryIDs.reverse();
                $.each(galleryIDs, function () {
                    var galleryID = this;

                    var gallery = new GalleryModel({id:galleryID});
                    gallery.bind('parsed', function (gallery) {
                        galleryListView.renderGallery(gallery);
                    });

                    gallery.fetch();
                });
            }

        });

        galleryListView.render();
        this.viewManager.showView(galleryListView);

        galleryListModel.fetch();
    }
}
