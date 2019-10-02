const path = require("path");
const shell = require("shelljs");
let repoPath = path.join(__dirname, "../gitSampleProjectForPatchCreator");

if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}

function moveFiles(newFiles, status) {
    newFiles.forEach(file => {
        if (file) {
            // if any folder found then create folder in new 
            if (path.dirname(file) != ".") {
                shell.mkdir('-p', `patch/${status}/${path.dirname(file)}`);
            }
            console.log(`Copying file from ${file} patch/${status}/${file}`)
            shell.exec(`cp ${file} patch/${status}/${file}`)
        }
    });
}

// go to project directory
shell.cd(repoPath);
// get old patch tag
let tags = shell.exec("git tag", { silent: true }).stdout.split("\n")
console.log(tags)
// find file list diff in the old to new patch.
let newFiles = shell.exec(`git diff --name-only ${tags[0]}`, { silent: true }).stdout.split("\n");
console.log(`Files found in latest patch are:  ${newFiles}`)
shell.mkdir('-p', ['patch/new/', 'patch/old'])
// move these files to new folder inside patch
moveFiles(newFiles, "new")
// git checkout to old patch tag
console.log("preparing revert old patch")
console.log(`git checkout ${tags[0]}`)
shell.exec(`git checkout ${tags[0]}`)
// move these same file to old folder inside patch
moveFiles(newFiles, "new")
console.log(`git checkout ${tags[1]}`)
shell.exec(`git checkout ${tags[1]}`)