module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        concat: {
            vendor: {
                src: [
                    "javascripts/libs/jquery/jquery.1.7.1.js",
                    "javascripts/libs/jquery/jquery.dateFormat-1.0.js",
                    "javascripts/libs/jquery/jquery-ui.js",
                    "javascripts/libs/underscore/underscore-1.3.1.js",
                    "javascripts/libs/backbone/backbone-0.9.2.js",
                    "javascripts/libs/google/canvg.js",
                    "javascripts/libs/google/rgbcolor.js",
                    "javascripts/jquery-cycle-all.js"
                ],
                dest: 'dist/third-party.js',
                separator: ';'
            },

            canvas: {
                src: [
                    "javascripts/models/GalleryList.js",
                    "javascripts/models/GalleryModel.js",
                    "javascripts/models/GalleryEntry.js",
                    "javascripts/models/GalleryImage.js",
                    "javascripts/processor/ImageProcessor.js",
                    "javascripts/views/GalleryPreviewView.js",
                    "javascripts/views/GalleryListItemView.js",
                    "javascripts/views/GalleryListView.js",
                    "javascripts/views/GalleryEditView.js",
                    "javascripts/views/GalleryEntryView.js",
                    "javascripts/views/GalleryViewer.js",
                    "javascripts/container.js",
                    "javascripts/controllers/GalleryController.js",
                    "javascripts/controllers/GalleryListController.js",
                    "javascripts/router.js",
                    "javascripts/app.js",
                    "javascripts/persistence.js",
                    "javascripts/main.js",
                    "javascripts/view-manager.js",
                    "javascripts/index.js"
                ],
                dest: 'dist/canvas.js',
                separator: ';'
            },

            create: {
                src: [
                    "javascripts/models/GalleryList.js",
                    "javascripts/models/GalleryModel.js",
                    "javascripts/models/GalleryEntry.js",
                    "javascripts/models/GalleryImage.js",
                    "javascripts/processor/ImageProcessor.js",
                    "javascripts/views/GalleryPreviewView.js",
                    "javascripts/views/GalleryListItemView.js",
                    "javascripts/views/GalleryListView.js",
                    "javascripts/views/GalleryEditView.js",
                    "javascripts/views/GalleryEntryView.js",
                    "javascripts/views/GalleryViewer.js",
                    "javascripts/container.js",
                    "javascripts/controllers/GalleryController.js",
                    "javascripts/controllers/GalleryListController.js",
                    "javascripts/view-manager.js",
                    "javascripts/router.js",
                    "javascripts/app.js",
                    "javascripts/persistence.js",
                    "javascripts/create.js",
                    "javascripts/main.js"
                ],
                dest: 'dist/create.js',
                separator: ';'
            },

            viewer: {
                src: [
                    "javascripts/models/GalleryList.js",
                    "javascripts/models/GalleryModel.js",
                    "javascripts/models/GalleryEntry.js",
                    "javascripts/models/GalleryImage.js",
                    "javascripts/processor/ImageProcessor.js",
                    "javascripts/views/GalleryPreviewView.js",
                    "javascripts/views/GalleryListItemView.js",
                    "javascripts/views/GalleryListView.js",
                    "javascripts/views/GalleryEditView.js",
                    "javascripts/views/GalleryEntryView.js",
                    "javascripts/views/GalleryViewer.js",
                    "javascripts/container.js",
                    "javascripts/controllers/GalleryController.js",
                    "javascripts/controllers/GalleryListController.js",
                    "javascripts/router.js",
                    "javascripts/app.js",
                    "javascripts/persistence.js",
                    "javascripts/viewer.js",
                    "javascripts/main.js",
                    "javascripts/view-manager.js"
                ],
                dest: 'dist/viewer.js',
                separator: ';'
            },

            insert: {
                src: [

                    "javascripts/models/GalleryList.js",
                    "javascripts/models/GalleryModel.js",
                    "javascripts/models/GalleryEntry.js",
                    "javascripts/models/GalleryImage.js",
                    "javascripts/processor/ImageProcessor.js",
                    "javascripts/views/GalleryPreviewView.js",
                    "javascripts/views/GalleryListItemView.js",
                    "javascripts/views/GalleryListView.js",
                    "javascripts/views/GalleryEditView.js",
                    "javascripts/views/GalleryEntryView.js",
                    "javascripts/views/GalleryViewer.js",
                    "javascripts/container.js",
                    "javascripts/controllers/GalleryController.js",
                    "javascripts/controllers/GalleryListController.js",
                    "javascripts/router.js",
                    "javascripts/app.js",
                    "javascripts/persistence.js",
                    "javascripts/main.js",
                    "javascripts/view-manager.js",
                    "javascripts/insert.js"
                ],
                dest: 'dist/insert.js',
                separator: ';'
            }
        },

        min: {
            vendor: {
                src: ['dist/third-party.js'],
                dest: 'dist/third-party.min.js'
            },
            canvas: {
                src: ['dist/canvas.js'],
                dest: 'dist/canvas.min.js'
            },
            create: {
                src: ['dist/create.js'],
                dest: 'dist/create.min.js'
            },
            viewer: {
                src: ['dist/viewer.js'],
                dest: 'dist/viewer.min.js'
            },
            insert: {
                src: ['dist/insert.js'],
                dest: 'dist/insert.min.js'
            }
        }
    });
};
