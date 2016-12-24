/*
    TODO: Code to kill app - process.exit();
*/

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
    ".mp3", ".wav", ".m4a", ".ogg", ".aac", ".wma"
];

// Array of queued files
var queue = [];

// Current folder
var currentFolder = "/";



/**
 * Create a non breaking space
 */
function nbsp(x) {
    var times = x || 1;
    var returns = "";
    for (var x = 0; x < times; x++)
        returns += String.fromCharCode(0xA0);
    return returns;
}



/**
 * Load folder into an observable array to be rendered
 */
function loadFolder(folderPath) {
    var returns = new ObservableArray([]); // array of files and folders
    var dir = fs.Folder.fromPath(folderPath); // path to dir to be loaded
    var dirs = [];
    var files = [];

    currentFolder = folderPath; // update current folder variable

    if (folderPath != "/") // render back button if not in root
        returns.push({
            icon: String.fromCharCode(0xf190)+nbsp(2),
            name: "Zpět",
            path: dir.parent.path,
            type: "back"
        });

    dir.eachEntity(function (entity) { // for each item in dir...
        if(fs.File.exists(fs.path.join(folderPath, entity.name)) && !fs.Folder.exists(fs.path.join(folderPath, entity.name))) { // file
            if (allowedFiles.indexOf(entity.extension) >= 0) { // show only allowed files
                var iconCode = 0xf096; // empty checkbox

                if (queue.indexOf(fs.path.join(folderPath, entity.name)) >= 0) // item is in queue - checked checkbox
                    iconCode = 0xf046;

                files.push({
                    icon: String.fromCharCode(iconCode)+nbsp(2),
                    name: entity.name,
                    path: fs.path.join(folderPath, entity.name),
                    type: "file"
                });
            }
        } else // dir
            dirs.push({
                icon: String.fromCharCode(0xf07b)+nbsp(2), // directory icon
                name: entity.name,
                path: fs.path.join(folderPath, entity.name),
                type: "folder"
            });
    });

    dirs.sort(sortArray); // sort arrays alphabetically
    files.sort(sortArray);

    for (var dirName in dirs) // insert arrays into object
        returns.push(dirs[dirName]);

    for (var fileName in files)
        returns.push(files[fileName]);

    if (returns.length <= 1) // no item found
        returns.push({
            icon: String.fromCharCode(0xf129)+nbsp(2),
            name: "Prázdno :(",
            path: false,
            type: "nothing"
        });

    return returns;
}



/**
 * Update bottom banner with number of songs in the queue
 */
function updateBanner(viewModel) {
    var qLength = queue.length;
    var qNumberBanner;
    if (qLength == 0)
        qNumberBanner = "0 písní";
    else if (qLength == 1)
        qNumberBanner = "1 píseň";
    else if (qLength < 5)
        qNumberBanner = qLength+" písně";
    else
        qNumberBanner = qLength+" písní";

    viewModel.set("qLengthBanner", "Ve frontě: "+qNumberBanner);
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

    updateBanner(viewModel);



    /**
     * Item was tapped
     */
    viewModel.onTap = function(e) {
        var item = viewModel.groceryList.getItem(e.index);
        var path = item.path;

        if (path) {
            // Folder - rerender view
            if (item.type == "folder" || item.type == "back")
                return this.set("groceryList", loadFolder(path));

            // Not a file
            if (item.type != "file")
                return false;

            // File
            if (queue.indexOf(path) >= 0) // already in queue - remove
                queue.splice(queue.indexOf(path), 1);
            else // not in queue - add
                queue.push(path);

            updateBanner(this);

            this.set("groceryList", loadFolder(currentFolder)); // rerender view (because of checkboxes)
            /*
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
            });*/
        }
    }



    /**
     * Back arrow was tapped
     */
    viewModel.goBack = function() {
        if (currentFolder == "/") { // user is in root folder - navigate to previous page
            var topmost = frameModule.topmost();
            topmost.navigate("main-page");
        } else // user is not in root folder - navigate up in directory tree
            viewModel.set("groceryList", loadFolder(fs.Folder.fromPath(currentFolder).parent.path));

    }



    /**
     * Tick was tapped
     */
    viewModel.okay = function() {
        if (!queue.length) {
            var toast = Toast.makeText("Nejprve vyberte nějaké písničky :)");
            return toast.show();
        }

        var topmost = frameModule.topmost();
        topmost.navigate({
            moduleName:'player',
            context:{
                queue: queue
            }
        });
    }

    // Navigate to default path or to root folder
    if (fs.Folder.exists(defaultPath))
        viewModel.groceryList = loadFolder(defaultPath);
    else
        viewModel.groceryList = loadFolder("/");

    return viewModel;
}

exports.createViewModel = createViewModel;
