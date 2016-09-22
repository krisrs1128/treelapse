HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	draw_doi(el, width, height, x[0], x[1], "Bacteria");
      },

      resize: function(width, height) {}
    };
  }
});
