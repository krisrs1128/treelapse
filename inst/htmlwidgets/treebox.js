HTMLWidgets.widget({

  name: 'treebox',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_treebox(
	  el,
	  width,
	  height
	);
      },

      resize: function(width, height) {}
    };
  }
});
