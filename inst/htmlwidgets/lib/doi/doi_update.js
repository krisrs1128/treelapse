
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
  // essential DOI algorithm
  var doi_tree = new DoiTree(tree);
  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [10, 20] // node size
  );

  // setup scales used throughout
  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([2, 15]),
    "opacity": d3.scalePow().exponent([0.35])
      .domain(d3.extent(doi_tree.get_attr_array("doi")))
      .range(["#EDEDED", "#000000"]),
  };

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

  link_selection.exit().remove();
  node_selection.exit().remove();

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
}
