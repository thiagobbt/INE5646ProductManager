const express = require('express')
const bodyParser = require('body-parser');

const app = express()
const listen_port = 8000

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

products = {}
availableID = 0;

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

app.set('view engine', 'pug')
app.use(express.static('public'))
app.locals.basedir = process.env.PWD

// GET method route
app.get('/', function (req, res) {
	// res.send('GET request to the homepage\n')
	res.render('index', { title: 'Hey', message: 'Hello there!', user: 'John Doe' })
})

// POST method route
app.post('/', function (req, res) {
	res.send('POST request to the homepage\n')
})

// app.get('/:a/:b', function (req, res) {
// 	res.send(req.params)
// })

app.get('/products', function (req, res) {
	res.json({"products": products})
})

app.put('/product/:name', function (req, res) {
	if (getKeyByValue(products, req.params.name) == undefined) {
		products[availableID] = req.params.name;

		res.json({
			"status": "ok",
			"id": availableID++
		})
	} else {
		res.json({"status": "fail"})
	}
})

app.get('/products/:id', function (req, res) {
	if (products[req.params.id] != undefined) {
		res.json({
			"status": "ok",
			"productName": products[req.params.id]
		})
	} else {
		res.json({"status": "fail"})
	}
})

app.patch('/product/:id/:newName', function (req, res) {
	if (products[id] != undefined) {
		var oldName = products[id];
		products[id] = newName;
		res.json({
			"status": "ok",
			"oldName": oldName,
			"newName": products[id]
		})
	} else {
		res.json({"status": "fail"})
	}
})

app.delete('/product/:id', function (req, res) {
	if (products[req.params.id] != undefined) {
		var prodName = products[req.params.id];
		delete products[req.params.id];
		res.json({
			"status": "ok",
			"deletedProductName": prodName
		})
	} else {
		res.json({"status": "fail"})
	}
})

app.post("/test", function (req, res) {
	console.log(req.body)
	res.json({})
})

app.listen(listen_port, function () {
	console.log('Listening on port ' + listen_port + ".\n")
})
