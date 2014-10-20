/* https://community.jivesoftware.com/docs/DOC-129789 */

jive.tile.onOpen(function(context) {
  if (typeof context === "string" ) {
    context = JSON.parse(context);
  }
  if (typeof context === "string" ) {
    context = JSON.parse(context);
  }
  var messageTemplate =
    "Response performance was " + context.responseTime +
    ", meaning it was " + context.label + ".";
  $('#template_content').html(messageTemplate);
  
  gadgets.window.adjustHeight();

  $('#btn_cancel').click(function() {
    jive.tile.close();
  });

  var submitButton = $('#btn_submit').click(function() {
    var customMessage = $('#custom_message').val() || "";
    submitButton.parent().html("creating discussion ...");
    jive.tile.getContainer(function(container) {
      var containerRef = container.resources.self.ref;
      var discussion = {
        "content": {
          "type": "text/html",
          "text": "<body><p>" + messageTemplate + "</p><p>" + customMessage + "</p>"
        },
        "subject": "Discuss Performance '" + context.label + "', " + context.responseTime,
        "visibility": "place",
        "parent": containerRef
      }
      /* https://developers.jivesoftware.com/api/v3/cloud/js/discussions.html */
      /* http://opensocial-resources.googlecode.com/svn/spec/1.0/Core-Gadget.xml#osapi.Request */
      var request = osapi.jive.corev3.discussions.create(discussion);
      /* http://json-rpc.org/wiki/specification */
      request.execute(function(response) {
        if (response.error) {
          alert(JSON.stringify(response.error));
          return;
        }
        jive.tile.close();
      });
    });
  });
});
