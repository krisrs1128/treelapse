/*******************************************************************************
* @fileoverview Wrappers that update time + treeboxes trees according to user
* interaction.
* @see_also doi_utils.js
*
* @author kriss1@stanford.edu
*******************************************************************************/

/**
 * Initialize background elements common to both timeboxes and treeboxes
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {object} values An object with two subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @return {object} line_data An object that contains data for each line
 *     element. This has the form
 *       {"a": [{"time": 0, "value": 1}, ...],
 *        "b": [{"time": 0, "value": 3}, ...]}
 *     for two time series with ids "a" and "b".
 * @side-effects Draws the background elements associated with both time and
 *     treeboxes. This includes the background rectangle and the group elements
 *     for the underlying tree and time series displays.
 **/
function setup_tree_ts(elem, width, height, values) {
  var units = d3.set(values.unit).values();
  line_data = {};
  for (var i = 0; i < units.length; i++) {
    line_data[units[i]] = get_line_data(values, units[i]);
  }

  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(
    d3.select(elem).select("svg"),
    ["all_ts"]
  );

  d3.select(elem)
    .select("svg")
    .append("rect")
    .attrs({
      "id": "tree_backdrop",
      "height": 0.43 * height,
      "width": width,
      "fill": "#F7F7F7"
    });

  setup_groups(
    d3.select(elem).select("svg"),
    ["zoom_ts", "links", "nodes", "all_brushes", "mouseover"]
  );

  d3.select(elem)
    .select("#mouseover")
    .append("text");
  return line_data;
}

/**
 * Setup and draw the initial treeboxes display
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {object} values An object with two subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param {float} size_min The minimum size (in pixels) of any node.
 * @param {float} size_max The maximum size (in pixels) of any node.
 * @return null
 * @side-effects Sets up the time series and tree associated with the treebox
 *     display.
 **/
function draw_treebox(elem, width, height, values, tree, size_min, size_max) {
  var scales = get_scales(values, 0.9 * width, height, size_min, size_max);
  var line_data = setup_tree_ts(elem, width, height, values);

  var update_fun = update_factory(
    treebox_update,
    elem,
    values,
    tree,
    [],
    scales
  );

  var brush_extent = [[0, 0], [width, 0.39 * height]]; // only brush over tree

  function add_fun() {
    new_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_extent,
      brush_nodes_union
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_nodes_union
    );
  }

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  treebox_update(elem, values, tree, [], scales);
}

/**
 * Setup and draw the initial timeboxes display
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {object} values An object with two subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param {float} size_min The minimum size (in pixels) of any node.
 * @param {float} size_max The maximum size (in pixels) of any node.
 * @return null
 * @side-effects Sets up the time series and tree associated with the timebox
 *     display.
 **/
function draw_timebox(elem, width, height, values, tree, size_min, size_max) {
  var scales = get_scales(values, width, height, size_min, size_max);
  var line_data = setup_tree_ts(elem, width, height, values);
  var update_fun = update_factory(
    timebox_update,
    elem,
    values,
    tree,
    [],
    scales
  );

  var zoom_brush = d3.brush()
      .on("brush", function() {
	cur_extent = d3.brushSelection(
	  d3.select("#zoom_ts").select(".zoom_brush").node()
	);
	scales.x.domain(
	  [scales.zoom_x.invert(cur_extent[0][0]),
	   scales.zoom_x.invert(cur_extent[1][0])]
	);
	scales.y.domain(
	  [scales.zoom_y.invert(cur_extent[1][1]),
	   scales.zoom_y.invert(cur_extent[0][1])]
	);
	var units = selected_ts(elem, brush_ts_intersection, scales);
	update_fun(units, scales);
      })
      .extent([[0.8 * width, 0.05 * height], [width, 0.15 * height]]);

  d3.select("#zoom_ts")
    .append("g")
    .classed("zoom_brush", "true")
    .call(zoom_brush);

  var brush_extent = [[0, 0.43 * height], [width, height]];

  function add_fun() {
    new_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_extent,
      brush_ts_intersection
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_ts_intersection
    );
  }

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  timebox_update(elem, values, tree, [], scales);
}

/**
 * @param  {d3 selection} elem The html selection on which the timebox display
 *     will be drawn.
 * @param {object} values An object with two subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param {array of strings} cur_lines An array containing ids of the nodes and
 *     series to highlight.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @return null
 * @side-effects Updates the timebox display to highlight the currently selected
 *     series.
 **/
function timebox_update(elem, values, tree, cur_lines, scales) {
  draw_zoom(elem, values, cur_lines, scales);
  draw_ts(elem, values, cur_lines, scales, false);
  draw_tree(elem, values, cur_lines, tree, scales, true);
}

/**
 * Template for updates used by bohth tree and timeboxes
 *
 * @param {function} base_fun The general function to execute in the specific
 *     cases specified by the arguments to update_factory().
 * @param  {d3 selection} elem The html selection on which the tree / timebox
 *     display will be drawn.
 * @param {object} values An object with two subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param {array of strings} cur_lines An array containing ids of the nodes and
 *     series to highlight.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @return {function} A version of the base_function function with options
 *    filled in according to the arguments in the factory.
 **/
function update_factory(base_fun, elem, values, tree, cur_lines, cur_scales) {
  function f(cur_lines, cur_scales) {
    base_fun(elem, values, tree, cur_lines, cur_scales);
  }

  return f;
}

/**
 * Update the treebox display to highlight the currently selected nodes
 *
 * @param  {d3 selection} elem The html selection on which the tree / timebox
 *     display will be drawn.
 * @param {object} values An object with two subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param {array of strings} cur_lines An array containing ids of the nodes and
 *     series to highlight.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @return null
 * @side_effects Redraws the tree and time series in the treebox display in
 *     order to highlight the currently selected IDs.
 **/
function treebox_update(elem, values, tree, cur_lines, scales) {
  draw_ts(elem, values, cur_lines, scales, true);
  draw_tree(elem, values, cur_lines, tree, scales, false);
}

<<<<<<< HEAD
/**
 * Function to execute every time a brush is updated
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {object} line_data An object that contains data for each line
 *     element. This has the form
 *       {"a": [{"time": 0, "value": 1}, ...],
 *        "b": [{"time": 0, "value": 3}, ...]}
 *     for two time series with ids "a" and "b".
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @param {function} update_fun The function to execute every time the brush is
 *     updated.
 * @param {function} combine_fun The function used for combining units across
 *     brush selections. This is usually the intersection or union of selections
 *    coming from any individual brush.
 * @return null
 * @side-effects Every time the associated brush is moved, the update_fun() will
 *     be called.
 **/
function brush_fun(elem, line_data, scales, update_fun, combine_fun) {
=======
function selected_ts(elem, combine_fun, scales) {
>>>>>>> master
  var brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes();
  if (brushes.length !== 0) {
    units = combine_fun(
      elem,
      brushes,
      scales
    );
  } else {
    units = [];
  }
  return units;
}

function brush_fun(elem, line_data, scales, update_fun, combine_fun) {
  var units = selected_ts(elem, combine_fun, scales);
  update_fun(units, scales);
}

/**
 * Add a new brush to an html element
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {object} line_data An object that contains data for each line
 *     element. This has the form
 *       {"a": [{"time": 0, "value": 1}, ...],
 *        "b": [{"time": 0, "value": 3}, ...]}
 *     for two time series with ids "a" and "b".
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @param {function} update_fun The function to execute every time the brush is
 *     updated.
 * @param {Object} extent An object specifying the bounds for nodes which we
 *     should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 * @param {function} combine_fun The function used for combining units across
 *     brush selections. This is usually the intersection or union of selections
 *    coming from any individual brush.
 * @return null
 * @side-effects Adds a new brush to elem and focuses the display on it.
 **/
function new_brush(elem, line_data, scales, update_fun, extent, combine_fun) {
  var brush = d3.brush()
      .on("brush", function() {
	brush_fun(
	  elem,
	  line_data,
	  scales,
	  update_fun,
	  combine_fun
	);
      })
      .extent(extent);

  var n_brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes().length;
  d3.select(elem)
    .select("#all_brushes")
    .append("g")
    .classed("brush", true)
    .attrs({"id": "brush-" + n_brushes})
    .call(brush);

  focus_brush(elem, n_brushes);
}

/**
 * Remove a brush from an html element
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {object} line_data An object that contains data for each line
 *     element. This has the form
 *       {"a": [{"time": 0, "value": 1}, ...],
 *        "b": [{"time": 0, "value": 3}, ...]}
 *     for two time series with ids "a" and "b".
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @param {function} update_fun The function to execute every time the brush is
 *     updated.
 * @param {Object} extent An object specifying the bounds for nodes which we
 *     should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 * @param {function} combine_fun The function used for combining units across
 *     brush selections. This is usually the intersection or union of selections
 *    coming from any individual brush.
 * @return null
 * @side-effects Removes the specified brush from elem and refocuses on the
 *     previously added one.
 **/
function remove_brush(elem, line_data, scales, update_fun, combine_fun) {
  var brush_ix = 0;
  d3.select(elem)
    .selectAll(".brush").filter(
    function(d, i) {
      if(d3.select(this).attr("brush_selected") === "true") {
	brush_ix = i;
	return true;
      }
      return false;
    }).remove();

  // renumber brushes
  d3.select(elem)
    .selectAll(".brush")
    .attr("id", function(d, i) {
      return "brush-" + i;
    });

  var n_brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes().length;
  focus_brush(elem, brush_ix % n_brushes);
  brush_fun(
    elem,
    line_data,
    scales,
    update_fun,
    combine_fun
  );
}
