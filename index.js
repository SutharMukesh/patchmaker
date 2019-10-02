var fs = require("fs");
var path = require("path");
var shell = require("shelljs");
var program = require('commander');
program
    .option('-p, --projectName <type>', 'folder name of your project')
    .parse(process.argv);
// let projectName: string = "gitSampleProjectForPatchCreator";
if (program.projectName) {
    var repoPath = path.join(__dirname, "../" + program.projectName);
    if (fs.existsSync(repoPath)) {
        createPatchFor(repoPath);
    }
    else {
        shell.echo("No project found at: " + repoPath).exit(1);
    }
}
else {
    shell.echo("No project folder name provided, specify using -p option");
    shell.exit(1);
}
if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}
function moveFiles(newFiles, status) {
    newFiles.forEach(function (file) {
        if (file) {
            // if any folder found then create folder in new 
            if (path.dirname(file) != ".") {
                shell.mkdir('-p', "patch/" + status + "/" + path.dirname(file));
            }
            console.log("Copying file from " + file + " patch/" + status + "/" + file);
            shell.exec("cp " + file + " patch/" + status + "/" + file);
        }
    });
}
function createPatchFor(repoPath) {
    // go to project directory
    shell.cd(repoPath);
    // get old patch tag
    var tags = shell.exec("git tag", { silent: true }).stdout.split("\n");
    console.log(tags);
    // find file list diff in the old to new patch.
    var newFiles = shell.exec("git diff --name-only " + tags[0], { silent: true }).stdout.split("\n");
    console.log("Files found in latest patch are:  " + newFiles);
    shell.mkdir('-p', ['patch/new/', 'patch/old']);
    // move these files to new folder inside patch
    moveFiles(newFiles, "new");
    // git checkout to old patch tag
    console.log("preparing revert old patch -- git checkout " + tags[0]);
    shell.exec("git checkout " + tags[0]);
    // move these same file to old folder inside patch
    moveFiles(newFiles, "new");
    console.log("git checkout " + tags[1]);
    shell.exec("git checkout " + tags[1]);
}
