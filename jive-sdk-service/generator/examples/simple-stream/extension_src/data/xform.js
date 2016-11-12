function transform(body, headers, options, callback)   {

/*
 * TO DO: Parse 'body' arg based on incoming event from 3rd party system.
 * TO DO: Replace the sample code below with your own transformation code.
 */

// Build activity object.
var activityInfo = { actor: {}, object:{}, jive:{} };

// Optional name of actor for this activity. Remove if n/a.
// activityInfo.actor.name = "Jane Doe";

// Optional email of actor for activity. Remove if n/a.
// activityInfo.actor.email = "janedoe@example.com";

// Optional URL for this activity. Remove if n/a.
activityInfo.object.url = "https://developer.jivesoftware.com";

// Required URL to the image for this activity.
activityInfo.object.image = "https://developer.jivesoftware.com/DeveloperAssets/images/icons/jivedev-med.png";

// Required title of the activity.
activityInfo.object.title = body.title;

// Optional HTML description of activity. Remove if n/a.
activityInfo.object.description = body.description;

// Optional ... Removes the Go To Item Link in the Activity Stream Link (User will use the tile)
//activityInfo.object.hideGoToItem = true;
  
activityInfo.jive.app = {  
  'appUUID': "{{{GENERATED_APP_UUID}}}",  
  'view': "ext-object",  
  'context': {  
    'timestamp': new Date().toISOString(),  
    'body': body,  
    'headers': headers,  
    'options': options
  }  
}  

/*
 * Call the callback function with our transformed activity information
 */

callback({ "activity" : activityInfo });

}
