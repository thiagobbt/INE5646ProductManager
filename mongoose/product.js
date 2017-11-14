var mongoose = require('mongoose');

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

exports.Product = mongoose.model('Products', productSchema);
