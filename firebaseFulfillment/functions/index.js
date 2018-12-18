/*
Author： Qing Ge

*/
'use strict';

//To use firebase Admin API 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');

//This is for using Card and Suggestion Chips response. (not used in this example)
const {Card, Suggestion} = require('dialogflow-fulfillment');

//To store key values from users
var date = 'default';
var time = 'default';
var theme = 'default';
var attender = 'default';
var newDate = 'default';
var newTime = 'default';

//initialize DB connection
const admin = require('firebase-admin');
admin.initializeApp();

// enables lib debugging statements 
process.env.DEBUG = 'dialogflow:debug'; 
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body)); 
  
  function getBookingDateAndTime(agent) {	
    date = agent.parameters.date; 
	time = agent.parameters.time;
	agent.add('Got it. Second, what is the subject of that meeting?' 
		+ 'Type any word you want. (eg: DL Check, Office Lunch, etc)'); 
  }
  
  function getTheme(agent) {	  
	theme = agent.parameters.theme; 
	agent.add('Mmmm, sounds like an interesting one. Third, who will attend this meeting?' 
		+ 'Please state all the names at once.');  
  }
  
  function getAttender(agent) {	  
    attender = agent.parameters.attender; 
    return processBooking(agent);
  }
  
  function processBooking(agent) {	
	var userRef = admin.database().ref(date.substring(0,10)); //access to date directory
	return userRef.child(time.substring(11,16))
	  .once('value')
	  .then(function(snapshot) {		  		
		if(snapshot.exists()){ //to check if time is occupied
			agent.add('Booking failed. That time is already occupied.' 
				+ 'Please input Book Meeting to restart or Check Schedule to see'
				+ 'if a certain time is available.');
		} else{ //add to database
			userRef.child(time.substring(11,16))
			.set({
	          theme: theme,
	          attender: attender	
	        });
			agent.add('You book the meeting successfully!'
				+ 'You can input [Check Schedule] to see your result.');
		}
	});
  }
  
  function getCheckingDate(agent) {	  
	date = agent.parameters.date; 
	return displaySchedule(agent);  
  }
  
  function getCancellingDateAndTime(agent) {	  
	date = agent.parameters.date; 
	time = agent.parameters.time;
	return cancelMeeting(agent);
  }
  
  function displaySchedule(agent){
	var userRef = admin.database().ref(date.substring(0,10)); //date directory
	return userRef
	  .once('value')
	  .then(function(snapshot){
		if(snapshot.exists()){		  
		  snapshot.forEach(function(data){ //diplay each booking using loop;  
			agent.add(data.key + `
			[Theme]: ` + data.child('theme').val() + `
			[Attender]: ` + data.child('attender').val() + `
			`);
		  });
		}else{
		  agent.add('Result: No meeting was scheduled on this date.');
		}	
	});
  }

  function cancelMeeting(agent){
	var userRef = admin.database().ref(date.substring(0,10)); 
	return userRef.child(time.substring(11,16))
	  .once('value')
	  .then(function(snapshot) {      
		if(snapshot.exists()){
			userRef.child(time.substring(11,16))
			.remove();
			agent.add('Cancelled successfully! Your meeting has been removed from schedule.');
		} else{			
			agent.add('Did you remember the wrong time? I cannot find the meeting you want to cancel. '
				+ 'Please input [Cancel Meeting] to redo it or [Check Schedule] '
				+ 'to look for the right time then cancel it.');
		}
	});	  
  }
  
  function getOriginalDateAndTime(agent) {	
    date = agent.parameters.date; 
	time = agent.parameters.time;	
	agent.add('Second, please tell me the new date and time you want to change the meeting to:'); 
  }
  
  function getNewDateAndTime(agent) {	
    newDate = agent.parameters.date; 
	newTime = agent.parameters.time;	
	return processingChange(agent);
  }
  
  function processingChange(agent) {	
    var userRef = admin.database().ref(date.substring(0,10)); //old date directory	
	var userRefNew = admin.database().ref(newDate.substring(0,10)); //new date directory	
	return userRef.child(time.substring(11,16))
	  .once('value')
	  .then(function(snapshot) { 		
		if(snapshot.exists()){	//check if old schedule exists
		
			//first, store old value first if it exists 
			let oldTheme, oldAttender;
			oldTheme = snapshot.val().theme;
			oldAttender = snapshot.val().attender;
						
			//second, add new schedule to database
			return userRefNew.child(newTime.substring(11,16))
			  .once('value')
			  .then(function(snapshot2) {      
				if(snapshot2.exists()){ //check if new time is occupied by other meetings
					agent.add('Change failed. The time is already occupied by other meeting. '
						+ 'Please enter [Change meeting] to redo it.');
				} else{	
					userRefNew.child(newTime.substring(11,16))
					.set({
						theme: oldTheme,
						attender: oldAttender	
					});
					
					//third, if the new schedule is added, remove old schedule from database
					userRef.child(time.substring(11,16)).remove();
					agent.add('Successfully changed! You can enter [Check Schedule] '
						+ 'to see your new schedule.');
				}
			  });	 		
		} else{ // If there's no meeting at that time you want to modify			
			agent.add('I cannot find the meeting you want to change. '
				+ 'You may remember the wrong time. Please enter [Change meeting] to redo it '
				+ 'or [Check meeting] to find the right information.');
		}
	});	 
  }
  
  //to map intents with functions. The function has to return a promise.
  let intentMap = new Map();
  intentMap.set('Start Booking - get date and time', getBookingDateAndTime);
  intentMap.set('Start Booking - get theme', getTheme);
  intentMap.set('Start Booking - get attenders', getAttender);
  intentMap.set('Start Checking - get date', getCheckingDate);
  intentMap.set('Start Cancelling - get date and time', getCancellingDateAndTime);
  intentMap.set('Start Changing - get original date and time', getOriginalDateAndTime);
  intentMap.set('Start Changing - get new date and time', getNewDateAndTime);

  agent.handleRequest(intentMap);
});