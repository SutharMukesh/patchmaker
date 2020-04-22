const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const prompts = require("prompts");

function moveFiles(newFiles: string[], status: string) {
    shell.mkdir('-p', `patch/${status}/`)
    newFiles.forEach((file: string) => {
        if (file) {
            // if any folder found then create folder in new 
            if (path.dirname(file) != ".") {
                shell.mkdir('-p', `patch/${status}/${path.dirname(file)}`);
            }
            console.log(`Copying file from ${file} --> patch/${status}/${file}`)
            shell.cp(`${file}`, `patch/${status}/${file}`)
        }
    });
}


function getDiffFiles(targetbranch: string) {
    const filelist: Array<any> = shell.exec(`git diff --submodule=diff ${targetbranch}`, { silent: true }).grep(/(diff|file)/g).split("diff --git ").filter(Boolean).map((file: String) => { return { name: file.split(' ')[0].split('a/')[1], mode: file.split('\n')[1].split(' ')[0] } })
    return filelist.map((file: any) => {
        console.log(`${file.mode} : ${file.name}`)
        return (file.mode != "deleted") ? file.name : '';
    }).filter(Boolean)
}

async function createPatch() {

    const branchlist = shell.exec(`git branch --format='%(refname:short)'`, { silent: true }).replace(/(\n)+/g, ' ').replace(/'/g, '').split(' ').filter(Boolean);
    
    const sourcebranch = await prompts({
        type: "select",
        name: "value",
        message: `Select Source branch (New Patch branch)`,
        choices: branchlist.map((branchname: String) => { return { title: branchname, value: branchname } })
    });

    const targetbranch = await prompts({
        type: "select",
        name: "value",
        message: `Select target branch (Old Patch branch)`,
        choices: branchlist.map((branchname: String) => { return { title: branchname, value: branchname } })
    });

    const confirmation = await prompts({
        type: 'toggle',
        name: 'value',
        message: `Create Patch for --> ${sourcebranch.value}[New] with ${targetbranch.value}[Old]?`,
        initial: true,
        active: 'yes',
        inactive: 'no'
    })
    if (!confirmation.value) shell.exit(1)

    // Checkout source branch
    console.log(`git checkout ${sourcebranch.value}`)
    shell.exec(`git checkout ${sourcebranch.value}`)
    shell.exec(`git submodule update --recursive`);

    // find file list diff in the old to new patch.
    // let newFiles: string[] = shell.exec(`git diff --submodule=diff ${targetbranch.value} |grep diff | awk '{print $3}'|awk '{split($0, a, "a/"); print a[2]}'`, { silent: true }).stdout.split("\n");
    // const newfiles: string[] = shell.exec(`git diff --submodule=diff ${targetbranch.value}`, { silent: true }).grep('diff').stdout.split('\n').filter(Boolean).map((file: String) => file.split(' ')[2].split('a/')[1])

    const newfiles = getDiffFiles(targetbranch.value)
    if (!newfiles.length) throw new Error(`No new files found to create patch`);
    console.log(`Files found in latest patch are:  ${newfiles}`)

    // delete patch folder if found  
    if (fs.existsSync('patch')) {
        console.log(`cleaning up patch folder before getting started.`);
        shell.rm('-r', `patch`);
    }

    // move these files to new folder inside patch
    moveFiles(newfiles, "new");

    // git checkout to old patch tag
    console.log(`preparing revert old patch -- git checkout ${targetbranch.value}`);
    shell.exec(`git checkout ${targetbranch.value}`);
    shell.exec(`git submodule update --recursive`);

    // const oldfiles: string[] = shell.exec(`git diff --submodule=diff ${currentbranch}`, { silent: true }).grep(/(diff|file)/g).split("diff").filter(Boolean).map((file: String) => { return { name: file.split(' ')[2].split('a/')[1], mode: file.split('\n')[1].split(' ')[0] } })
    // const oldfiles: string[] = shell.exec(`git diff --submodule=diff ${currentbranch} |grep diff | awk '{print $3}'|awk '{split($0, a, "a/"); print a[2]}'`, { silent: true }).stdout.split("\n");
    const oldfiles: string[] = getDiffFiles(sourcebranch.value)
    if (!oldfiles.length) console.warn(`No files found in old revision, assuming all files are NEW in this patch.`);
    else {
        console.log(`Files found in old patch are:  ${oldfiles}`)
        // move these same file to old folder inside patch
        
    }
    moveFiles(oldfiles, "old")
}


(async () => {
    let currentbranch = null;
    try {
        if (!shell.which('git')) {
            shell.echo('Sorry, this script requires git');
            shell.exit(1);
        }

        const projectpath = await prompts({
            type: "text",
            name: "value",
            message: `Specify path of the Project.`,
            validate: (value: String) => fs.existsSync(value) ? true : `Path doesn't exists!`
        });
        // const projectpath = { value: 'C:/Users/mukes/Desktop/mfxapi.war' }

        // go to project directory
        shell.cd(projectpath.value);
        // get current branch name 
        currentbranch = shell.exec(`git symbolic-ref -q HEAD --short`, { silent: true });
        console.log(`Current Branch: ${currentbranch}`)

        await createPatch();

        console.log(`git checkout ${currentbranch}`)
        shell.exec(`git checkout ${currentbranch}`)
        shell.exec(`git submodule update --recursive`);
    } catch (error) {
        console.error(error);
        console.log(`Fallout: checkout to ${currentbranch} branch`)
        shell.exec(`git checkout ${currentbranch}`)
        shell.exec(`git submodule update --recursive`);
        console.log(`exiting...`)
        process.exit(1)
    }
})();
