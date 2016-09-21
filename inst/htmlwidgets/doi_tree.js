HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(el, width, height, x);

//	var hierarchy = d3.hierarchy(x[1]);
//	d3.cluster(hierarchy);


	var doi_tree = new DoiTree(x[1]);
	doi_tree.set_doi("Bacteria", -6);
	doi_tree.set_segments();

	doi_tree.trim_width("Bacteria", [1000, 1000], [5, 5]);
	console.log(doi_tree);
      },

      resize: function(width, height) {}
    };
  }
});
