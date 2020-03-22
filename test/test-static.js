const fs = require('fs')
const expect = require('chai').expect;
const request = require('request');

const URL = 'http://localhost:3000/'
const index = fs.readFileSync('public/index.html').toString()
const jsFile = fs.readFileSync('public/js/qrscanner.js').toString()
fs.copyFileSync('package.json', 'userfiles/test.json')
const userfile = fs.readFileSync('package.json').toString()

describe('Static content delivery', () => {
    it('sends main page', done => {
        request(URL, (error, response, body) => {
            expect(body).to.equal(index);
            done()
        })
    })

    it('sends subfolder content', done => {
        request(URL + 'js/qrscanner.js', (error, response, body) => {
            expect(body).to.equal(jsFile);
            done()
        })
    })

    it('sends user content', done => {
        request(URL + 'getFile/test.json', (error, response, body) => {
            expect(body).to.equal(userfile);
            done()
        })
    })
})


