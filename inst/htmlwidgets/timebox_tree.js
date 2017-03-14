HTMLWidgets.widget({

  name: 'timebox_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	      draw_timebox(
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
