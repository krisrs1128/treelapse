HTMLWidgets.widget({

  name: 'doi_sankey',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_sankey(el, width, height, x[0], x[1], x[2]);
      },

      resize: function(width, height) {}
    };
  }
});
