const express = require('express');
const graphqlHTTP = require('express-graphql');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const oauth2 = require('./lib/oauth2');

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


// Configure the session and session storage.
const sessionConfig = {
	resave: false,
	saveUninitialized: false,
	secret: process.env.SESSION_SECRET,
	signed: true,
	store: new MongoStore({ mongooseConnection: mongoose.connection })
};

app.use(session(sessionConfig));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.locals.pretty = true;

// OAuth2
app.use(passport.initialize());
app.use(passport.session());
app.use(oauth2.router);

const errorMessages = {
	400: "400 Bad Request",
	404: "404 Not Found",
	500: "500 Internal Server Error"
}

var Product = require('./mongoose/product').Product;
var User = require('./mongoose/user').User;

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

app.set('view engine', 'pug')
app.use(express.static('public', {maxAge: '1d'}))
app.locals.basedir = process.env.PWD
app.use(oauth2.template);

var graphQLSchema = require('./graphql/Schema');
var schema = graphQLSchema.schema;
var getProjection = graphQLSchema.getProjection;

app.use('/graphql', graphqlHTTP (req => ({
	schema,
	graphiql: true
})))

app.get('/', (req, res) => {
	if (!req.user) {
		res.redirect('/login');
	} else {
		res.redirect('/home');
	}
});

app.get('/login', (req, res) => {
	if (!req.user) {
		res.render('login', {title: 'Login'});
	} else {
		res.redirect('/home');
	}
});

app.get('/home', oauth2.required, (req, res) => {
	User.findOne({googleID: req.user.id}, 'authorized', function (err, user) {
		if (err == null) {
			if (user != null && user.authorized) {
				Product.find(function (err, products){
					if (err == null) {
						res.render('index', { title: 'Products', products: products })
					} else {
						res.status(400).send(errorMessages[400]);
					}
				});
			} else {
				res.render('index', { title: 'Products' });
			}
		} else {
			res.status(400).send(errorMessages[400]);
		}
	})
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

app.post('/api/product', function (req, res) {
	if (req.body.name == null) {
		res.status(400).send(errorMessages[400] + "\nProduct name was not provided");
	}

	var enabled = req.body.enabled || true;

	var table = new Product({name: req.body.name, enabled: enabled});

	table.save(function(err) {
		if (err == null) {
			res.status(201).location('/api/products/' + table._id).json(table);
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

app.all('/api/user/:id/authorize', function (req, res) {
	User.findOne({googleID: req.params.id}, function(err, user) {
		if (err == null) {
			if (user == null) {
				user = new User({googleID: req.params.id, authorized: true});
			} else {
				user.authorized = true;
			}

			user.save((err, user) => {
				if (err) {
					res.status(500).send(errorMessages[500]);
				} else {
					res.status(204).send({});
				}
			});
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.all('/api/user/:id/deauthorize', function (req, res) {
	User.findOne({googleID: req.params.id}, function(err, user) {
		if (err == null) {
			if (user == null) {
				user = new User({googleID: req.params.id, authorized: false});
			} else {
				user.authorized = false;
			}

			user.save((err, user) => {
				if (err) {
					res.status(500).send(errorMessages[500]);
				} else {
					res.status(204).send({});
				}
			});
		} else {
			res.status(400).send(errorMessages[400]);
		}
	});
})

app.listen(listen_port, function () {
	console.log('Listening on port ' + listen_port + ".\n")
})
