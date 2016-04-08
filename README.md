# kg_plugin
A user script to provide an overview to technical search on Google

## Brief intro:
This is a user script to provide an **overview** to technical search on Google. You can also access to our web application for technology knowledge graph from the direct answer panel.
It is written in Javascript and can run in Tampermonkey (Chrome) and Greasemonkey (Firefox). The overview graph is based on the structured knowledge mined from Stack Overflow. They can assist your technology search by providing an overview of technology landscape. 

## Functions:
* The script can detect technology terms (e.g., github, data visualization, machine learning) in your Google search. If the searched technology is in our structured knowledge base, the script renders a definition of the technology (extracted from Stack Overflow TagWiki) and the asking trend of this term, followed by a graph overview of the related technologies.
* The script also provide an access to our web application (http://graphofknowledge.appspot.com/) that can give you more detailed information about your search technologies (e.g., technology trend, comparison of alternative technologies).
* You can right-click the node for brief definition or double-click for more details.

## Usage:
* Install TamperMonkey (Chrome) or GreaseMonkey (Firefox) in your web browser.
* Add a new script, copy & paste our code into TamperMonkey or GreaseMonky. (If using TamperMonkey, do remember remove the default comments. They are actually configuration settings that must be replaced by our script. Please refer to the following figure.)
![alt tag](https://raw.githubusercontent.com/tomhanlei/kg_plugin/master/download_instruct_2.png)
* Search in Google (e.g., java, machine learning, unit testing, mocking), maybe there will be some suprise. Note that the current version support only search by one technology. Searching by multiple technology (e.g., php unit testing) is under development.

## Tips:
* If you are using this tool for the first time, kindly visit **https://128.199.241.136:9001/kgExtensionRedirect/** before you start, and proceed to the website by ignoring the insecure warning and trust it in advance.
* This plugin fits **1680*1050**(or more) screen best. Please set your browser at lease 1680px wide to have the best using experience.
* If the answer box does not appear after you search for something, please kindly click on the address bar of the browser, and then just press ENTER key on the keyborad. And then it should work correctly.

## Contact:
If you have any problem, do not hesitate to contact me at chen0966|e.ntu.edu.sg. (change "|" to "@").

Thanks and enjoy the journey.
