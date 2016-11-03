HTMLWidgets.widget({

  name: 'treebox',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_treebox(
	  el,
	  width,
	  height,
	  x[0],
	  stratified_tree(x[2], x[1]),
	  x[3],
	  x[4]
	);
      },

      resize: function(width, height) {}
    };
  }
});
