HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(
	  el,
	  width,
	  height - 30,
	  x[0],
	  stratified_tree(x[1], x[2]),
	  x[3],
    x[4]
	);
      },

      resize: function(width, height) {}
    };
  }
});
