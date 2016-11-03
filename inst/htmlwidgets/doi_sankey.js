HTMLWidgets.widget({

  name: 'doi_sankey',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_sankey(
	  el,
	  width,
	  height,
	  x[0],
	  stratified_tree(x[1], x[2]),
	  x[3],
	  x[4],
	  x[5],
	  x[6]
	);
      },

      resize: function(width, height) {}
    };
  }
});
