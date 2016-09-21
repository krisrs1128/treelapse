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

	doi_tree.trim_width("Bacteria", [500, 500], [5, 5]);
	console.log(doi_tree);
      },

      resize: function(width, height) {}
    };
  }
});
