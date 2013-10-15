/*	This App provides an App Action with Documents to be able to make a copy of the Document being viewed.
 * 	The Place Picker allows us to determine the target Group for the copy
 */

//var viewer;
var selectedPlace;
var targetDoc;
var documentAction;

gadgets.util.registerOnLoadHandler(init);


function init() {
	copyAction();	//registers our App Action handler

	$("#choose_place").show();
	 $("#createDoc-form").hide();
	 $("#successdiv").hide();
	 $("#chooser").click(selectplace);
	$("#create-doc").click(createDoc);
	$("#closer").click(closeApp);
	
};

 
function createDoc(){
	if (documentAction==true)
	copyDoc();
	else
	osapi.jive.corev3.documents.create({
  type:"document",
  content:
      {
      type: "text/html",
      text: $("#content-field").val()
      },
  subject: $("#title-box").val(),
  parent: selectedPlace.toURI(),
  visibility: "place"
 }).execute(loadDoc);
 
}



function loadDoc(response){
	 $("#createDoc-form").hide();
	 $("#show-doc").html("").html(response.content.text) ;
	 gadgets.window.adjustHeight();
};
  
// Launches Place Picker component  
function selectplace(){
	osapi.jive.corev3.places.requestPicker({
         type : "group",
         success : placeCallback,
         error: placeError
   });
   
function placeCallback(data){
	selectedPlace=data;
		$("#choose_place").hide();
	//	document.getElementById("title-box").value= "Copy of " + targetDoc.subject;
		$("#createDoc-form").show();
	gadgets.window.adjustHeight();
	
};
function placeError(error){
	alert(error.msg);
};
}

function copyDoc(){


		osapi.jive.corev3.documents.create({
  			type:"document",
  			content:
      			{
      				type: "text/html",
      				text: targetDoc.content.text	
      			},
  			subject: $("#title-box").val(),
  			parent: selectedPlace.toURI(),
  			tags: targetDoc.tags,
  			visibility: "place"
 			}).execute(copysuccess);
 		
	
};

function copysuccess(response){
	
	if(response.error){
		alert(response.error.message);
	}else{
		$("#createDoc-form").hide();
		var linkURL=response.resources.html.ref;
		var successString = "<p>Copy Successful!</P>";
		successString += '<a href="'+linkURL+ '">'+ response.subject +'</a>';
		$("#show-success").html("").html(successString );
	 	$("#successdiv").show();
	 	gadgets.window.adjustHeight();
		
	} 
	
}

function closeApp(){
	osapi.jive.core.container.closeApp();	//Just gracefully closes our App Action
}

////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
//documentAction action

function copyAction(){ 
	var action = {
	   id: "com.jivesoftware.education.copyDoc",
	   callback: copyactionCallback						//calls function passing a reference to context
	   };
	   gadgets.actions.updateAction(action);
};
	
 function copyactionCallback(selection){
	// selection type is osapi.jive.core.Document so we need to use entityDescriptor to get a v3 Document
	osapi.jive.corev3.contents.get({entityDescriptor:"102, " + selection.jive.content.id}).execute(function(response){
			targetDoc=response.list[0];
			
			document.getElementById("title-box").value= "Copy of " + targetDoc.subject;
	
	documentAction=true;
	});
}; 


