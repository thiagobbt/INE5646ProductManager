function deleteProduct(id) {
	$.ajax({
		url: '/api/products/' + id,
		type: 'DELETE',
		success: function(result) {
			location.reload(true);
		}
	});
}

function editProduct(id, name, enabled) {
	$.ajax({
		url: '/api/products/' + id,
		type: 'PUT',
		data: 'name=' + name + '&enabled=' + enabled,
		success: function(result) {
			location.reload(true);
		}
	});
}

function addProduct(name, enabled) {
	$.ajax({
		url: '/api/product',
		type: 'POST',
		data: 'name=' + name + '&enabled=' + enabled,
		success: function(result) {
			location.reload(true);
		}
	});
}

$('.btn-edit-product').click(function() {
	var tr = $(this).parentsUntil('tbody')[1];

	var id = tr.cells[0].innerText;
	var name = tr.cells[1].innerText;
	var enabled = tr.cells[2].getElementsByClassName("fa-check").length > 0;

	$('#editModalID').unbind('click');

	$("#editModalID").text(id);
	$("#editModalName").val(name);
	$("#editModalEnable")[0].checked = enabled;

	$('#editModalBtn').click(function() {
		editProduct(id, $("#editModalName").val(), $("#editModalEnable")[0].checked);
	});
})

$('.btn-delete-product').click(function() {
	var id = $(this).parentsUntil('tbody')[1].cells[0].innerText;

	$('#deleteModalBtn').unbind('click');
	$('#deleteModalBtn').click(function() {
		deleteProduct(id)
	});
	$('#deleteModalID').text(id);
})

$('#addModalBtn').click(function() {
	var name = $("#addModalName").val();
	var enabled = $("#addModalEnable")[0].checked;

	addProduct(name, enabled);
});
