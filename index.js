const express = require('express')
var bodyParser = require('body-parser');
var mongoose = require('mongoose')

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGOLAB_URI, {useMongoClient: true}, function (error) {
	if (error) {
		console.error(error);
	} else {
		console.log('MongoDB connected');
	}
});

const app = express()
const listen_port = process.env.PORT || 5000

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.locals.pretty = true;

var productSchema = new mongoose.Schema({
	name		: String,
	enabled		: { type: Boolean, default: true }
}, {
	timestamps: true
});

productSchema.virtual('id').get(function(){
	return this._id.toHexString();
});

productSchema.set('toJSON', {
	virtuals: true
});

productSchema.options.toJSON.transform = function (doc, ret, options) {
  delete ret._id;
  delete ret.__v;
  return ret;
}

var Product = mongoose.model('Products', productSchema);

const errorMessages = {
	400: "400 Bad Request",
	404: "404 Not Found",
	500: "500 Internal Server Error"
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

app.set('view engine', 'pug')
app.use(express.static('public'))
app.locals.basedir = process.env.PWD

app.get('/', function (req, res) {
	Product.find(function (err, products){
		if (err == null) {
			res.render('index', { title: 'Products', message: 'Hello there!', user: 'John Doe', products: products })
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.get('/api/products/since/:since', function(req, res) {
	var query = {
		updatedAt: {"$gte": new Date(req.params.since)}
	}

	Product.find(query, function(err, products){
		if (err == null) {
			res.status(200).json(products);
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.get('/api/products', function(req, res) {
	Product.find(function(err, products){
		if (err == null) {
			res.status(200).json(products);
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.get('/api/products/:id', function (req, res) {
	Product.findById(req.params.id, function(err, product) {
		if (err == null) {
			if (product == null) {
				res.status(404).send(errorMessages[404]);
			} else {
				res.status(200).json(product);
			}
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.delete('/api/products/:id', function(req, res) {
	Product.findById(req.params.id, function(err, product) {
		if (err == null) {
			if (product == null) {
				res.status(404).send(errorMessages[404]);
			} else {
				product.remove(function(err, product){
					res.status(204).send({});
				});
			}
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.put('/api/products/:id', function (req, res) {
	Product.findById(req.params.id, function(err, product) {
		if (err == null) {
			if (product == null) {
				res.status(404).send(errorMessages[404]);
			} else {
				if (req.body.name != null) product.name = req.body.name;
				if (req.body.enabled != null) product.enabled = req.body.enabled;

				product.save((err, product) => {
					if (err) {
						res.status(500).send(errorMessages[500]);
					} else {
						res.status(204).send({});
					}
				});
			}
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.post('/api/createTable', function (req, res) {
	var table = new Product({name: "Table"});

	table.save(function(err) {
		if (err == null) {
			res.status(201).location('/api/products/' + table._id).json(table);
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.listen(listen_port, function () {
	console.log('Listening on port ' + listen_port + ".\n")
})
