const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const open = require('open')
const chokidar = require('chokidar')
const fs = require('fs')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

// watches if anything file changes inside the
// src-directory
const watcher = chokidar.watch('./src', {
    ignoreInitial: true
})

// when a file changes, a websocket message is
  // emitted, received by the client browser
io.on('connection', socket => {
    watcher.on('all', () => {
        socket.emit('message', 'reload')
    })
})

// handle all GET requests
app.get('/*', (req, res) => {
    // respond the root-request with the index.html
    if (req.url == '/') {
      fs.readFile('./src/index.html', 'utf8', (err, data) => {
        const dom = new JSDOM(data)
  
        // creating and appending the script-tag, loading Socket.io
        const scriptSocketLink = dom.window.document.createElement('script')
        scriptSocketLink.src = 'https://cdn.socket.io/socket.io-3.0.0.min.js' 
        dom.window.document.head.appendChild(scriptSocketLink)
  
        // creating and appending the script-tag, holding the code
        // for reloading the window when needed through a websocket-message
        const scriptSocketCode = dom.window.document.createElement('script')
        scriptSocketCode.text = `
          const socket = io()
          socket.on('message', (data) => {
            if (data == 'reload') {
              location.reload()
            }
          })
        `
        
        dom.window.document.head.appendChild(scriptSocketCode)
  
        // sending the manipulated and ready DOM to the browser
        res.send(dom.serialize())
      })
      // all the other requests like "app.js" are answered with the matching file in
      // the folder
    } else {
      res.sendFile(__dirname + '/src' + req.url)
    }
  })
  
http.listen(5000)
// opens up a browser window:
open('http://localhost:5000/')