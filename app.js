//author: Gideon Baur
const express = require('express')
const fileUpload = require('express-fileupload')
const Server = require('./src/Server')

//constants
const PORT = 3000

//setup server
const handler = new Server()
const app = express()
app.use(express.static('public'))
app.use("/getFile", express.static("userfiles"))
app.use(fileUpload())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
exports.server = app.listen(PORT) //enables testing code to close the server

//read form information
app.post('/readForm', handler.readForm.bind(handler))

//submit file
app.post('/submitFile', handler.submitFile.bind(handler))

//stores the form in the database
app.post('/submitForm', handler.writeForm.bind(handler))