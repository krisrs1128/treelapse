HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(el, width, height, x);
	x[1].filter_tree = filter_tree;
	var tree = x[1].filter_tree(x[0], .4);
	console.log(tree);
      },

      resize: function(width, height) {}
    };
  }
});
