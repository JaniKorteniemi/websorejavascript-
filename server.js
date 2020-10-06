const express = require('express');
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
//const users = require('./services/users');
const port = 3000

app.use(bodyparser.json());

////////User authentication
const passport = require('passport');
const { Passport } = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
    function(username, password, done) {
  
        const user = users.find(u => u.username == username);
        if(user == undefined) {
            // Username not found
            console.log("HTTP Basic username not found" );
            return done(null, false);
        }
  
        /* Verify password match */
        if(bcrypt.compareSync(password, user.password) == false) {
            // Password does not match
            console.log("HTTP Basic password not matching username");
            return done(null, false);
        }
        console.log(username);
        validateApiKey(username)
        return done(null, username);
    }
));
///////ApiKey validation
function validateApiKey (username) {
    let apikey = null;
    console.log(username);
    const user = users.find(u => u.username == username);
    if(user === undefined){
        apikey = false
    }else {
        apikey = user.apikey;
    }
    if(apikey === false) // user not found
    {
        //res.sendStatus(400);
        console.log("HTTP Basic ApiKey not found");
    }
    if(apikey === null)
    {
        if(user === undefined)
        {
            return false
        }else{
            user.apikey = uuidv4();
            apikey = user.apikey;
        }
        
        console.log("HTTP Basic ApiKey is null");
    }
    console.log(apikey)
    return apikey
}
///////ApiKey Check
function checkForApiKey(req, res, next)
{
  const receivedKey = req.get('apikey');
  if(receivedKey === undefined) {
    return res.status(400).json({ reason: "X-Api-Key header missing"});
  }

  const user = users.find(u => u.apikey == receivedKey);
  if(user === undefined) {
    return res.status(400).json({ reason: "Incorrect api key"});
  }

  req.user = user;

  // pass the control to the next handler in line
  next();
}
///////Get all users Testing
app.get('/user', (req, res) => {
    res.json({users})
})
///////User regisration
app.post('/register', (req, res) => {

    if('username' in req.body == false) {
        res.status(400);
        res.json({status: "Missing username"});
        return;
    }
    if('email' in req.body == false) {
        res.status(400);
        res.json({status: "Missing email"});
        return;
    }
    if('password' in req.body == false) {
        res.status(400);
        res.json({status: "Missing password"});
        return;
    }

    const hashedPasswoed = bcrypt.hashSync(req.body.password, 6);
    console.log("HASH: " + String(hashedPasswoed));
    users.addUser(req.body.username, req.body.email, hashedPasswoed)

    console.log(req.body);

    res.sendStatus(200)
})
///////Login
app.get('/login', passport.authenticate('basic', { session: false }), (req, res) => {
    res.sendStatus(200).json({status: "OK"});
});
///////ApiKey Testing
app.get('/apiKeyTest', checkForApiKey, (req, res) => {
    res.json({
      yourResource: "ApiOK"
    })
});
//////////////

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

let users = [
    {
        id: "7cc13e6b-f207-4800-b383-1381ffb8f352",
        username: "Jukka Koskela",
        email: "jukka.koskela@email.com",
        password: "$2b$06$RSB1neU6yL1i4sxFRv1AOO0o.M6an4asYS3iPglWeoGe.EZlO5Nta", //jukkis1234
        apikey: null
    },
    {
        id: "55eaec5b-d638-48ad-a679-2ccd3ee8f1e0",
        username: "Esko Ravonsuo",
        email: "e.ravonsuo@email.com",
        password: "$2b$06$2sFvJIiEh/prhBXCbQDeRurvb6blx4yK2N8O4do6zUxiG/cLDABuC", //S4l4s4n4
        apikey: null
    },
    {
        id: "70d3ffc4-1916-4a46-85b9-274c7d4c7141",
        username: "Matias Myllymäki",
        email: "masamylly@email.com",
        password: "$2b$06$dyA81DlVmyY1ACpN7gHbFO306FD9r2V.wxhZV9HoCr/OZI7DOuv8C", //password
        apikey: null
    }
];