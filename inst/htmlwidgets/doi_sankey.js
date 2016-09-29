HTMLWidgets.widget({

  name: 'doi_sankey',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	console.log("empty...");
      },

      resize: function(width, height) {}
    };
  }
});
