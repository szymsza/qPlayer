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
var qArray = new ObservableArray([]);



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


function play(id, viewModel) {
    var song = queue[id];

    // Change song icon to play
    queue[id].icon = String.fromCharCode(0xf04b)+nbsp(2);
    qArray.setItem(id, queue[id]);
    viewModel.set("groceryList", qArray);

    player.playFromFile({
        audioFile: song.path,
        loop: false,
        completeCallback: function() {
            var nextSong = id+1;
            if (typeof queue[nextSong] == "undefined") // no song left - exit app
                process.exit()
            else
                play(nextSong, viewModel);

            // Change song icon to tick
            queue[id].icon = String.fromCharCode(0xf00c)+nbsp(2);
            qArray.setItem(id, queue[id]);
            viewModel.set("groceryList", qArray);
        },

        errorCallback: function() {
            var toast2 = Toast.makeText("Chyba během přehrávání písně "+song.name+" :(");
            toast2.show();
        }
    });
}

function createViewModel(q) {
    var viewModel = new Observable();

    for (var id in q) {
        var song = q[id];
        var file = fs.File.fromPath(song);
        var object = {
            name: file.name,
            path: song,
            icon: String.fromCharCode(0xf04c)+nbsp(2) // Pause icon
        };

        qArray.push(object);
        queue.push(object);
    }

    // Start first song
    if (!player.isAudioPlaying()) {
        play(0, viewModel);
        viewModel.set("showIcon", "pause");
    } else
        viewModel.set("showIcon", "play");

    viewModel.set("groceryList", qArray);

    /**
     * pause or play song
     */
    viewModel.pauseplay = function(e) {
        if (player.isAudioPlaying()) { // song is playing - stop and change icon to play
            player.pause();
            viewModel.set("showIcon", "play");
        } else {  // song is not playing - start and change icon to pause
            player.resume();
            viewModel.set("showIcon", "pause");
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
