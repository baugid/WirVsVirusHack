const fs = require('fs')
const chai = require('chai')
const expect = chai.expect
const assert = chai.assert
const request = require('request')
const Datastore = require('nedb')
const rimraf = require("rimraf");


rimraf.sync('userfiles')
const server = require('../app').server // for istanbul to work properly
expect(fs.existsSync('userfiles')).to.be.true

const database = new Datastore("data.db")
const URL = 'http://localhost:3000/'

describe("Api calls", () => {
    describe("Form Api", () => {
        it("adds Entry", (done) => {
            request.post(URL + 'submitForm', {
                json: {
                    content: "Some data"
                }
            }, (error, response, body) => {
                const json = response.toJSON().body
                database.findOne({ _id: json.id }, (err, data) => {
                    if (err)
                        assert.fail(err)
                    expect(data.content).to.equal("Some data")
                    done()
                })
                database.loadDatabase()
            })
        })

        it("only accepts json", done => {
            request.post(URL + 'submitForm', {
                body: "Hello"
            }, (error, response, body) => {
                expect(response.statusCode).to.equal(400)
                expect(body).to.equal("json expected.")
                done()
            })
        })

        it("blocks malicious form data", done => {
            request.post(URL + 'submitForm', {
                json: { _id: 123 }
            }, (error, response, body) => {
                expect(response.statusCode).to.equal(400)
                expect(body).to.equal("Illegal identifier _id")
                done()
            })
        })

        it("finds database entry", done => {
            request.post(URL + 'submitForm', { json: { tag: "Hullu" } }, (err, resp, body) => { //Write to db
                request.post(URL + 'readForm', { json: { id: resp.toJSON().body.id } }, (err, response, body) => { //request result
                    expect(response.toJSON().body.tag).to.equal("Hullu")
                    done()
                })
            })
        })

        it("blocks non json read requests", done => {
            request.post(URL + 'readForm', { body: "Text" }, (err, response, body) => {
                expect(body).to.equal("Invalid request.")
                expect(response.statusCode).to.equal(400)
                done()
            })
        })

        it("ignores reads without id", done => {
            request.post(URL + 'readForm', { json: { tag: "Text" } }, (err, response, body) => {
                expect(body).to.equal("Invalid request.")
                expect(response.statusCode).to.equal(400)
                done()
            })
        })

        it("reports reads of invalid ids", done => {
            request.post(URL + 'readForm', { json: { id: 42 } }, (err, response, body) => {
                expect(response.statusCode).to.equal(404)
                expect(body).to.equal("Id doesn't exist.")
                done()
            })
        })

        it("doesn't leak internal ids", done => {
            request.post(URL + 'submitForm', { json: { tag: "Hullu" } }, (err, resp, body) => { //Write to db
                request.post(URL + 'readForm', { json: { id: resp.toJSON().body.id } }, (err, response, body) => { //request result
                    expect(response.toJSON().body._id).to.be.undefined
                    done()
                })
            })
        })
    })

})

describe("File Api", () => {
    it("accepts files", done => {
        const req = request.post(URL + 'submitFile', (err, response, body) => {
            const res = JSON.parse(body)
            expect(res.type).to.equal('image/png')
            expect(
                fs.readFileSync('userfiles/' + res.fileID).equals(fs.readFileSync('public/img/profile.png')
                )).to.be.true
            done()
        });
        var form = req.form();
        form.append('file', fs.createReadStream('public/img/profile.png'))
    })

    it("ignores empty requests", done => {
        request.post(URL + 'submitFile', (err, response, body) => {
            expect(response.statusCode).to.equal(400)
            expect(response.body).to.equal("No files were sent.")
            done()
        })
    })

    it("blocks invalid filetypes", done => {
        const req = request.post(URL + 'submitFile', (err, response, body) => {
            expect(response.statusCode).to.equal(400)
            expect(body).to.equal("Illegal filetype.")
            done()
        });
        var form = req.form();
        form.append('file', fs.createReadStream('package.json'))
    })
})

after(() => {
    server.close()
})