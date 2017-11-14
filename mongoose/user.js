var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	googleID	: String,
	authorized	: { type: Boolean, default: false }
});

exports.User = mongoose.model('Users', userSchema);
