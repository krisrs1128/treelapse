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
 * @return null
 * @side-effects Draws the background elements associated with both time and
 *     treeboxes. This includes the background rectangle and the group elements
 *     for the underlying tree and time series displays.
 **/
function setup_tree_ts(elem, width, height) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(
    d3.select(elem).select("svg"),
    ["all_ts"]
  );

  draw_rect(elem, 0.05 * width, height, "y_axis_backdrop", "#F7F7F7");
  draw_rect(elem, width, 0.05 * height, "x_axis_backdrop", "#F7F7F7");
  d3.select("#x_axis_backdrop")
    .attr("transform", "translate(0, " + 0.95 * height + ")");

  setup_groups(
    d3.select(elem).select("svg"),
    ["x_axis", "y_axis"]
  );

  draw_rect(elem, width, 0.43 * height, "tree_backdrop", "#F7F7F7");
  setup_groups(
    d3.select(elem).select("svg"),
    ["zoom_ts", "links", "nodes", "all_brushes", "mouseover"]
  );

  d3.select(elem)
    .select("#mouseover")
    .append("text");
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
  var scales = get_scales(values, width, height, size_min, size_max);
  setup_tree_ts(elem, width, height);
  draw_axes(elem, scales);

  var reshaped = get_reshaped_values(values);
  setup_search(elem, Object.keys(reshaped.dvalues));

  var update_fun = update_factory(
    treebox_update,
    elem,
    reshaped,
    tree,
    [],
    scales
  );

  // add brush in top right for zooming
  var zoom_brush = d3.brush()
    .on("brush", function() {
      zoom_brush_fun(
	elem,
	reshaped.pairs,
	scales,
	update_fun,
	brush_nodes_union
      );
    })
    .extent([[0.8 * width, 0.05 * height], [width, 0.15 * height]]);

  d3.select("#zoom_ts")
    .append("g")
    .classed("zoom_brush", "true")
    .call(zoom_brush);

  // draw main brush for selecting tree nodes
  var brush_extent = [[0, 0], [0.8 * width, 0.39 * height]];
  function add_fun() {
    new_brush(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_extent,
      brush_nodes_union
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      reshaped.dvalues,
      scales,
      update_fun,
      brush_nodes_union
    );
  }

  // draw search box
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  $(search_id).change(function() {
    brush_fun(elem, reshaped.pairs, scales, update_fun, brush_nodes_union);
  });

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  treebox_update(elem, reshaped, tree, [], scales);
}

/**
 * Reshape line data in form required for d3.svg.line()
 *
 * @param {object} values An object with three subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param cur_unit {string} The ID of the entity to extract the time series for.
 * @return {array of objects} An with time / value pairs for each time series
 *     line. For example, [{"time": 0, "value": 1}, ...]
 **/
function get_line_data(values, cur_unit) {
  var cur_times = get_matching_subarray(
    values.time,
    values.unit,
    cur_unit
  );

  var cur_values = get_matching_subarray(
    values.value,
    values.unit,
    cur_unit
  );

  return cur_times.map(function (e, i) {
    return {"time": e, "value": cur_values[i]};
  });
}

/**
 * Precompute various forms of "values" to increase performance
 *
 * We don't want to recompute these forms of values every time a brush is moved.
 *
 * @param {object} values An object with three subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @return {object} reshaped An object with the following elements,
 *       - {object} values This is the same as the input values object.
 *       - {pairs} An object of arrays with time / value pairs for each time
 *                 series line. For example, [{"time": 0, "value": 1}, ...]
 *       - {dvalues} A object of arrays keyed by series IDs and giving y-values
 *                   for each series.
 **/
function get_reshaped_values(values) {
  var reshaped = {
    "values": values,
    "pairs": {},
    "dvalues": {}
  };

  var units = d3.set(values.unit).values();
  for (var i = 0; i < units.length; i++) {
    reshaped.pairs[units[i]] = get_line_data(values, units[i]);
    reshaped.dvalues[units[i]] = reshaped.pairs[units[i]].map(
      function(d) { return d.value; }
    );
  }

  return reshaped;
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
  setup_tree_ts(elem, width, height);
  draw_axes(elem, scales);

  var reshaped = get_reshaped_values(values);
  setup_search(elem, Object.keys(reshaped.dvalues));

  var update_fun = update_factory(
    timebox_update,
    elem,
    reshaped,
    tree,
    [],
    scales
  );

  // add brush in top right for zooming
  var zoom_brush = d3.brush()
    .on("brush", function() {
      zoom_brush_fun(
	elem,
	reshaped.pairs,
	scales,
	update_fun,
	brush_ts_intersection
      );
    })
    .extent([[0.8 * width, 0.05 * height], [width, 0.15 * height]]);

  d3.select("#zoom_ts")
    .append("g")
    .classed("zoom_brush", "true")
    .call(zoom_brush);

  // draw main brush for selecting series
  var brush_extent = [
    [scales.x.range()[0], scales.y.range()[1]],
    [scales.x.range()[1], scales.y.range()[0]]
  ];

  function add_fun() {
    new_brush(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_extent,
      brush_ts_intersection
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_ts_intersection
    );
  }

  // draw search box
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  $(search_id).change(function() {
    brush_fun(elem, reshaped.pairs, scales, update_fun, brush_ts_intersection);
  });

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  timebox_update(elem, reshaped, tree, [], scales);
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
function timebox_update(elem, reshaped, tree, cur_lines, scales) {
  update_axes(elem, scales);
  draw_zoom(elem, reshaped.pairs, cur_lines, scales);
  draw_ts(elem, reshaped.pairs, cur_lines, scales, false);
  draw_tree(elem, reshaped.dvalues, cur_lines, tree, scales, true);
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
 * @param {Tree} tree A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param {array of strings} cur_lines An array containing ids of the nodes and
 *     series to highlight.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @return {function} A version of the base_function function with options
 *    filled in according to the arguments in the factory.
 **/
function update_factory(base_fun, elem, reshaped, tree, cur_lines, cur_scales) {
  function f(cur_lines, cur_scales) {
    base_fun(elem, reshaped, tree, cur_lines, cur_scales);
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
function treebox_update(elem, reshaped, tree, cur_lines, scales) {
  update_axes(elem, scales);
  draw_zoom(elem, reshaped.pairs, cur_lines, scales);
  draw_ts(elem, reshaped.pairs, cur_lines, scales, true);
  draw_tree(elem, reshaped.dvalues, cur_lines, tree, scales, false);
}

/**
 * Identify which time series are selected (by either Time or Treeboxes)
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
 * @param {function} combine_fun The function used for combining units across
 *     brush selections. This is usually the intersection or union of selections
 *    coming from any individual brush.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @return {array of string} units The IDs associated with each time series that
 *     is currently being selected.
 **/
function selected_ts(elem, pairs, combine_fun, scales) {
  var brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes();
  var units = [];

  if (brushes.length !== 0) {
    units = combine_fun(
      elem,
      pairs,
      brushes,
      scales
    );
  }
  return units;
}

/**
 * Function to execute every time a brush is updated
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
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
function brush_fun(elem, pairs, scales, update_fun, combine_fun) {
  var units = selected_ts(elem, pairs, combine_fun, scales);
  update_fun(units, scales);
}

/**
 * Function to call every time brush in zoom box is moved
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
 * @param {function} combine_fun The function used for combining units across
 *     brush selections. This is usually the intersection or union of selections
 *    coming from any individual brush.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @param {function} update_fun The function to execute every time the brush is
 *     updated.
 * @return null
 * @side-effects Redraws the main time series according to the scales set by the
 *     zoom brush on the top right.
 **/
function zoom_brush_fun(elem, pairs, scales, update_fun, combine_fun) {
  var cur_extent = d3.brushSelection(
    d3.select("#zoom_ts").select(".zoom_brush").node()
  );

  // reset domains for scales
  scales.x.domain(
    [scales.zoom_x.invert(cur_extent[0][0]),
     scales.zoom_x.invert(cur_extent[1][0])]
  );
  scales.y.domain(
    [scales.zoom_y.invert(cur_extent[1][1]),
     scales.zoom_y.invert(cur_extent[0][1])]
  );

  var units = selected_ts(
    elem,
    pairs,
    combine_fun,
    scales
  );
  update_fun(units, scales);
}

/**
 * Add a new brush to an html element
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
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
function new_brush(elem, pairs, scales, update_fun, extent, combine_fun) {
  var brush = d3.brush()
      .on("brush", function() {
	brush_fun(
	  elem,
	  pairs,
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
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
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
function remove_brush(elem, pairs, scales, update_fun, combine_fun) {
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
    pairs,
    scales,
    update_fun,
    combine_fun
  );
}
