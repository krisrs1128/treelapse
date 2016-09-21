
function draw_doi(elem, width, height, values, tree) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"));

  // essential DOI algorithm
  var doi_tree = new DoiTree(tree);
  var layout = doi_tree.tree_block(
    "Bacteria", // focus node
      -10, // min doi
    [width, height],
    [5, 10] // node size
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
  link_selection.exit().remove();
  node_selection.exit().remove();

  link_selection.enter()
    .append("path")
    .classed("tree_link", true)
    .attrs({
      "d": function(d) {
	return "M" + d.target.x + "," + d.target.y +
          "C" + d.target.x + "," + (d.target.y + d.source.y) / 2 +
          " " + d.source.x + "," +  (d.target.y + d.source.y) / 2 +
          " " + d.source.x + "," + d.source.y;
      },
      "stroke": "#555",
      "stroke-opacity": 0.4,
      "stroke-width": 1.5
    });


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
      "r": 2,
    });
}
