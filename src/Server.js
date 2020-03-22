const Datastore = require('nedb')
const uniqueSlug = require('unique-slug')
const fs = require('fs')

//constants
const allowedFileTypes = new Map([['image/png', '.png'], ['application/pdf', '.pdf'], ['image/bmp', '.bmp'], ['image/jpeg', '.jpg']])

function generateFilename(extension) {
    let filename = ''
    do {
        filename = uniqueSlug() + extension
    } while (fs.existsSync('userfiles/' + filename))

    return filename
}

module.exports = class Server {
    constructor() {
        //setup database
        this.database = new Datastore("data.db")
        this.database.loadDatabase()
        
        //ensure userfiles directory exists
        if (!fs.existsSync('userfiles'))
            fs.mkdirSync('userfiles');
    }

    readForm(request, response) {
        if (!request.is('json') || !request.body.id)
            return response.status(400).send("Invalid request.")

        this.database.findOne({ _id: request.body.id }, (err, data) => {
            if (err || !data) {
                console.log(err)
                return response.status(404).send("Id doesn't exist.")
            }
            //rename id
            data.id = data._id
            delete data._id
            return response.json(data)
        })
    }

    writeForm(request, response) {
        if (!request.is('json'))
            return response.status(400).send("json expected.")

        if (request.body._id)
            return response.status(400).send("Illegal identifier _id")

        this.database.insert(request.body, (err, data) => {
            if (err) {
                console.log(err)
                return response.status(500).send("Unable to store data.")
            }
            return response.json({ id: data._id })
        })
    }

    submitFile(request, response) {
        if (!request.files || Object.keys(request.files).length === 0)
            return response.status(400).send('No files were sent.')

        const f = request.files.file
        const filetype = f.mimetype

        if (allowedFileTypes.has(filetype)) {
            const filename = generateFilename(allowedFileTypes.get(filetype))
            //try to copy file
            try {
                f.mv('userfiles/' + filename)
                return response.json({ fileID: filename, type: filetype })
            } catch (error) {
                console.log(error)
                return response.status(500).send("Can't store file.")
            }
        }
        return response.status(400).send('Illegal filetype.')
    }
}