// placeholder

function draw_sankey(elem, width, height, values, tree, focus_node_id) {
  setup_search(elem);
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

  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([3, 35]),
  };
}
