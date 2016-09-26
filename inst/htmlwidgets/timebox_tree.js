HTMLWidgets.widget({
  name: 'timebox_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	console.log(x);
	draw_timebox(el, width, height, x[0], x[1]);
      },

      resize: function(width, height) {}
    };
  }
});
