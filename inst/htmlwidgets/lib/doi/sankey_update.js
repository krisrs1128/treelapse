// placeholder

function draw_sankey(elem, width, height, values, tree, focus_node_id) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"), ["links"]);
  sankey_update(
    width,
    height,
    values,
    tree,
    focus_node_id
  );
}

function sankey_update(width, height, values, tree, focus_node_id) {
  console.log("Focusing on " + focus_node_id);

  // essential DOI algorithm
  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  var groups = d3.set(values.group).values();
  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([0, 35]),
    "fill": d3.scaleOrdinal(d3.schemeSet3)
      .domain(groups)
  };

  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [40, 100] // node size
  );

  var x_pos = layout.descendants()
      .map(function(d) {
	return {"unit": d.data.name, "x": d.x};
      });

  var edgelist = layout.links()
      .map(function(d) {
	return {
	  "source": d.source.data.name,
	  "target": d.target.data.name
	};
      });

  var centers = {
    "source": edge_centers(x_pos, edgelist, values, scales.size, "source"),
    "target": edge_centers(x_pos, edgelist, values, scales.size, "target")
  };

  console.log(centers);

  for (var i = 0; i < groups.length; i++) {
    selection_update(
      "path",
      d3.select("#links"),
      layout.links(),
      "tree_link_" + groups[i],
      sankey_link_attrs(values, scales, groups[i], centers)
    );
  }
}
