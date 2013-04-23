# Jive Purposeful Places Framework
 Purposeful Places are a brand new integration framework for Jive that allows you to quickly and easily external activity streams and content from virtually any system. You can get [a high level overview of Purposeful Places in the Jive Community](./docs/overview.md). 

 This repository contains the node.js library to help you get started building purposeful places!

#Let's get started
Make sure you have [node.js](http://nodejs.org) installed. We're going to assume that you are at least a bit familiar with node.js and that you understand the basics, e.g. installing packages. We're also going to assume that you understand the basics of Purposeful Places and are familiar with the concepts of tiles and stream integrations.

The steps below will generate out a sample application that you can use as the building block for your integrations. Before you run this make sure to change to an empty directory. 

**Step 1. Install the jive-sdk**

`npm install jive-sdk -g`

**Step 2. Create an example**

`jive-sdk create --type=tile --style=table --name=MyFirstTile`

**Step 3. Install the node dependencies**

`npm install`

**Step 4. Make it your own**

The generated example needs to be configured with your own information, specifically, your credentials, and where you want the server to start. The configuration is in a very simple json file named jiveclientconfiguration.json. Here's what gets generated out of the box.

`{ "clientUrl": "http://localhost",
    "port": "8090",
    "clientId": "!!!_CHANGE_ME_DO_NOT_START_SERVER_WITH_OUT_A_REAL_ONE_FROM_JIVE!!!",
    "clientSecret": "!!!_CHANGE_ME_DO_NOT_START_SERVER_WITH_OUT_A_REAL_ONE_FROM_JIVE!!!"}`

What you should do is fill in the proper values for your server & port. The clientId and clientSecret are the credentials that you received when you registered with Jive as developer. (Note: We'll cover how to register with Jive later.)

Step 5. Run the puppy!

`node jive_app.js`

That's it! You have just created your first tile! If you'd like to see the tile definition, then you can enter the following URL in your browser. Of course, the server and port should match what you put in the configuration file.

`http://<servername><port>/tiles`




## License 

   Copyright 2013 Jive Software

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.