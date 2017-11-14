var graphql = require('graphql');
var ProductMongo = require('../mongoose/product').Product;

function getProjection (fieldASTs) {
	return fieldASTs.fieldNodes[0].selectionSet.selections.reduce((projections, selection) => {
		projections[selection.name.value] = true;
		return projections;
	}, {});
}

function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}

var productType = new graphql.GraphQLObjectType({
	name: 'product',
	description: 'todo item',
	fields: () => ({
		id: {
			type: (graphql.GraphQLString),
			description: 'The id of the product.',
		},
		name: {
			type: graphql.GraphQLString,
			description: 'The name of the product.',
		},
		enabled: {
			type: graphql.GraphQLBoolean,
			description: 'Is the product enabled?'
		},
		createdAt: {
			type: graphql.GraphQLString,
			description: 'When the product was created.'
		},
		updatedAt: {
			type: graphql.GraphQLString,
			description: 'When the item was last modified.'
		}
	})
});

var schema = new graphql.GraphQLSchema({
	query: new graphql.GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			product: {
				type: new graphql.GraphQLList(productType),
				args: {
					id: {
						name: 'product id',
						type: graphql.GraphQLString
					},
					since: {
						name: 'only show products updated after this time',
						type: graphql.GraphQLString
					}
				},
				resolve: (root, queryParams, source, fieldASTs) => {
					var projections = getProjection(fieldASTs);
					var query = {};

					if (queryParams['id']) query._id = queryParams.id;
					if (queryParams['since']) {
						query.updatedAt = {"$gte": new Date(queryParams['since'])}
					}

					// console.log(query);

					var foundItems = new Promise((resolve, reject) => {
						ProductMongo.find(query, projections, (err, products) => {
							err ? reject(err) : resolve(products)
						})
					})

					return foundItems
				}
			}
		}
	})
});

exports.schema=schema;
exports.getProjection=getProjection;
