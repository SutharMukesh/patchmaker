# Patch Maker

This project is build to **automate** the manual process of creating patches (old-new folders) for ***microservices*** which are maintained on **git**.
The Patch Maker creates the patch folder, by looking at file differences between two recent **tags**.
Tags must be created whenever you are ready to send a patch.

## How to use this tool

1. Copy *patchmaker* folder outside the project you want to make a patch for.
2. Open cmd and go inside *patchmaker* folder.
3. Type `node index.js -p yourprojectname`
4. You'll see a folder created **inside your project folder**
