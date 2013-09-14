function ViewManager() {
    return {

        showView:function (view) {

            if (!this.currentView || view != this.currentView) {

                if (this.currentView)
                    this.currentView.close();

                this.currentView = view;
                // console.log("view", view.el );
                $("#main-content").html(this.currentView.el);
            }

        }

    };
}