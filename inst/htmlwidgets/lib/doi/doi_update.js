
function draw_doi(elem, width, height, values, tree, focus_node_id, size_min, size_max) {
  setup_search(elem);
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"), ["highlighted_links", "links", "nodes", "text"]);
  doi_update(
    width,
    height,
    values,
    tree,
    focus_node_id,
    size_min,
    size_max
  );

}

function doi_update(width, height, values, tree, focus_node_id, size_min, size_max) {
  function doi_update_wrapper(x) {
    doi_update(width, height, values, tree, x, size_min, size_max);
  }

  console.log("Focusing on " + focus_node_id);
  var search_str = $("#search_box").val();

  // essential DOI algorithm
  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  // setup search box
  var node_names = tree_obj.get_attr_array("name");
  $(function() {
    $("#search_box").autocomplete({
      minLength: 0,
      source: node_names,
      search: function(event, ui) {
	doi_update_wrapper(focus_node_id);
      },
      select: function(event, ui) {
	$("#search_box").val(ui.item.label);
	doi_update_wrapper(focus_node_id);
      }
    });
  });

  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([size_min, size_max]),
    "fill": d3.scalePow().exponent([1e-15])
      .domain(d3.extent(doi_tree.get_attr_array("doi")))
      .range(["#F7F7F7", "#000000"]),
  };

  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [40, 100] // node size
  );

  selection_update(
    "circle",
    d3.select("#nodes"),
    layout.descendants(),
    "tree_node",
    doi_node_attrs(values, scales, tree_obj, search_str)
  );

  selection_update(
    "path",
    d3.select("#links"),
    layout.links(),
    "tree_link",
    doi_link_attrs(values, scales)
  );

  selection_update(
    "path",
    d3.select("#highlighted_links"),
    layout.links(),
    "highlighted_tree_links",
    doi_highlight_link_attrs(values, scales, tree_obj, search_str)
  );

  selection_update(
    "text",
    d3.select("#text"),
    layout.descendants(),
    "tree_text",
    doi_text_attrs(values, scales)
  );

  d3.selectAll(".tree_node")
    .on("click", function(d) { return doi_update_wrapper(d.data.name); });
}
