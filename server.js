const express = require('express')
const bodyparser = require('body-parser')
const { v4: uuidv4 } = require('uuid')
const app = express()
const port = 3000

app.use(bodyparser.json());

let apiInstance = null;
exports.start = () => {
    apiInstance = app.listen(port, () => {
        console.log(`[API]: Example app listening at http://localhost:${port}`)
    })
}

exports.stop = () => {
    apiInstance.close();
    console.log("[API]: Api closed");
}