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
	  x[1],
	  x[2],
	  x[3]
	);
      },

      resize: function(width, height) {}
    };
  }
});
