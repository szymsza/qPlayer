var types_1 = require('utils/types');
var file_system_1 = require('file-system');
var utils = require('utils/utils');
var TNSPlayer = (function (_super) {
    __extends(TNSPlayer, _super);
    function TNSPlayer() {
        _super.apply(this, arguments);
    }
    TNSPlayer.prototype.playFromFile = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var audioPath = void 0;
                var fileName = types_1.isString(options.audioFile) ? options.audioFile.trim() : "";
                if (fileName.indexOf("~/") === 0) {
                    fileName = file_system_1.path.join(file_system_1.knownFolders.currentApp().path, fileName.replace("~/", ""));
                }
                _this._completeCallback = options.completeCallback;
                _this._errorCallback = options.errorCallback;
                _this._infoCallback = options.infoCallback;
                _this._player = AVAudioPlayer.alloc().initWithContentsOfURLError(NSURL.fileURLWithPath(fileName));
                _this._player.delegate = _this;
                if (options.loop) {
                    _this._player.numberOfLoops = -1;
                }
                _this._player.play();
                resolve();
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback();
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.playFromUrl = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var sharedSession = utils.ios.getter(NSURLSession, NSURLSession.sharedSession);
                _this._task = sharedSession.dataTaskWithURLCompletionHandler(NSURL.URLWithString(options.audioFile), function (data, response, error) {
                    if (error !== null) {
                        if (_this._errorCallback) {
                            _this._errorCallback();
                        }
                        reject();
                    }
                    _this._completeCallback = options.completeCallback;
                    _this._errorCallback = options.errorCallback;
                    _this._infoCallback = options.infoCallback;
                    _this._player = AVAudioPlayer.alloc().initWithDataError(data, null);
                    _this._player.delegate = _this;
                    _this._player.numberOfLoops = options.loop ? -1 : 0;
                    _this._player.play();
                    resolve();
                });
                _this._task.resume();
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback();
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player && _this._player.playing) {
                    _this._player.pause();
                    resolve(true);
                }
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback();
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.play = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (!_this.isAudioPlaying()) {
                    _this._player.play();
                    resolve(true);
                }
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback();
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.resume = function () {
        this._player.play();
    };
    TNSPlayer.prototype.seekTo = function (time) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player) {
                    _this._player.currentTime = time;
                    resolve(true);
                }
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.dispose = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this._player && _this.isAudioPlaying()) {
                    _this._player.stop();
                }
                _this.reset();
                resolve();
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback();
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.isAudioPlaying = function () {
        return this._player ? this._player.playing : false;
    };
    TNSPlayer.prototype.getAudioTrackDuration = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var duration = _this._player ? _this._player.duration : 0;
                resolve(duration.toString());
            }
            catch (ex) {
                if (_this._errorCallback) {
                    _this._errorCallback();
                }
                reject(ex);
            }
        });
    };
    TNSPlayer.prototype.audioPlayerDidFinishPlayingSuccessfully = function (player, flag) {
        if (flag && this._completeCallback) {
            this._completeCallback();
        }
        else if (!flag && this._errorCallback) {
            this._errorCallback();
        }
        this.reset();
    };
    TNSPlayer.prototype.reset = function () {
        if (this._player) {
            this._player.release();
            this._player = undefined;
        }
        if (this._task) {
            this._task.cancel();
            this._task = undefined;
        }
    };
    TNSPlayer.ObjCProtocols = [AVAudioPlayerDelegate];
    return TNSPlayer;
}(NSObject));
exports.TNSPlayer = TNSPlayer;
//# sourceMappingURL=player.js.map