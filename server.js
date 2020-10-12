const express = require('express');
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const http = require('http')
const url = require('url')

const fs = require('fs');
const multer  = require('multer');
const multerUpload = multer({ dest: 'uploads/' });
const router = express.Router();

const app = express();
app.use('/',router);
//const users = require('./services/users');
const port = 3000

app.use(bodyparser.json());

////////User authentication
const passport = require('passport');
const { Passport } = require('passport');
const { query, response } = require('express');
const { json } = require('body-parser');
const { Console } = require('console');
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
        
        let apikey = validateApiKey(username)
        console.log("Apikey " + apikey + " send to user "  + username);
        return done(null, {username: username, apikey: apikey });
    }
));


///////ApiKey validation
function validateApiKey (username) {
    let apikey = null;
    const user = users.find(u => u.username == username);
    if(user === undefined){
        apikey = false
    }else {
        apikey = user.apikey;
    }
    if(apikey === false) // user not found
    {
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
        console.log("Generating ApiKey...");
    }

    return apikey
}


///////ApiKey Check
function checkForApiKey(req, res, next)
{
  const receivedKey = req.get('apikey');
  if(receivedKey === undefined) {
    return res.status(401).json({Unauthorized: "Missing Api Key"});
  }

  const user = users.find(u => u.apikey == receivedKey);
  if(user === undefined) {
    return res.status(400).json({ BadRequest: "Incorrect Api Key"});
  }

  req.user = user;

  // pass the control to the next handler in line
  next();
}

///////ApiKey Testing
app.get('/apikeytest', checkForApiKey, (req, res) => {
    res.status(200).json({ApiKeyTest: "ApiKey OK"})
});


///////Get all users Testing
app.get('/user', (req, res) => {
    res.json({users})
})


///////User regisration
app.post('/register', (req, res) => {

    if('username' in req.body == false) {
        res.status(400);
        res.json({BadRequest: "Missing username"});
        return;
    }
    if('email' in req.body == false) {
        res.status(400);
        res.json({BadRequest: "Missing email"});
        return;
    }
    if('password' in req.body == false) {
        res.status(400);
        res.json({BadRequest: "Missing password"});
        return;
    }

    const hashedPasswoed = bcrypt.hashSync(req.body.password, 6);
    users.push({
        id: uuidv4(),
        username: req.body.username,
        email: req.body.email,
        password: hashedPasswoed,
        apikey: null
    });
    //console.log(req.body);
    res.status(201).json({Created: "User successfully created"});
})


///////Login
app.get('/login', passport.authenticate('basic', { session: false }), (req, res) => {
    
    res.json({apikey: req.user.apikey});
});


//Frontpage
app.get('/', (req, res) => {
    res.send("Webstore API")
})

// Get items
app.get('/items', (req, res) => {
    res.json({result: items})
})


//Get images from req (return array of image-paths)
function img(req){
    var array = []
    try{
        //console.log(req.files);
        req.files.forEach(f => {
            fs.renameSync(f.path, './uploads/' + f.originalname);
            array.push('./uploads/' + f.originalname);
        })
    }catch{
        //console.log("No Images");
    }
    //put image phat as null
    for (i = array.length; i < 4; i++){
        array[i] = null;
    }
    return array
}

//Check new item for missing properties
const validateEmpty = (req, res, next) => {
    const result = req.body
    for(key in req.body){
        if(req.body[key] === "" || req.body[key] === undefined || req.body[key] === null){
            return res.status(400).json({ BadRequest: "Missing properties"})
        }
    }
    next();
}

// List new item (without authorization check)
app.post('/items', checkForApiKey, multerUpload.array('img', 4), validateEmpty, (req, res) => {
    var imgArray = img(req);
    
    const newItem = {
        id: uuidv4(),
        title:  req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: {
            image1: imgArray[0],
            image2: imgArray[1],
            image3: imgArray[2],
            image4: imgArray[3]
        },
        price: req.body.price,
        postDate: req.body.postDate,
        deliverType: req.body.deliverType,
        contactInfo: req.body.contactInfo
    }
    items.push(newItem)
    res.status(201).json({Created: "Item successfully created"})
})


// Modify item
app.put('/items/:id', checkForApiKey, multerUpload.array('img', 4),  (req, res) => {
    const result = items.find(t => t.id == req.params.id)
    if(result !== undefined) {
        for(const key in req.body) {
            result[key] = req.body[key]
        }
        var imgCount = 0
        var imgArray = img(req);
        for(const img in result["images"]){
            result["images"][img] = imgArray[imgCount]
            imgCount += 1
        }
        res.status(200).json({Modify: "Changes saved"})
    } else {
        res.status(404).json({NotFound: "No item with this id"})
    }
    
})


// Delete item
app.delete('/items/:id', checkForApiKey, (req, res) => {
    const result = items.findIndex(t => t.id == req.params.id)
    if(result !== -1) {
        items.splice(result, 1)
        res.status(200).json({Deleted: "Item has been deleted"})
    } else {
        res.status(404).json({NotFound: "No item with this id"})
    }
})


// Search items
app.get('/items/search', (req, res) => {
    var qs = url.parse(req.url, true).query
    var search_items = []

    for(const param in qs) {
        if(search_items.length === 0) {
            search_items = items.filter(item => item[param] === qs[param])
        } else {
            search_items = search_items.filter(item => item[param] === qs[param])
        }
    }

    if(search_items.length > 0) {
        res.status(200).json({results: search_items})
    } else {
        res.status(404).json({NotFound: "No item with this id"})
    }
})


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
        apikey: "28003bf1-d64e-4bce-800a-19d76c96ea4e"
    },
    {
        id: "70d3ffc4-1916-4a46-85b9-274c7d4c7141",
        username: "Matias Myllymäki",
        email: "masamylly@email.com",
        password: "$2b$06$dyA81DlVmyY1ACpN7gHbFO306FD9r2V.wxhZV9HoCr/OZI7DOuv8C", //password
        apikey: null
    }
];


let items = [
    {
        id: "testid",
        title: "Test title",
        description: "Test description",
        category: "test category",
        location: "test location",
        images: {
            image1: "Phat/test",
            image2: null,
            image3: null,
            image4: null
        },
        price: 100.00,
        postDate: "2020-10-07",
        deliverType: true,
        contactInfo: "test@test.com"
    },
    {
        id: uuidv4(),
        title: "Kuukupööpötin",
        description: "Ihan ite nikkaroin",
        category: "Koriste-esineet",
        location: "Helsinki",
        images: {
            image1: null,
            image2: null,
            image3: null,
            image4: null
        },
        price: 100.00,
        postDate: "2020-10-07",
        deliverType: true,
        contactInfo: "test@test.com"
    },
    {
        id: uuidv4(),
        title: "Faro Lena table lamp",
        description: "A modern design luminaire that is suitable for both interior and reading lighting.",
        category: "Koriste-esineet",
        location: "Tampere",
        images: {
            image1: null,
            image2: null,
            image3: null,
            image4: null
        },
        price: 20.00,
        postDate: "2020-10-07",
        deliverType: false,
        contactInfo: "test@test.com"
    },
    {
        id: uuidv4(),
        title: "Antenna connector",
        description: "The connectors in the picture are 1 eur full satsi",
        category: "Electronics",
        location: "Oulu",
        images: {
            image1: null,
            image2: null,
            image3: null,
            image4: null
        },
        price: 1.00,
        postDate: "2020-10-07",
        deliverType: true,
        contactInfo: "test@test.com"
    },
    {
        id: uuidv4(),
        title: "Puuhöylä",
        description: "Ei ollu puuhöylä",
        category: "Työkalut",
        location: "Helsinki",
        images: {
            image1: null,
            image2: null,
            image3: null,
            image4: null
        },
        price: 145.00,
        postDate: "2020-10-08",
        deliverType: true,
        contactInfo: "t8hosa01@students.oamk.fi"
    }
]

