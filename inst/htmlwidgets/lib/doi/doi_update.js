
function draw_doi(elem, width, height, values, tree) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(elem);
  var doi_tree = new DoiTree(tree);
  var layout = doi_tree.tree_block(
    "Bacteria", // focus node
      -5, // min doi
    [width, height],
    [5, 5] // node size
  );

  var scales = {
    "size": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([0.7, 13]),
    "col": d3.scaleLinear()
      .domain([-7, 0]) // should be set to min_doi
      .range(["#F88E79", "#3EBFA3"])
  };

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
  link_selection.enter()
    .append("path", "g")
    .classed("tree_link", true);

  node_selection.exit().remove();
  node_selection.enter()
    .append("circle")
    .classed("tree_node", true);
}

function doi_update() {

  // enter links and nodes that haven't been entered yet
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

}
