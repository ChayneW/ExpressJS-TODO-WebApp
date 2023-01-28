const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()


// mongoose connection:
const mongoose = require('mongoose')
const _ = require('lodash')
const { forEach } = require('lodash')

const app = express()

//----------------------//----------------------
// app configurations:

app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')

// used to configure express to find static files (CSS)
app.use(express.static('public'))

//----------------------//----------------------
// DB connect/creation: MONGO CONNECTION!!!

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true}).catch(err => console.log(`triggered mongo server .catch: ${err}`));


// DB Schema creation:
const todoItemsSchema = new mongoose.Schema({
    name: {
        type: String,
    }
})

// DB Model (table) creation:
// dynamic list schema creation:
const listsSchema = {
    name: String,
    items: [todoItemsSchema]
}

// DB Dynamic Model creation:
const custList = mongoose.model('List', listsSchema)

// // DB items insertion:
const practiceCode = new custList({
    name: 'practice coding',
})

const practiceDraw = new custList({
    name: 'practice drawing',
})

const defaultItems =  [practiceCode, practiceDraw]


// DB CHECK FUNCT:
const checkDB = function(){
    console.log('tapping into checkDB funct:')
    custList.find(function(err, items) {
        if (err) {
            console.log(err)
        }
        else {
            console.log(items)
        }
        console.log(`items in DB: ${items.length}`)
    })
}

console.log('outside of routing, checking checkDB()')
checkDB()


//----------------------------
// Homenew Home screen:
// HOMENEW:

app.get('/', function(req, res){
    
    // home.ejs ->
    
    custList.find({}, function(err, foundItems) {
        if (err) {
            console.log(err)
        }
        else {
            // forEach loop finding subdocs names:
            // const cardTitles = foundItems
            console.log('(/) GET for Loop:')
            foundItems.forEach(function(item){
                console.log(item)
            })    
        }

        console.log('rendering homenew.GET...')
        console.log('sending db TABLES JSON to homescreen (/)...\n')
        res.render('home.ejs', {cardItem: foundItems})
    })
})


//----------------------------
// Post for table requests to access:
app.post('/', function(req, res){

    // home.ejs -> URL -> app.post(/add/CustomCardName..)

    const cardNameChosen = req.body.hiddenCardName
    
    console.log('tapping into (/) POST card form data...')
    console.log(`req.body.hiddenCardName = ${cardNameChosen}`)
    console.log(typeof cardNameChosen)
    console.log('rendering home.POST...')

    console.log('leaving post(/) -> /add/customListName')
    console.log('(/) POST tapping into Chosen TABLE ...\n')

    let adjCardNameChosen = cardNameChosen.replace(/\s/g , "-")
    console.log(adjCardNameChosen)
    res.redirect('/add/' + adjCardNameChosen)
})


//----------------------------
//  Access tables through url params:
app.get('/add/:customListName', function(req, res) {

    // app.post(/) -> URL

    console.log('in /add/customListName()')
    console.log(` customListName() req: ${req.params.customListName}`)

    const customListName = req.params.customListName

        // switched values to name in home.ejs hiddenCardName
    custList.findOne({name: customListName}, function(err, foundAList) {

        if (!err) {
            if (!foundAList){
                // creating new path and DB:
                console.log("customListName()... Doesnt exist\n")
                res.redirect('/')

            } else {
                //show an existing list:
                console.log('customListName()...Exists!\n')
                console.log(foundAList.name)
                console.log(foundAList.items)
                res.render('list.ejs', {listTitle: foundAList.name, newItemAdd: foundAList.items}) //, profileID: customListID
            }
        }
    })
})


//----------------------------
// create new table:
app.post('/create', function(req, res) {

    // home.ejs -> type: string, button

    console.log('\ntapping into /create...')

    console.log(`grabbing text from home input: ${req.body.newTableCreate}`)

    // type:STRING
    const newTableName = _.capitalize(req.body.newTableCreate)
    console.log(` lodash() kicking in: ${newTableName}\n`)

    // string conversion to add dash:
    const adjCardNameChosen = newTableName.replace(/\s/g , "-")
    console.log(`using replace funct: ${adjCardNameChosen}\n`)

    custList.findOne({name: newTableName}, function(err, foundAList) {
        if (!err) {
            if (!foundAList){

                // creating new path and DB:
                console.log("customListName()... Doesnt exist\n")

                // dynamic table creation
                const list = new custList({
                    name: adjCardNameChosen,
                    items: defaultItems,
                })
                list.save()
                console.log('checking db from /create...')
                // checkDB()

                // -> /add/:customListName()  string with '-'
                res.redirect('/add/' + adjCardNameChosen)
                
            } else {
                //show an existing list:
                console.log('newTableName()...Exists!\n')
                console.log(foundAList)

                // json -> list.ejs render
                res.render('list.ejs', {listTitle: foundAList.name, newItemAdd: foundAList.items})
            }
        }
    })
})


//----------------------------
// Post for table to add items to list:
app.post('/addNote', function(req, res) {
    console.log('entering /addNote()...')
    

    // ######## cant find tables with spacing inbetween#######
    
    const hiddenID = req.body.hiddenID
    const itemName = req.body.newItem // input box data
    const newItemProfile = req.body.newItemHomeList // profile of list being added


    // data check:
    console.log(`note written: ${itemName}`)
    console.log(`Profile of item saved: ${newItemProfile}`)
    console.log(hiddenID)
    
    // creating new Item doc for MongoDB:
    const itemNew = new custList({
        name: itemName
    })

    // custList.findOne({_id: hiddenID}, function(err, foundList){
    custList.findOne({name: newItemProfile}, function(err, foundList){

        if (err) {
            console.log(err)
        }
        else {
            console.log('no error...')
            console.log('tapping into foundlist in custList:')
            console.log(foundList) 

            foundList.items.push(itemNew)
            foundList.save()
        }
        res.redirect('/add/' + newItemProfile)
    })
})


//----------------------------
// Deletion post route:
app.post('/delete', function(req, res) {
    
    // check which items being sent
    console.log('tapping into /delete:')

    // Tapping into button 'name' to target OBJ using req.body. parser
    console.log(`delete item id: ${req.body.listItemBeingSelected}`)

    const itemDelete = req.body.listItemBeingSelected
    const hiddenDelListName = req.body.hiddenDelListName
    
    console.log('DEL: body parsed items itemDelete, and hiddenDelListName')
    console.log(itemDelete, hiddenDelListName)

    custList.findOneAndUpdate({name: hiddenDelListName}, {$pull: {items: {_id: itemDelete}}}, function(err, foundList){
        if (!err) {
            res.redirect("/add/" + hiddenDelListName)
        }
    })
})


//----------------------------
// Delete database from home pg:
app.post('/deleteall', function(req, res) { 

    console.log('tapping into /deleteall:')
    const delList = req.body.cardNameDEL
    console.log(delList)

    custList.deleteOne({name: delList}, function(err){
        if (err) {
            console.log(err)
        }
        else {
            console.log('/deleteall: Successfully deleted...')
            checkDB()
        }
    })
    // Mongoose CRUD search:
    res.redirect('/')
})


let port = process.env.PORT
if (port == null || port == '') {
    port = 3000
}


app.listen(port, function() {
    console.log('server is listening on port 3000')
})