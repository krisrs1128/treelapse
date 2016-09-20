
function draw_doi(elem, width, height, tree) {
  setup_background(elem, width, height, "#F7F7F7");
  //var layout = tree_block(filtered_tree, focus_node_id, min_doi,
  //			  display_dim, node_size);

}

function doi_update() {
  var filtered_tree = filter_tree(jQuery.extend(true, {}, tree_var),
				  min_avg_abund);
  var layout = tree_block(filtered_tree, focus_node_id, min_doi,
			  display_dim, node_size);

  var tmp = [];
  for (var otu_id in abund_var) {
    for (var time_id in abund_var[otu_id]) {
      tmp.push(abund_var[otu_id][time_id].value);
    }
  }
  var max_abund = d3.max(tmp);
  var scales = {"size": d3.scale.linear()
		.domain([0, max_abund])
		.range([.7, 13]),
	        "col": d3.scale.linear()
		.domain([-7, 0])
		.range(["#F88E79", "#3EBFA3"])};

  var links = d3.layout.cluster()
    .links(layout.nodes)
  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.x, d.y]})

  var highlighted_link_selection = d3.select("#highlight-links")
      .selectAll(".tree_highlight")
      .data(links, link_id_fun);

  var link_selection = d3.select("#links")
      .selectAll(".tree_link")
      .data(links, link_id_fun);

  var node_selection = d3.select("#nodes")
      .selectAll(".tree_node")
      .data(layout.nodes, function(d) { return d.name })

  var text_selection = d3.select("#text")
      .selectAll(".tree_text")
      .data(layout.nodes.filter(function(d) { return d.doi >= -1}),
	    function(d) { return d.name });

  highlighted_link_selection.exit().remove();
  link_selection.exit().remove();
  node_selection.exit().remove();
  text_selection.exit().remove();

  // enter links and nodes that haven't been entered yet
  highlighted_link_selection.enter()
    .append("path", "g")
    .classed("tree_highlight", true)
    .style({"opacity": 0,
	    "stroke-width": 0,
	    "stroke": function(d) {
	      if (highlight_ids.indexOf(d.target.name) != -1) {
		return "#F25359";
	      } else {
		return "#A878C4";
	      }}});

  link_selection.enter()
    .append("path", "g")
    .classed("tree_link", true)
    .style({"opacity": 0,
	    "stroke": function(d) { return scales.col(d.target.doi) }});

  node_selection.enter()
    .append("circle")
    .classed("tree_node", true)
    .attr({"id": function(d) { return "node-" + d.name; }})
    .style({"opacity": 0,
	    "stroke-width": 0,
	    "stroke": function(d) {
	      // this coloring-if could probably be abstracted
	      if (d.doi == 0) {
		return "#A878C4"
	      } else if (highlight_ids.indexOf(d.name) != -1) {
		return "#F25359"
	      } else {
		return "black";
	      }},
	    "fill": function(d) {
	      var abunds = get_abunds(abund_var, d.name);
	      if (d3.mean(abunds) == 0) {
		return "black"
	      }
	      return scales.col(d.doi)
	    }})
    .on("click",
	function(d) {
	  focus_node_id = d.name;
	  doi_update();
	});

  text_selection.enter()
    .append("text")
    .classed("tree_text", true)
    .style({"opacity": 0});

  highlighted_link_selection
    .transition()
    .duration(1000)
    .attr({"d": function(d) {
      var source = {"x": d.source.x, "y": d.source.y}
      var target = {"x": d.target.x, "y": d.target.y}
      return diagonal({"source": source, "target": target})
    }})
    .style({"opacity": .5,
	    "stroke-width": function(d) {
	      if ((highlight_ids.indexOf(d.target.name) != -1) ||
		  (d.target.doi == 0)) {
		var abunds = get_abunds(abund_var, d.target.name);
		return 1.5 * scales.size(d3.mean(abunds));
	      }
	      return 0;
	    },
	    "stroke": function(d) {
	      if (d.target.doi == 0) {
		return "#A878C4"
	      } else if (highlight_ids.indexOf(d.target.name) != -1) {
		return "#F25359"
	      } else {
		return "black";
	      }}
	   });

  link_selection
    .transition()
    .duration(1000)
    .attr({"d": function(d) {
      var source = {"x": d.source.x, "y": d.source.y}
      var target = {"x": d.target.x, "y": d.target.y}
      return diagonal({"source": source, "target": target})
    }})
    .style({"opacity": 1,
	    "stroke-width": function(d) {
	      var abunds = get_abunds(abund_var, d.target.name);
	      return .66 * scales.size(d3.mean(abunds));
	    },
	    "stroke": function(d) { return scales.col(d.target.doi) }
	   });

  node_selection
    .transition()
    .duration(1000)
    .attr({"cx": function(d) { return d.x },
	   "cy": function(d) { return d.y},
	   "r": function(d) {
	     var abunds = get_abunds(abund_var, d.name);
	     return scales.size(d3.mean(abunds));
	   }})
    .style({"opacity": 1,
	    "stroke-width": function(d) {
	      if(d.doi == 0 || highlight_ids.indexOf(d.name) != -1) {
		var abunds = get_abunds(abund_var, d.name);
		return .2 * scales.size(d3.mean(abunds));
	      } else {
		return 0;
	      }},
	    "stroke": function(d) {
	      if (d.doi == 0) {
		return "#A878C4"
	      } else if (highlight_ids.indexOf(d.name) != -1) {
		return "#F25359"
	      } else {
		return "black";
	      }},
	    "fill": function(d) {
	      var abunds = get_abunds(abund_var, d.name);
	      if (d3.mean(abunds) == 0) {
		return "black"
	      }
	      return scales.col(d.doi)
	    }
	   });

  text_selection
    .transition()
    .duration(1000)
    .text(function(d) { return d.name })
    .attr({"x": function(d) {
      var abunds = get_abunds(abund_var, d.name);
      var r = scales.size(d3.mean(abunds));
      return d.x + 1.75 * Math.sqrt(r);
    },
	   "y": function(d) {
	     var abunds = get_abunds(abund_var, d.name);
	     var r = scales.size(d3.mean(abunds));
	     return d.y - 1.75 * Math.sqrt(r);
	   },
	   "font-size": function(d) {
	     if(d.doi == 0) {
	       return 12
	     } else {
	       return 7
	     }}})
    .style({"opacity":  function(d) {
	     if(d.doi == 0) {
	       return 1
	     } else {
	       return .6
	     }}});

}

function get_matches(names, search_str) {
  var matches = [];
  search_str = search_str.toLowerCase();
  var lower_names = names.map(function(d) { return d.toLowerCase(); });

  for (var i = 0; i < names.length; i++) {
    if (lower_names[i].search(search_str) != -1) {
      matches.push(names[i]);
    }
  }
  return matches;
}

function get_ancestor_matches(search_str) {
  if (search_str == "") return [];

  var nodes = d3.layout.cluster()
      .nodes(tree_var);
  var names = nodes.map(function(d) { return d.name; });
  var matches = get_matches(names, search_str);

  var ancestor_matches = [];
  for (var i = 0; i < matches.length; i++) {
    ancestor_matches = ancestor_matches.concat(
      get_ancestors(tree_var, matches[i], [])
    );
    ancestor_matches = _.uniq(ancestor_matches);
  }
  return ancestor_matches;
}
