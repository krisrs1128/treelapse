HTMLWidgets.widget({
  name: 'timebox_tree',
  type: 'output',

  factory: function(el, width, height) {
    return {

      renderValue: function(x) {

	var edges = [{"parent": "", "name": x[1]}];
	for (var i = 0; i < x[2].parent.length; i++) {
	  edges.push({
	    "parent": x[2].parent[i],
	    "name": x[2].child[i]
	  });
	}

	var tree = d3.stratify()
	    .id(function(d) { return d.name; })
	    .parentId(function(d) { return d.parent; })
	(edges);

	draw_timebox(
	  el,
	  width,
	  height,
	  x[0],
	  tree,
	  x[3],
	  x[4]
	);
      },

      resize: function(width, height) {}
    };
  }
});
