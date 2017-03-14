/*******************************************************************************
* @fileoverview Wrappers that update DOI trees according to user interaction.
* @see_also doi_utils.js
*
* @author kriss1@stanford.edu
*******************************************************************************/

/**
 * Setup and draw the DOI tree
 *
 * @param {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {DoiTree} tree The DoiTree that we are drawing. This is used for
 *     searching partial matches among descendants (to determine whether to
 *     highlight a node or not).
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param {float} style_opts.size_min The minimum size (in pixels) of any node.
 * @param {float} style_opts.size_max The maximum size (in pixels) of any node.
 * @param {float} style_opts.leaf_height The height of the rectangle allocated to each
 *     leaf node
 * @param {float} style_opts.leaf_width The width of the rectangle allocated to each
 *     leaf node
 * @return null
 * @side-effects Sets up and draws the DOI tree on elem. This includes 4 overall
 *     groups, for links, nodes, mouseover text, and highlighted links.
 **/
function draw_doi(elem,
		              width,
		              height,
		              values,
		              tree,
		              focus_node_id,
		              style_opts) {

  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);

  setup_background(elem, width, height, "#F7F7F7");
  setup_search(elem, d3.set(values.unit).values());
  setup_groups(
    d3.select(elem).select("svg"),
    ["highlighted_links", "links", "nodes", "text"]
  );
  doi_update(
    elem,
    width,
    height,
    values,
    tree,
    focus_node_id,
    style_opts
  );
}

/**
 * DOI Tree updating function
 *
 * This redraws a DOI tree centered around (and with DOI distribution defined
 * by)the current focus node.
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node.ids associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {DoiTree} tree The DoiTree that we are drawing. This is used for
 *     searching partial matches among descendants (to determine whether to
 *     highlight a node or not).
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param {float} style_opts.size_min The minimum size (in pixels) of any node.
 * @param {float} style_opts.size_max The maximum size (in pixels) of any node.
 * @param {float} style_opts.leaf_height The height of the rectangle allocated to each
 *     leaf node
 * @param {float} style_opts.leaf_width The width of the rectangle allocated to each
 *     leaf node
 * @return null
 * @side-effects Updates the DOI tree to a new focus node.
 **/
function doi_update(elem,
		                width,
		                height,
		                values,
		                tree,
		                focus_node_id,
                    style_opts) {
  function doi_update_wrapper(x) {
    doi_update(
      elem,
      width,
      height,
      values,
      tree,
      x,
      style_opts
    );
  }

  console.log("Focusing on " + focus_node_id);
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  $(search_id).unbind("change");
  $(search_id).on("change", function(e) {
    doi_update_wrapper(focus_node_id);
  });
  var search_strs = get_search_values(elem);

  // essential DOI algorithm
  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([style_opts.size_min, style_opts.size_max]),
    "fill": d3.scalePow().exponent([1e-15])
      .domain(d3.extent(doi_tree.get_attr_array("doi")))
      .range(["#F7F7F7", "#000000"]),
  };

  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [style_opts.leaf_width, style_opts.leaf_height]
  );

  selection_update(
    "circle",
    d3.select(elem).select("#nodes"),
    layout.descendants(),
    "tree_node",
    doi_node_attrs(values, scales, tree_obj, search_strs),
    style_opts.transition_duration
  );

  selection_update(
    "path",
    d3.select(elem).select("#links"),
    layout.links(),
    "tree_link",
    doi_link_attrs(values, scales),
    style_opts.transition_duration
  );

  selection_update(
    "path",
    d3.select(elem).select("#highlighted_links"),
    layout.links(),
    "highlighted_tree_links",
    doi_highlight_link_attrs(values, scales, tree_obj, search_strs),
    style_opts.transition_duration
  );

  selection_update(
    "text",
    d3.select(elem).select("#text"),
    layout.descendants(),
    "tree_text",
    doi_text_attrs(values, scales, style_opts),
    style_opts.transition_duration
  );

  d3.select(elem).
    selectAll(".tree_node")
    .on("click", function(d) { return doi_update_wrapper(d.data.id); });
}
