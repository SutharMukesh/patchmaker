const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const program = require('commander');

if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}

program
    .option('-p, --projectName <type>', 'folder name of your project')
    .parse(process.argv);

// let projectName: string = "gitSampleProjectForPatchCreator";
if (program.projectName) {
    let repoPath: string = path.join(__dirname, `../${program.projectName}`);
    if (fs.existsSync(repoPath)) {
        createPatchFor(repoPath);
    } else {
        shell.echo(`No project found at: ${repoPath}`);
        shell.exit(1);
    }
} else {
    shell.echo(`No project folder name provided, specify using -p option`);
    shell.exit(1);
}

function moveFiles(newFiles: string[], status: string) {
    shell.mkdir('-p', `patch/${status}/`)
    newFiles.forEach((file: string) => {
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

function createPatchFor(repoPath: string) {
    // go to project directory
    shell.cd(repoPath);

    // get old patch tag
    let tags: string[] = shell.exec("git tag", { silent: true }).stdout.split("\n")
    tags = tags.filter(file => { if (file) return file }).reverse();
    console.log(tags)

    // find file list diff in the old to new patch.
    let newFiles: string[] = shell.exec(`git diff --name-only ${tags[1]}`, { silent: true }).stdout.split("\n");
    console.log(`Files found in latest patch are:  ${newFiles}`)

    // delete patch folder if found 
    if (fs.existsSync('patch')) {
        console.log(`cleaning up patch folder before getting started.`);
        shell.exec(`rm -r patch`);
    }

    // move these files to new folder inside patch
    moveFiles(newFiles, "new");

    // git checkout to old patch tag
    console.log(`preparing revert old patch -- git checkout ${tags[1]}`);
    shell.exec(`git checkout ${tags[1]}`);

    // move these same file to old folder inside patch
    moveFiles(newFiles, "old")
    console.log(`git checkout ${tags[0]}`)
    shell.exec(`git checkout ${tags[0]}`)
}

