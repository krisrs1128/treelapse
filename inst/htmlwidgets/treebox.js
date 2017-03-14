HTMLWidgets.widget({

  name: 'treebox',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	      draw_treebox(
	        el,
	        width,
	        height - 30,
	        x[0],
	        stratified_tree(x[2], x[1]),
	        x[3]
	      );
      },

      resize: function(width, height) {}
    };
  }
});
