HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(el, width, height, x[0], x[1], x[2]);
      },

      resize: function(width, height) {}
    };
  }
});
