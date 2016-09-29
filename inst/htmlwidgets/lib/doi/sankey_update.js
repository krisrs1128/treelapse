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
      .range([3, 35]),
    "fill": d3.scaleOrdinal(d3.schemeSet3)
      .domain(groups)
  };

}
