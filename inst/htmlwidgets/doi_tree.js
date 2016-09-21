HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(el, width, height, x);
	var doi_tree = new DoiTree(x[1]);
	doi_tree.set_doi("Bacteria", -6);
	doi_tree.set_segments();
	var block_dois = doi_tree.get_block_dois();
	var average_dois = average_block_dois(block_dois);
	console.log(average_dois);
      },

      resize: function(width, height) {}
    };
  }
});
