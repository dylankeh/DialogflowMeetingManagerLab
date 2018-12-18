
# Dialogflow Meeting Room Manager Lab

## Setup Instructions
### Dialogflow, Fulfillment and Firebase Setup

1. To create this agent from importing .zip file:
	Import Dialogflow intents using 'MeetingRoomManagement.zip' file.
2. Using the same account as Dialogflow to create a real time database on Firebase console. 
3. Copy the Fulfillment code from "index.js" file in "firebaseFulfillment" folder and paste into Dialogflow Fulfillment Inline Editor, then deploy.


## Running the sample
1. In Dialogflow's console, in the simulator on the right, query your Dialogflow agent with greetings and respond to the questions your Dialogflow agent asks. You will be directed into one of the four sections based on what your intent is: book meeting, modify meeting infomation, cancel meeting, and check meeting schedule. 
2. You can log on Firebase console to see the changes after your intent is realized by Chatbot.
3. You can connect Dialogflow with Slack platform. Please follow this link to set up: https://dialogflow.com/docs/integrations/slack. 
