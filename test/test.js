const chai = require('chai');
const chaiHttp = require('chai-http');
const { response } = require('express');
chai.use(chaiHttp);
const server = require('../server');
const fs = require('fs');

const expect = chai.expect;
const apiAddress = 'http://localhost:3000'

describe('Mocha Testing implementation', function() {

    before(function() {
        server.start();
    });
    after(function() {
        server.stop();
    });

    var apikey = null;

    //User Testing
    describe('Test USER creation, LOGIN and APIKEY', function() {
        

        //1: CReating user Post /register (3 fails, 1 success)
        describe('USER test (3 fails, 1 success)(Post:/register)', function() {

            //1.1: Fail no username
            describe('trying to CREATE new user WITHOUT USERNAME', function() {
                
                it('Should reponse with status 400 and json ({BadRequest: "Missing username"})', async function() {
                    await chai.request(apiAddress)
                    .post('/register')
                    .send({
                        email: "test@test.com",
                        password: "password"
                    })
                    .then(response => {
                        expect(response.status).to.equal(400);
                        expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });
            
            //1.2: Fail no email
            describe('trying to CREATE new user WITHOUT EMAIL', function() {
                it('Should reponse with status 400 and json ({BadRequest: "Missing email"})', async function() {
                    await chai.request(apiAddress)
                    .post('/register')
                    .send({
                        username: "TestName",
                        password: "password"
                    })
                    .then(response => {
                        expect(response.status).to.equal(400);
                        expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });

            //1.3: Fail no password
            describe('trying to CREATE new user WITHOUT PASSWORD', function() {
                it('Should reponse with status 400 and json ({BadRequest: "Missing password"})', async function() {
                    await chai.request(apiAddress)
                    .post('/register')
                    .send({
                        username: "TestName",
                        email: "test@test.com"
                    })
                    .then(response => {
                        expect(response.status).to.equal(400);
                        expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });

            //1.4: Success
            describe('CREATE new user SUCCESSFULLY', function() {
                it('Should add new user, response with status 201 and json ({Created: "User successfully created"})', async function() {
                    await chai.request(apiAddress)
                    .post('/register')
                    .send({
                        username: "TestName",
                        email: "test@test.com",
                        password: "password"
                    })
                    .then(response => {
                        expect(response.status).to.equal(201);
                        expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });
        });

        //2: User login HTTP basic(username + password)(2 fails, 1 success)
        describe('LOGIN test (2 fails, 1 success)(Get:/login)', function() {

            //2.1: Fail wrong username
            describe('WRONG USERNAME', function() {
                it('Should response with status 401 Unauthorized', async function() {
                    await chai.request(apiAddress)
                    .get('/login')
                    .auth('TestUser', 'password')
                    .then(response => {
                        expect(response.status).to.equal(401);
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });

            //2.2: Fail wrong password
            describe('WRONG PASSWORD', function() {
                it('Should response with status 401 Unauthorized', async function() {
                    await chai.request(apiAddress)
                    .get('/login')
                    .auth('TestName', 'Salasana')
                    .then(response => {
                        expect(response.status).to.equal(401);
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });

            //2.3: Success
            describe('Correct LOGIN', function() {
                it('Should response with a apikey', async function() {
                    await chai.request(apiAddress)
                    .get('/login')
                    .auth('TestName', 'password')
                    .then(response => {
                        expect(response.status).to.equal(200);
                        expect(response.body).to.be.a('Object');
                        apikey = response.body.apikey;
                    })
                    .catch(error => {
                        expect.fail(error)
                    })
                });
            });
        });
    });

    //3: Apikey test (2 fails, 1 success)
    describe('APIKEY test (Get:/apikeyTest)', function() {

        //3.1: Fail no apikey in header
        describe('MISSING Apikey', function() {
            it('Should response with a status 401 and a apikey in json ({Unauthorized: "Missing Api Key"})', async function() {
                await chai.request(apiAddress)
                .get('/apikeyTest')
                .then(response => {
                    expect(response.status).to.equal(401);
                    expect(response.body).to.be.a('Object');
                })
                .catch(error => {
                    expect.fail(error)
                })
            });
        });

        //3.2: Fail wrong apikey in header
        describe('WRONG Apikey', function() {
            it('Should response with a status 400 and a apikey in json ({BadRequest: "Incorrect Api Key"})', async function() {
                await chai.request(apiAddress)
                .get('/apikeyTest')
                .set('apikey', 'test')
                .then(response => {
                    expect(response.status).to.equal(400);
                    expect(response.body).to.be.a('Object');
                })
                .catch(error => {
                    expect.fail(error)
                })
            });
        });

        //3.3: Success
        describe('Correct APIKEY', function() {
            it('Should response with a status 200 and a apikey in json ({ApiKeyTest: "ApiKey OK"})', async function() {
                await chai.request(apiAddress)
                .get('/apikeyTest')
                .set('apikey', apikey)
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a('Object');
                })
                .catch(error => {
                    expect.fail(error)
                })
            });
        });
    });

    //Item testing 
    describe('Test to get, create, modify, delete and search items', function() {

        //1: Get all items test
        describe('GET ALL items', function() {
            it('Should respond with an array of items', async function() {
                await chai.request(apiAddress)
                    .get('/items')
                    .then(response => {
                        expect(response.status).to.equal(200);
                        expect(response.body).to.be.a('object');
                        expect(response.body).to.be.of.property('results');
                        expect(response.body.results).to.be.a('array');
                        expect(response.body.results[0]).to.be.a('object');
                        expect(response.body.results[0]).to.be.of.property('id');
                        expect(response.body.results[0]).to.be.of.property('title');
                        expect(response.body.results[0]).to.be.of.property('description');
                        expect(response.body.results[0]).to.be.of.property('category');
                        expect(response.body.results[0]).to.be.of.property('location');
                        expect(response.body.results[0].images).to.be.a('object');
                        expect(response.body.results[0].images).to.be.of.property('image1');
                        expect(response.body.results[0].images).to.be.of.property('image2');
                        expect(response.body.results[0].images).to.be.of.property('image3');
                        expect(response.body.results[0].images).to.be.of.property('image4');
                        expect(response.body.results[0]).to.be.of.property('price');
                        expect(response.body.results[0]).to.be.of.property('postDate');
                        expect(response.body.results[0]).to.be.of.property('deliverType');
                        expect(response.body.results[0]).to.be.of.property('contactInfo');
                })
                    .catch(error => {
                        expect.fail(error)
                    })
            })
        });

        //2: Adding new items/image test
        describe('ADD a NEW items', function() {

            //2.1: Fail no apikey
            describe('Trying to CREATE new item WITHOUT APIKEY', function() {
                it('Should response with status 401 and json ({Unauthorized: "Missing Api Key"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .then(response => {
                    expect(response.status).to.equal(401);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //2.2: Fail not all properties in request
            describe('Trying to CREATE new item WITHOUT all needed PROPERTIES', function() {
                it('Should response with status 400 and json ({ BadRequest: "Missing properties"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .set('apikey', apikey)
                    .send({
                        title: "",
                        description: "3 year old computer for sale. not working",
                        category: "Electronics",
                        location: "Tampere",
                        price: 100.00,
                        postDate: "2020-11-13",
                        deliverType: true,
                        contactInfo: "test@test.com"
    
                    })
                    .then(response => {
                    expect(response.status).to.equal(400);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });
    
            //2.3: adding new item with images
            describe('CREATE new item with NO IMAGES', function() {
                it('Should add new item, response with status 201 and json ({Created: "Posting successfully created"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .set('apikey', apikey)
                    .send({
                        title: "Semi old computer",
                        description: "3 year old computer for sale. not working",
                        category: "Electronics",
                        location: "Tampere",
                        price: 100.00,
                        postDate: "2020-11-13",
                        deliverType: true,
                        contactInfo: "test@test.com"
    
                    })
                    .then(response => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //2.4: adding new item with one images
            describe('CREATE new item with ONE IMAGE', function() {
                it('Should add new item, response with status 201 and json ({Created: "Posting successfully created"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .set('apikey', apikey)
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test1_1.jpg')
                    .field('title','Microwave')
                    .field('description','Almost new microwave')
                    .field('category','Electronics')
                    .field('location','Oulu')
                    .field('price', 70.00)
                    .field('postDate','2020-05-05')
                    .field('deliverType',true)
                    .field('contactInfo','test@test.com')
                    .then(response => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //2.5: adding new item with two images
            describe('CREATE new item with TWO IMAGES', function() {
                it('Should add new item, response with status 201 and json ({Created: "Posting successfully created"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .set('apikey', apikey)
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test1_2.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test2_2.jpg')
                    .field('title','Circular saw blade')
                    .field('description','blade according to the picture circular diameter 68cm middle hole 40mm')
                    .field('category','Tools')
                    .field('location','Oulu')
                    .field('price', 30.00)
                    .field('postDate','2020-11-13')
                    .field('deliverType',true)
                    .field('contactInfo','test@test.com')
                    .then(response => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //2.6: adding new item with three images
            describe('CREATE new item with THREE IMAGES', function() {
                it('Should add new item, response with status 201 and json ({Created: "Posting successfully created"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .set('apikey', apikey)
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test1_3.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test2_3.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test3_3.jpg')
                    .field('title','Sander')
                    .field('description','Grinding machine for sale. As shown in the pictures')
                    .field('category','Tools')
                    .field('location','Tampere')
                    .field('price',60.00)
                    .field('postDate','2020-05-04')
                    .field('deliverType',true)
                    .field('contactInfo','test@test.com')
                    .then(response => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //2.7: adding new item with four images
            describe('CREATE new item with FOUR IMAGES', function() {
                it('Should add new item, response with status 201 and json ({Created: "Posting successfully created"})', async function() {
                await chai.request(apiAddress)
                    .post('/items')
                    .set('apikey', apikey)
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test1_4.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test2_4.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test3_4.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test4_4.jpg')
                    .field('title','Huawei P20 Pro')
                    .field('description','A smartphone in excellent condition, water and dust resistant')
                    .field('category','Electronics')
                    .field('location','Helsinki')
                    .field('price',50.00)
                    .field('postDate','2020-05-05')
                    .field('deliverType',true)
                    .field('contactInfo','test@test.com')
                    .then(response => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });
        });

        //3: Modify items (1 fail, 1 success)
        describe('Modify item', function() {

            //3.1: Fail no match for id
            describe('Trying to MODIFYING item WITHOUT APIKEY', function() {
                it('Response with status 404 and json ({NotFound: "No posting with this id"})', async function() {
                await chai.request(apiAddress)
                    .put('/items/1111')
                    .set('apikey', apikey)
                    .send({
                        title: "B & O Beoplay H8",
                        description: "For sale beoplay H8 bluetooth anti-noise headphones.",
                        category: "Electronics",
                        location: "Tampere",
                        postDate: "2020-11-13",
                        deliverType: false,
    
                    })
                    .then(response => {
                    expect(response.status).to.equal(404);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //3.2: Fail no match for id
            describe('MODIFYING item with NO ID to MATCH', function() {
                it('Response with status 404 and json ({NotFound: "No posting with this id"})', async function() {
                await chai.request(apiAddress)
                    .put('/items/1111')
                    .set('apikey', apikey)
                    .send({
                        title: "B & O Beoplay H8",
                        description: "For sale beoplay H8 bluetooth anti-noise headphones.",
                        category: "Electronics",
                        location: "Tampere",
                        postDate: "2020-11-13",
                        deliverType: false,
    
                    })
                    .then(response => {
                    expect(response.status).to.equal(404);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            //3.3: Success
            describe('MODIFYING item with id to match', function() {
                it('Should modify item, response with status 200 and json ({Modify: "Changes saved"})', async function() {
                await chai.request(apiAddress)
                    .put('/items/testid')
                    .set('apikey', apikey)
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test1_5.jpg')
                    .attach('img', fs.readFileSync('./test/testimg/test1.jpg'),'test2_5.jpg')
                    .field('title','B & O Beoplay H8')
                    .field('description','For sale beoplay H8 bluetooth anti-noise headphones.')
                    .field('category','Electronics')
                    .field('location','Tampere')
                    .field('postDate','2020-11-13')
                    .field('deliverType',false)
                    .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });
        });

        //4: Deleting items
        describe('Delete items', function() {

            describe('DELETE item WITHOUT APIKEY', function() {
                it('Should response with status 404 and json ({Unauthorized: "Missing Api Key"})', async function() {
                await chai.request(apiAddress)
                    .delete('/items/testid')
                    .then(response => {
                        expect(response.status).to.equal(401);
                        expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            describe('DELETE item WITH NO ID to MATCH', function() {
                it('Should response with status 404 and json ({NotFound: "No posting with this id"})', async function() {
                await chai.request(apiAddress)
                    .delete('/items/1111')
                    .set('apikey', apikey)
                    .then(response => {
                        expect(response.status).to.equal(404);
                        expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });

            describe('DELETE item WITH ID to MATCH', function() {
                it('Should Delete item, response with status 200 and json ({Deleted: "Posting has been deleted"})', async function() {
                await chai.request(apiAddress)
                    .delete('/items/testid')
                    .set('apikey', apikey)
                    .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a('Object');
                    })
                    .catch(error => {
                    expect.fail(error)
                    })
                })
            });
        });

        //5: Search items test
        describe('GET ALL items', function() {

            //5.1:Search items by Category (Electronics)
            describe('SEARCH by gategory', function() {
                it('Should respond with an array of items with category "Electronics"', async function() {
                    await chai.request(apiAddress)
                        .get('/items/search?category=Electronics')
                        .then(response => {
                            expect(response.status).to.equal(200);
                            expect(response.body).to.be.a('object');
                            expect(response.body).to.have.a.property('results');
                            expect(response.body.results).to.be.a('array');
                            expect(response.body.results[0]).to.be.a('object');
                            expect(response.body.results[0]).to.be.of.property('id');
                            expect(response.body.results[0]).to.be.of.property('title');
                            expect(response.body.results[0]).to.be.of.property('description');
                            expect(response.body.results[0]).to.be.of.property('category').equal('Electronics');
                            expect(response.body.results[0]).to.be.of.property('location');
                            expect(response.body.results[0].images).to.be.a('object');
                            expect(response.body.results[0].images).to.be.of.property('image1');
                            expect(response.body.results[0].images).to.be.of.property('image2');
                            expect(response.body.results[0].images).to.be.of.property('image3');
                            expect(response.body.results[0].images).to.be.of.property('image4');
                            expect(response.body.results[0]).to.be.of.property('price');
                            expect(response.body.results[0]).to.be.of.property('postDate');
                            expect(response.body.results[0]).to.be.of.property('deliverType');
                            expect(response.body.results[0]).to.be.of.property('contactInfo');
                    })
                        .catch(error => {
                            expect.fail(error)
                        })
                })
            });

            //5.2: Search items by Location (Electronics)
            describe('SEARCH by location', function() {
                it('Should respond with an array of items with location "Oulu"', async function() {
                    await chai.request(apiAddress)
                        .get('/items/search?location=Oulu')
                        .then(response => {
                            expect(response.status).to.equal(200);
                            expect(response.body).to.be.a('object');
                            expect(response.body).to.have.a.property('results');
                            expect(response.body.results).to.be.a('array');
                            expect(response.body.results[0]).to.be.a('object');
                            expect(response.body.results[0]).to.be.of.property('id');
                            expect(response.body.results[0]).to.be.of.property('title');
                            expect(response.body.results[0]).to.be.of.property('description');
                            expect(response.body.results[0]).to.be.of.property('category');
                            expect(response.body.results[0]).to.be.of.property('location').equal('Oulu');;
                            expect(response.body.results[0].images).to.be.a('object');
                            expect(response.body.results[0].images).to.be.of.property('image1');
                            expect(response.body.results[0].images).to.be.of.property('image2');
                            expect(response.body.results[0].images).to.be.of.property('image3');
                            expect(response.body.results[0].images).to.be.of.property('image4');
                            expect(response.body.results[0]).to.be.of.property('price');
                            expect(response.body.results[0]).to.be.of.property('postDate');
                            expect(response.body.results[0]).to.be.of.property('deliverType');
                            expect(response.body.results[0]).to.be.of.property('contactInfo');
                    })
                        .catch(error => {
                            expect.fail(error)
                        })
                })
            });

            //5.3: Search items by Date of posting (Electronics)
            describe('SEARCH by date of posting', function() {
                it('Should respond with an array of items with postDate "2020-10-07"', async function() {
                    await chai.request(apiAddress)
                        .get('/items/search?postDate=2020-10-07')
                        .then(response => {
                            expect(response.status).to.equal(200);
                            expect(response.body).to.be.a('object');
                            expect(response.body).to.have.a.property('results');
                            expect(response.body.results).to.be.a('array');
                            expect(response.body.results[0]).to.be.a('object');
                            expect(response.body.results[0]).to.be.of.property('id');
                            expect(response.body.results[0]).to.be.of.property('title');
                            expect(response.body.results[0]).to.be.of.property('description');
                            expect(response.body.results[0]).to.be.of.property('category');
                            expect(response.body.results[0]).to.be.of.property('location');
                            expect(response.body.results[0].images).to.be.a('object');
                            expect(response.body.results[0].images).to.be.of.property('image1');
                            expect(response.body.results[0].images).to.be.of.property('image2');
                            expect(response.body.results[0].images).to.be.of.property('image3');
                            expect(response.body.results[0].images).to.be.of.property('image4');
                            expect(response.body.results[0]).to.be.of.property('price');
                            expect(response.body.results[0]).to.be.of.property('postDate').equal('2020-10-07');;
                            expect(response.body.results[0]).to.be.of.property('deliverType');
                            expect(response.body.results[0]).to.be.of.property('contactInfo');
                    })
                        .catch(error => {
                            expect.fail(error)
                        })
                })
            });

        });
    });
});