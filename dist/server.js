/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/server.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/server.ts":
/*!***********************!*\
  !*** ./src/server.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const http = __webpack_require__(/*! http */ "http");
const express = __webpack_require__(/*! express */ "express");
const io = __webpack_require__(/*! socket.io */ "socket.io");
const api = __webpack_require__(/*! ./serverAPI */ "./src/serverAPI.ts");
const utils_1 = __webpack_require__(/*! ./utils */ "./src/utils.ts");
const port = 8080;
const app = express();
const httpServer = http.createServer(app);
const socketServer = io(httpServer);
app.use(express.static(__dirname));
httpServer.listen(port, function () {
    console.log(`listening on *:${port}`);
});
socketServer.on('connection', (socket) => {
    utils_1.createProxy(socket, api);
});


/***/ }),

/***/ "./src/serverAPI.ts":
/*!**************************!*\
  !*** ./src/serverAPI.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
let openLobbies = new Map();
let players = new Map();
function joinGame(client, playerName, serverName) {
    let lobby = openLobbies.get(serverName);
    if (!lobby) {
        lobby = {
            name: serverName,
            participants: []
        };
        openLobbies.set(serverName, lobby);
        for (let clientAPI of serversSubscriptions)
            clientAPI.serversChanged(Array.from(openLobbies.values()).map(lobby => lobby.name));
    }
    let player = {
        name: playerName,
        lobby, client
    };
    players.set(client, player);
    lobby.participants.push(player);
    for (let player of lobby.participants)
        player.client.lobbyPlayersChanged(lobby.participants.map(lobbyPlayer => lobbyPlayer.name));
}
exports.joinGame = joinGame;
let serversSubscriptions = new Set();
function subscribeToServers(client) {
    serversSubscriptions.add(client);
    client.serversChanged(Array.from(openLobbies.values()).map(lobby => lobby.name));
}
exports.subscribeToServers = subscribeToServers;
function unsubscribeFromServers(client) {
    serversSubscriptions.delete(client);
}
exports.unsubscribeFromServers = unsubscribeFromServers;
function sendChatMessage(client, message) {
    let player = players.get(client);
    let playerName = player.name;
    let lobby = player.lobby;
    let labeledMessage = `${playerName}: ${message}`;
    for (let lobbyPlayer of lobby.participants) {
        lobbyPlayer.client.chatMessage(labeledMessage);
    }
}
exports.sendChatMessage = sendChatMessage;


/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function spliceArray(dest, offset, data) {
    for (let i = 0; i < data.length; i++) {
        dest[offset + i] = data[i];
    }
}
exports.spliceArray = spliceArray;
function spliceData(array, entityIndex, data) {
    let expectedCount = array.numComponents * 4;
    for (let i = 0; i < expectedCount; i += data.length) {
        spliceArray(array.data, entityIndex * expectedCount + i, data);
    }
}
exports.spliceData = spliceData;
function unreachable(obj) {
    throw new Error(`${obj} should not exist`);
}
exports.unreachable = unreachable;
function invertPromise() {
    let resolve;
    let reject;
    return {
        promise: new Promise((innerResolve, innerReject) => {
            resolve = innerResolve;
            reject = innerReject;
        }),
        resolve,
        reject
    };
}
exports.invertPromise = invertPromise;
function createProxy(socket, localAPI) {
    let currentId = 0;
    let waitingPromises = new Map();
    const proxy = new Proxy({}, {
        get(_, name) {
            console.log("Getting:", name);
            return (...args) => {
                socket.emit("call", currentId, name, args);
                const { promise, resolve, reject } = invertPromise();
                waitingPromises.set(currentId, [resolve, reject]);
                currentId++;
                return promise;
            };
        }
    });
    socket.on("result", (id, error, result) => {
        let [resolve, reject] = waitingPromises.get(id);
        if (error) {
            reject(result);
        }
        else {
            resolve(result);
        }
        waitingPromises.delete(id);
    });
    socket.on("call", (id, name, args) => {
        console.log("Calling:", name);
        try {
            let result = localAPI[name].apply(null, [proxy, ...args]);
            socket.emit("result", id, false, result);
        }
        catch (error) {
            console.log("Error:", error);
            socket.emit("result", id, true, error);
        }
    });
    return proxy;
}
exports.createProxy = createProxy;


/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),

/***/ "socket.io":
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("socket.io");

/***/ })

/******/ });
//# sourceMappingURL=server.js.map