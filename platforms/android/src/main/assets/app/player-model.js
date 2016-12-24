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


// Array of queued files
var queue = [];



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


function play(id) {
    var song = queue[id];
    player.playFromFile({
        audioFile: song.path,
        loop: false,
        completeCallback: function() {
            var nextSong = id+1;
            if (typeof queue[nextSong] == "undefined")
                process.exit()
            else
                play(nextSong);
        },

        errorCallback: function() {
            var toast2 = Toast.makeText("Chyba během přehrávání písně "+song.name+" :(");
            toast2.show();
        }
    });
}

function createViewModel(q) {
    var viewModel = new Observable();

    var qArray = new ObservableArray([]);

    for (var id in q) {
        var song = q[id];
        var file = fs.File.fromPath(song);
        var object = {
            name: file.name,
            path: song
        };

        qArray.push(object);
        queue.push(object);
    }

    play(0);

    viewModel.set("groceryList", qArray);

    /**
     * Item was tapped
     */
    viewModel.onTap = function(e) {
        var item = viewModel.groceryList.getItem(e.index);
        var path = item.path;

        if (path) {
            // Not a file
            if (item.type != "file")
                return false;

            this.set("groceryList", loadFolder(currentFolder)); // rerender view (because of checkboxes)
            /*
            */
        }
    }



    /**
     * Back arrow was tapped
     */
    viewModel.goBack = function() {
        var topmost = frameModule.topmost();
        topmost.navigate("file-picker");
    }

    return viewModel;
}

exports.createViewModel = createViewModel;
