HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(el, width, height, x);
	var full_tree = new tree(x[1]);
	var cur_tree = doi_tree.filter_tree(x[0], 0.01);
      },

      resize: function(width, height) {}
    };
  }
});
