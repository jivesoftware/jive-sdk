# Jive Purposeful Places Framework
 Purposeful Places are a brand new integration framework for Jive that allows you to quickly and easily create external activity streams and content from virtually any system. Here's [a high level overview of Purposeful Places](https://github.com/jivesoftware/jive-sdk/blob/master/docs/overview.md). If you'd like to skip ahead, then jump right to the [Master Reference Doc](https://github.com/jivesoftware/jive-sdk/blob/master/docs/masterreferencedoc.md). Please make sure to post your feedback and comments in the [Jive Developer Community](https://community.jivesoftware.com/community/developer).

 This repository contains the node.js library to help you get started building purposeful places! Also, make sure to check out the [API documentation](https://rawgithub.com/jivesoftware/jive-sdk/master/docs/api/index.html) as well!

## Let's get started
Make sure you have [node.js](http://nodejs.org) installed. We're going to assume that you are at least a bit familiar with node.js and that you understand the basics, e.g. installing packages. We're also going to assume that you understand the basics of Purposeful Places and are familiar with the concepts of tiles and stream integrations.

The steps below will generate out a sample application that you can use as the building block for your integrations. Before you run this make sure to change to an empty directory. 

**Step 1. Install the jive-sdk**

`npm install jive-sdk -g`

**Step 2. Create an example**

`jive-sdk create table --name=MyFirstTile`

**Step 3. Install the node dependencies**

`npm install`

**Step 4. Make it your own**

The generated example needs to be configured with your own information, specifically, where you want the server to start. The configuration is in a very simple json file named jiveclientconfiguration.json. Here's what gets generated out of the box.

	{ "clientUrl": "http://localhost",
    	"port": "8090"}

What you should do is fill in the proper values for your server & port.

**Step 5. Run the puppy!**

`node app.js`

That's it! You have just created your first tile! If you'd like to see the tile definition, then you can enter the following URL in your browser. Of course, the server and port should match what you put in the configuration file.

`http://<servername><port>/tiles`


## Seeing your tiles in action
Now that your killer integration application is up and running, let's see your tiles in action. 

**Installing your tiles**
Tiles are installed using the new "Add-ons" menu available to admins. Note: If your Jive instance is in "sandbox" mode, then the Add-ons menu is available to everyone.
![Add-ons Menu](https://github.com/jivesoftware/jive-sdk/raw/master/docs/images/add-ons-menu.png)

When you select this menu option, you'll be able to upload a zip file that contains all the information about your extension. The file, extension.zip is automatically created for you by the jive-sdk and is available directly under the root directory of your project. This is the file that you will upload into Jive.


**Add your tiles to a Purposeful Place**
Using your tile in Purposeful Place is easy! All you need to do is create a group that uses a template. When you configure the group, you'll be able to add your tile! 

**Step 1: Create a Group**
For the most part, this is the same as creating a "regular" group in Jive, however, you now have the ability to apply a template.
![Creating a Group](https://github.com/jivesoftware/jive-sdk/raw/master/docs/images/createpurposefulplace.png)

You can choose any of the templates that are shipped with Jive, e.g. "Campaign Planning". Click the "Create" button to go to the next step.

**Step 2: Configure the Purposeful Place
When a new Purposeful Place is created, Jive brings you into the configuration view. Each template comes with a with a set of pre-installed tiles. The first step is to configure these tiles and add any others that you want.
![Configuring the Purposeful Place](https://github.com/jivesoftware/jive-sdk/raw/master/docs/images/configurepurposefulplace.png)


**Step 3: Add your tile**
You can click away from the tile's configuration to be returned to the Purposeful Place. Now, scroll down until you see an option to "Add a Tile". Click on that link to bring up the list of tiles. You can scroll down the list until you find the tile you just created.
![Adding a tile](https://github.com/jivesoftware/jive-sdk/raw/master/docs/images/addingtile.png)

**Step 4: Configure your tile**
You'll want to configure the tile you just added. This is done by clicking on the tile, which will bring up the context menu. Select the "Configure" option. When you do, the dialog box opens that allows you to configure the tile. This is a very straightforward but powerful process. In fact, tile configuration can even handle 3-Legged OAuth!
![Adding a tile](https://github.com/jivesoftware/jive-sdk/raw/master/docs/images/configuretile.png)

**Step 5: You're Done!**
Click "Done" in the top left corner. That's it!! You've now successfully created a tile and added it to a Purposeful Place. For some of the tile types, the jive-sdk will automatically kick off an update process so you will see the changes as soon as they happen! 
![Adding a tile](https://github.com/jivesoftware/jive-sdk/raw/master/docs/images/myfirstpurposefulplace.png)

## Learn More - Do More
We will be adding more capability to the jive-sdk along with a ton of examples to get you started! You should check out the [Master Reference Document](https://github.com/jivesoftware/jive-sdk/blob/master/docs/masterreferencedoc.md) for a complete list of material to get you started. 

**Enjoy!**


# License 

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