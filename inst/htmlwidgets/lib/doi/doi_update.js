
function draw_doi(elem, width, height, values, tree, focus_node_id) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"));
  doi_update(width, height, tree, focus_node_id);
}

function doi_update(width, height, tree, focus_node_id) {
  // essential DOI algorithm
  var doi_tree = new DoiTree(tree);
  var layout = doi_tree.tree_block(
    focus_node_id,
      -10, // min doi
    [width, height],
    [10, 10] // node size
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

  // draw elements
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
      "r": 4,
    })
    .on("click",
	function(d) {
	  return doi_update(width, height, tree, d.data.name);
	});

  var t = d3.transition()
      .duration(1000)
      .ease(d3.easeCubic);

  node_selection
    .transition(t)
    .attrs({
      "cx": function(d) {
	return d.x;
      },
      "cy": function(d) {
	return d.y;
      },
    });

  link_selection.exit().remove();
  node_selection.exit().remove();

}
