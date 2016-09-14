HTMLWidgets.widget({

  name: 'doi_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {
	var svg_elem = d3.select(el)
	    .append("svg")
	    .attrs({
	      "width": width,
	      "height": height
	    });

	var rect = d3.select("svg")
	    .append("rect")
	    .attrs({
	      id: "background_rect",
	      width: width,
	      height: height,
	      "fill": "#F5F5F5"
	    })
      },

      resize: function(width, height) {}
    }
  }
});
