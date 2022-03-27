const express = require('express') // import express

const bodyparser = require('body-parser') // import body-parser
const rimraf = require('rimraf')
const path = require('path') // import path
const fs = require('fs') // import fs
const multer = require('multer') // import multer
var uploadsDir = __dirname + "/public/uploads";
const qr = require("qrcode");

setInterval(() => { //function to delelte the files after a while
    fs.readdir(uploadsDir, function (err, files) {
        files.forEach(function (file, index) {
            fs.stat(path.join(uploadsDir, file), function (err, stat) {
                var endTime, now;
                if (err) {
                    return console.error(err);
                }
                now = new Date().getTime();
                endTime = new Date(stat.ctime).getTime() + 60000;
                if (now > endTime) {
                    return rimraf(path.join(uploadsDir, file), function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log("successfully deleted");
                    });
                }
            });
        });
    });
}, 2000);

const res = require('express/lib/response')
const app = express() // create express app

app.use(express.static(path.join(__dirname + "public/uploads"))) // set static folder

app.use(bodyparser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyparser.json()) // parse application/json

const storage = multer.diskStorage({ // taken from npmjs.com documentation for multer
    destination: function (req, file, cb) { // set the destination
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) { 
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));// this will set the filename in the uploads folder 
    },
});

const upload = multer({ storage: storage }).single('file') //here we are also not restricting the user to a certain file limit.

// lets set the view engine
app.set('view engine', 'ejs')

// open home route
app.get('/', (req, res) => {
    res.render('index')
})

// make the upload post request
app.post('/uploadfile', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log(req.file.path)
            res.json({
                path: req.file.filename
            })
        }
    })
})

app.post("/scan", (req, res) => {
    const url = req.body.url;

    // If the input is null return "Empty Data" error
    if (url.length === 0) res.send("Empty Data!");
    
    // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
    // It shall be returned as a png image format
    // In case of an error, it will save the error inside the "err" variable and display it
    
    qr.toDataURL(url, (err, src) => {
        if (err) res.send("Error occured");
      
        // Let us return the QR code image as our response and set it to be the source used in the webpage
        res.render("scan", { src });
    });
});

// GET request to get the file
app.get('/files/:id', (req, res) => {
    console.log(req.params.id);
    res.render('displayfile', { path: req.params.id })
})

app.get('/download', (req, res) => {
    var pathoutput = req.query.path;
    console.log(pathoutput);
    var fullpath = path.join(__dirname, pathoutput);
    res.download(fullpath, (err) => {
        if (err) {
            res.send(err);
        }
    });
})

const PORT = process.env.PORT || 5000 // set port

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})
