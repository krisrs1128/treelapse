/*******************************************************************************
* @fileoverview Wrappers that update Sankey DOIs according to user interaction.
* @see_also sankey_utils.js
*
* @author kriss1@stanford.edu
*******************************************************************************/

/**
 * Setup and draw the Sankey DOI
 *
 * @param {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {object} values An object with two subarrays,
 *       - group {array of string} The group associated with each node.
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
 * @param {float} size_min The minimum size (in pixels) of any node.
 * @param {float} size_max The maximum size (in pixels) of any node.
 * @param {float} leaf_height The height of the rectangle allocated to each
 *     leaf node
 * @param {float} leaf_width The width of the rectangle allocated to each
 *     leaf node
 * @return null
 * @side-effects Sets up and draws the Sankey DOI on elem. This includes 2
 *     overall groups, for links and text.
 **/
function draw_sankey(elem,
		                 width,
		                 height,
		                 values,
		                 tree,
                     focus_node_id,
		                 style_opts) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_search(elem, d3.set(values.unit).values());
  setup_groups(
    d3.select(elem).select("svg"),
    ["links", "text", "legend"]
  );

  sankey_update(
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
 * Sankey Tree updating function
 *
 * This redraws a DOI Sankey centered around (and with DOI distribution defined
 * by)the current focus.
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
 * @param {float} size_min The minimum size (in pixels) of any node.
 * @param {float} size_max The maximum size (in pixels) of any node.
 * @param {float} leaf_height The height of the rectangle allocated to each
 *     leaf node
 * @param {float} leaf_width The width of the rectangle allocated to each
 *     leaf node
 * @return null
 * @side-effects Updates the Sankey DOI to a new focus node.
 **/
function sankey_update(elem,
		                   width,
		                   height,
		                   values,
		                   tree,
		                   focus_node_id,
		                   style_opts) {

  function sankey_update_wrapper(x) {
    sankey_update(
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

  // essential DOI algorithm
  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  // setup search box
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  $(search_id).unbind('change');
  $(search_id).on("change", function(e) {
    sankey_update_wrapper(focus_node_id);
  });
  var search_strs = get_search_values(elem);

  var groups = d3.set(values.group).values();
  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([0, style_opts.size_max]),
    "fill": d3.scaleOrdinal(d3.schemeSet3)
      .domain(groups)
  };

  // setup legend
  var legend = d3.legendColor()
      .shapePadding(10)
      .scale(scales.fill);

  d3.select(elem)
    .select("#legend")
    .attrs({
      "transform": "translate(20, 20)",
      "font-family": "roboto",
      "font-size": 12
    })
    .call(legend);

  // Main DOI code
  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [style_opts.leaf_width, style_opts.leaf_height]
  );

  var x_pos = layout.descendants()
      .map(function(d) {
	return {"unit": d.data.id, "x": d.x};
      });

  var edgelist = layout.links()
      .map(function(d) {
	return {
	  "source": d.source.data.id,
	  "target": d.target.data.id
	};
      });

  var centers = {
    "source": edge_centers(x_pos, edgelist, values, scales.size, "source"),
    "target": edge_centers(x_pos, edgelist, values, scales.size, "target")
  };

  for (var i = 0; i < groups.length; i++) {
    selection_update(
      "path",
      d3.select(elem).select("#links"),
      layout.links(),
      "tree_link_" + groups[i],
      sankey_link_attrs(
	      values,
	      scales,
	      groups[i],
	      centers,
	      tree_obj,
	      search_strs
      ),
      style_opts.transition_duration
    );
  }

  selection_update(
    "text",
    d3.select(elem).select("#text"),
    layout.descendants(),
    "tree_text",
    sankey_text_attrs(values, scales, style_opts),
    style_opts.transition_duration
  );

  d3.select(elem)
    .selectAll("[class^='tree_link']")
    .on("click", function(d) {
      return sankey_update_wrapper(d.source.data.id);
    });
}
