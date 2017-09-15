function deleteProduct(id) {
	$.ajax({
		url: '/api/products/' + id,
		type: 'DELETE',
		success: function(result) {
			location.reload(true);
		}
	});
}
