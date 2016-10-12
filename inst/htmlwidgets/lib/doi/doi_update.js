
function draw_doi(elem,
		  width,
		  height,
		  values,
		  tree,
		  focus_node_id,
		  size_min,
		  size_max,
		  leaf_width,
		  leaf_height) {
  setup_search(elem);
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"), ["highlighted_links", "links", "nodes", "text"]);
  doi_update(
    elem,
    width,
    height,
    values,
    tree,
    focus_node_id,
    size_min,
    size_max,
    leaf_width,
    leaf_height
  );

}

function doi_update(elem,
		    width,
		    height,
		    values,
		    tree,
		    focus_node_id,
		    size_min,
		    size_max,
		    leaf_width,
		    leaf_height) {
  function doi_update_wrapper(x) {
    doi_update(
      elem,
      width,
      height,
      values,
      tree,
      x,
      size_min,
      size_max,
      leaf_width,
      leaf_height
    );
  }

  console.log("Focusing on " + focus_node_id);
  var search_id = "#search_box" + d3.select(elem).attr("id");
  var search_str = $(search_id).val();

  // essential DOI algorithm
  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  // setup search box
  var node_names = tree_obj.get_attr_array("name");
   $(function() {
     $(search_id).autocomplete({
       minLength: 0,
       source: node_names,
       search: function(event, ui) {
   	doi_update_wrapper(focus_node_id);
       },
       select: function(event, ui) {
   	$(search_id).val(ui.item.label);
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
    [leaf_width, leaf_height]
  );

  selection_update(
    "circle",
    d3.select(elem).select("#nodes"),
    layout.descendants(),
    "tree_node",
    doi_node_attrs(values, scales, tree_obj, search_str),
    1000
  );

  selection_update(
    "path",
    d3.select(elem).select("#links"),
    layout.links(),
    "tree_link",
    doi_link_attrs(values, scales),
    1000
  );

  selection_update(
    "path",
    d3.select(elem).select("#highlighted_links"),
    layout.links(),
    "highlighted_tree_links",
    doi_highlight_link_attrs(values, scales, tree_obj, search_str),
    1000
  );

  selection_update(
    "text",
    d3.select(elem).select("#text"),
    layout.descendants(),
    "tree_text",
    doi_text_attrs(values, scales),
    1000
  );

  d3.select(elem).
    selectAll(".tree_node")
    .on("click", function(d) { return doi_update_wrapper(d.data.name); });
}
