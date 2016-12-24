var Observable = require("data/observable").Observable;
var frameModule = require("ui/frame");
var ObservableArray = require("data/observable-array").ObservableArray;
var fs = require("file-system");
var TNSPlayer = require('nativescript-audio').TNSPlayer;
var player = new TNSPlayer();
var Toast = require("nativescript-toast");
require( "nativescript-master-technology" );

/* SETTINGS */
var defaultPath = "/storage/sdcard1/Hudba/Písně/";
var allowedFiles = [
    "mp3", "wav", "m4a", "ogg", "aac", "wma"
];

function nbsp(x) {
    var times = x || 1;
    var returns = "";
    for (var x = 0; x < times; x++)
        returns += String.fromCharCode(0xA0);
    return returns;
}

function loadFolder(folderPath) {
    var returns = new ObservableArray([]); // array of files and folders
    var dir = fs.Folder.fromPath(folderPath); // path to dir to be loaded
    var dirs = [];
    var files = [];

    if (folderPath != "/") // back button
        returns.push({
            name: String.fromCharCode(0xf190)+nbsp(2)+"Zpět",
            path: dir.parent.path,
            type: "back"
        });

    dir.eachEntity(function (entity) { // for each item in dir...
        if(fs.File.exists(fs.path.join(folderPath, entity.name)) && !fs.Folder.exists(fs.path.join(folderPath, entity.name))) { // file
            var extension = entity.name.split(".");
            extension = extension[extension.length - 1].toLowerCase();
            if (allowedFiles.indexOf(extension) >= 0) // allow only allowed files
                files.push({
                    name: String.fromCharCode(0xf016)+nbsp(2)+entity.name, // file icon + name
                    path: fs.path.join(folderPath, entity.name),
                    type: "file"
                });
        } else // dir
            dirs.push({
                name: String.fromCharCode(0xf07b)+nbsp(2)+entity.name, // dir icon + name
                path: fs.path.join(folderPath, entity.name),
                type: "folder"
            });
    });

    dirs.sort(sortArray); // sort arrays alphabetically
    files.sort(sortArray);

    for (var dirName in dirs) { // insert arrays into object
        returns.push(dirs[dirName]);
    }

    for (var fileName in files) {
        returns.push(files[fileName]);
    }

    if (returns.length <= 1)
        returns.push({
            name: String.fromCharCode(0xf129)+nbsp(2)+"Prázdno :(",
            path: false,
            type: "nothing"
        });

    return returns;
}

function sortArray(a, b) {
    var nameA=a.name.toLowerCase(),
        nameB=b.name.toLowerCase()
    if (nameA < nameB) //sort string ascending
        return -1
    if (nameA > nameB)
        return 1
    return 0 //default return value (no sorting)
}

function createViewModel() {
    var viewModel = new Observable();

    viewModel.onTap = function(e) {
        var item = viewModel.groceryList.getItem(e.index);
        var path = item.path;

        if (path) {
            if (item.type == "folder" || item.type == "back")
                return this.set("groceryList", loadFolder(path));

            if (item.type != "file")
                return false;


            var toast = Toast.makeText("Spouštím píseň :)");
            toast.show();
            // TODO: tady místo hraní uložit a hodit toast Přidáno do fronty
            player.playFromFile({
                audioFile: path,
                loop: false,
                completeCallback: function() {
                    var toast2 = Toast.makeText("Konec písně :)");
                    toast2.show();
                    // process.exit()
                },
                errorCallback: function() {
                    var toast2 = Toast.makeText("Něco se posralo :(");
                    toast2.show();
                }
            });

            setTimeout(function() {
                player.getAudioTrackDuration().then(function(e) {
                    var seconds = Math.floor((e/1000)-2);
                    var toast = Toast.makeText("Budu hrát ještě "+seconds+" sekund :)");
                    toast.show();
                });
            }, 2000);
        }
    }

    viewModel.goBack = function() {

        /*
        // TODO: tady přejít na přehrávač
        var topmost = frameModule.topmost();
        topmost.navigate("main-page");*/
        process.exit()

    }

    viewModel.okay = function() {
        player.pause();
        var toast2 = Toast.makeText("Stopnuto :)");
        toast2.show();
    }

    if (fs.Folder.exists(defaultPath))
        viewModel.groceryList = loadFolder(defaultPath);
    else
        viewModel.groceryList = loadFolder("/");

    return viewModel;
}

exports.createViewModel = createViewModel;
