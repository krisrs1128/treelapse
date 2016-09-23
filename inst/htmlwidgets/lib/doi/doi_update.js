
function draw_doi(elem, width, height, values, tree, focus_node_id) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"));
  doi_update(
    width,
    height,
    values,
    tree,
    focus_node_id
  );
}

function doi_update(width, height, values, tree, focus_node_id) {
  console.log("Focusing on " + focus_node_id);
  // essential DOI algorithm
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([3, 35]),
    "opacity": d3.scalePow().exponent([1e-15])
      .domain(d3.extent(doi_tree.get_attr_array("doi")))
      .range(["#F7F7F7", "#000000"]),
  };

  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [40, 100] // node size
  );

  // bind to data
  var link_selection = d3.select("#links")
      .selectAll(".tree_link")
      .data(layout.links(), link_id_fun);

  var node_selection = d3.select("#nodes")
      .selectAll(".tree_node")
      .data(
	layout.descendants(),
	function(d) { return d.data.name; }
      );

  var text_selection = d3.select("#text")
      .selectAll(".tree_text")
      .data(
	layout.descendants(),
	function(d) { return d.data.name; }
      );

  link_selection.exit().remove();
  node_selection.exit().remove();
  text_selection.exit().remove();

  var transitioner = d3.transition()
      .duration(1000)
      .ease(d3.easeCubic);

  // draw nodes
  node_selection.enter()
    .append("circle")
    .classed("tree_node", true)
    .attrs({
      "id": function(d) {
	return "node-" + d.data.name;
      },
      "cx": function(d) {
	return d.x;
      },
      "cy": function(d) {
	return d.y;
      },
      "fill": function(d) {
	return scales.opacity(d.data.doi);
      },
      "r": function(d) {
	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.data.name
	);
	return scales.size(d3.mean(cur_values));
      }
    })
    .on("click",
	function(d) {
	  return doi_update(
	    width,
	    height,
	    values,
	    tree,
	    d.data.name
	  );
	});


  d3.selectAll(".tree_node")
    .transition(transitioner)
    .attrs({
      "cx": function(d) {
	return d.x;
      },
      "cy": function(d) {
	return d.y;
      },
      "fill": function(d) {
	return scales.opacity(d.data.doi);
      }
    });

  // draw links
  link_selection.enter()
    .append("path", "g")
    .classed("tree_link", true)
    .styles({
      "stroke-opacity": 0,
      "fill": "none",
      "stroke-width": function(d) {
	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.target.data.name
	);
	return scales.size(d3.mean(cur_values));
      },
      "stroke": "black",
    });

  d3.selectAll(".tree_link")
    .transition(transitioner)
    .attrs({
      "d": function(d) {
	return "M" + d.target.x + "," + d.target.y +
          "C" + d.target.x + "," + (d.target.y + d.source.y) / 2 +
          " " + d.source.x + "," +  (d.target.y + d.source.y) / 2 +
          " " + d.source.x + "," + d.source.y;
      }
    })
    .styles({
      "stroke-opacity": 1,
      "stroke": function(d) {
	return scales.opacity(d.target.data.doi);
      }
    });

  // draw text
  text_selection.enter()
    .append("text")
    .classed("tree_text", true)
    .attrs({
      "id": function(d) {
	return "text-" + d.data.name;
      },
      "x": function(d) {
	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.data.name
	);

	return d.x + 1.75 * Math.sqrt(scales.size(d3.mean(cur_values)));
      },
      "y": function(d) {
	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.data.name
	);

	return d.y - 1.75 * Math.sqrt(scales.size(d3.mean(cur_values)));
      },
      "fill": function(d) {
	return scales.opacity(d.data.doi);
      },
      "font-family": "Roboto",
      "font-size": function(d) {
	if (d.data.doi === 0) {
	  return 20;
	}
	return 10;
      }
    });


  d3.selectAll(".tree_text")
    .transition(transitioner)
    .text(function(d) {
      if (d.data.doi >= -1) {
	return d.data.name;
      }
    })
    .attrs({
      "x": function(d) {
	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.data.name
	);

	// a little over sqrt(2) / 2
	return d.x + 0.72 * scales.size(d3.mean(cur_values));
      },
      "y": function(d) {
	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.data.name
	);

	return d.y - 0.72 * scales.size(d3.mean(cur_values));
      },
      "fill": function(d) {
	return scales.opacity(d.data.doi);
      },
      "font-family": "Roboto",
      "font-size": function(d) {
	if (d.data.doi === 0) {
	  return 20;
	}
	return 10;
      }
    });

}
