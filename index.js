var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var fs = require("fs");
var path = require("path");
var shell = require("shelljs");
var prompts = require("prompts");
function moveFiles(newFiles, status) {
    shell.mkdir('-p', "patch/" + status + "/");
    newFiles.forEach(function (file) {
        if (file) {
            // if any folder found then create folder in new 
            if (path.dirname(file) != ".") {
                shell.mkdir('-p', "patch/" + status + "/" + path.dirname(file));
            }
            console.log("Copying file from " + file + " --> patch/" + status + "/" + file);
            shell.cp("" + file, "patch/" + status + "/" + file);
        }
    });
}
function getDiffFiles(targetbranch) {
    var filelist = shell.exec("git diff --submodule=diff " + targetbranch, { silent: true }).grep(/(diff|file)/g).split("diff").filter(Boolean).map(function (file) { return { name: file.split(' ')[2].split('a/')[1], mode: file.split('\n')[1].split(' ')[0] }; });
    return filelist.map(function (file) {
        console.log(file.mode + " : " + file.name);
        return (file.mode != "deleted") ? file.name : '';
    }).filter(Boolean);
}
function createPatch() {
    return __awaiter(this, void 0, void 0, function () {
        var branchlist, sourcebranch, targetbranch, confirmation, newfiles, oldfiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    branchlist = shell.exec("git branch --format='%(refname:short)'", { silent: true }).replace(/(\n)+/g, ' ').replace(/'/g, '').split(' ').filter(Boolean);
                    return [4 /*yield*/, prompts({
                            type: "select",
                            name: "value",
                            message: "Select Source branch (New Patch branch)",
                            choices: branchlist.map(function (branchname) { return { title: branchname, value: branchname }; })
                        })];
                case 1:
                    sourcebranch = _a.sent();
                    return [4 /*yield*/, prompts({
                            type: "select",
                            name: "value",
                            message: "Select target branch (Old Patch branch)",
                            choices: branchlist.map(function (branchname) { return { title: branchname, value: branchname }; })
                        })];
                case 2:
                    targetbranch = _a.sent();
                    return [4 /*yield*/, prompts({
                            type: 'toggle',
                            name: 'value',
                            message: "Create Patch for --> " + sourcebranch.value + "[New] with " + targetbranch.value + "[Old]?",
                            initial: true,
                            active: 'yes',
                            inactive: 'no'
                        })];
                case 3:
                    confirmation = _a.sent();
                    if (!confirmation.value)
                        shell.exit(1);
                    // Checkout source branch
                    console.log("git checkout " + sourcebranch.value);
                    shell.exec("git checkout " + sourcebranch.value);
                    shell.exec("git submodule update --recursive");
                    newfiles = getDiffFiles(targetbranch.value);
                    if (!newfiles.length)
                        throw new Error("No new files found to create patch");
                    console.log("Files found in latest patch are:  " + newfiles);
                    // delete patch folder if found  
                    if (fs.existsSync('patch')) {
                        console.log("cleaning up patch folder before getting started.");
                        shell.rm('-r', "patch");
                    }
                    // move these files to new folder inside patch
                    moveFiles(newfiles, "new");
                    // git checkout to old patch tag
                    console.log("preparing revert old patch -- git checkout " + targetbranch.value);
                    shell.exec("git checkout " + targetbranch.value);
                    shell.exec("git submodule update --recursive");
                    oldfiles = getDiffFiles(sourcebranch.value);
                    if (!oldfiles.length)
                        console.warn("No files found in old revision, assuming all files are NEW in this patch.");
                    else {
                        console.log("Files found in old patch are:  " + oldfiles);
                        // move these same file to old folder inside patch
                    }
                    moveFiles(oldfiles, "old");
                    return [2 /*return*/];
            }
        });
    });
}
(function () { return __awaiter(_this, void 0, void 0, function () {
    var currentbranch, projectpath, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                currentbranch = null;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                if (!shell.which('git')) {
                    shell.echo('Sorry, this script requires git');
                    shell.exit(1);
                }
                return [4 /*yield*/, prompts({
                        type: "text",
                        name: "value",
                        message: "Specify path of the Project.",
                        validate: function (value) { return fs.existsSync(value) ? true : "Path doesn't exists!"; }
                    })];
            case 2:
                projectpath = _a.sent();
                // const projectpath = { value: 'C:/Users/mukes/Desktop/microservice' }
                // go to project directory
                shell.cd(projectpath.value);
                // get current branch name 
                currentbranch = shell.exec("git symbolic-ref -q HEAD --short", { silent: true });
                console.log("Current Branch: " + currentbranch);
                return [4 /*yield*/, createPatch()];
            case 3:
                _a.sent();
                console.log("git checkout " + currentbranch);
                shell.exec("git checkout " + currentbranch);
                shell.exec("git submodule update --recursive");
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error(error_1);
                console.log("Fallout: checkout to " + currentbranch + " branch");
                shell.exec("git checkout " + currentbranch);
                shell.exec("git submodule update --recursive");
                console.log("exiting...");
                process.exit(1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); })();
