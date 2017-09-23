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
function setup_tree_ts(elem, width, height, display_opts) {
  d3.select(elem).selectAll("*").remove();
  setup_background(elem, width, height, display_opts.col_background);
  setup_groups(
    d3.select(elem).select("svg"),
    ["all_ts"]
  );

  var tree_y_border = display_opts.margin.top +
      display_opts.tree.frac * (height - display_opts.margin.bottom - display_opts.margin.top);

  draw_rect(elem, display_opts.margin.ts_left, height, "y_axis_backdrop", display_opts.col_background);
  draw_rect(elem, width, display_opts.margin.bottom, "x_axis_backdrop", display_opts.col_background);
  draw_rect(elem, display_opts.margin.ts_right, height - tree_y_border, "ts_right_backdrop", display_opts.col_background);
  d3.select(elem)
    .select("#x_axis_backdrop")
    .attr("transform", "translate(0, " + (height - display_opts.margin.bottom) + ")");
  d3.select(elem)
    .select("#ts_right_backdrop")
    .attr("transform", "translate(" + (width - display_opts.margin.ts_right) + ", " + tree_y_border + ")");

  setup_groups(
    d3.select(elem).select("svg"),
    ["x_axis", "y_axis"]
  );

  draw_rect(
    elem,
    width,
    tree_y_border,
    "tree_backdrop",
    display_opts.col_background
  );
  setup_groups(
    d3.select(elem).select("svg"),
    ["zoom_ts", "links", "nodes", "tree_voronoi", "ts_voronoi", "ts_brushes",
     "zoom_brush", "mouseover"]
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
function draw_treebox(elem, width, height, values, tree, display_opts) {
  var scales = get_scales(
    values,
    width,
    height,
    display_opts
  );
  setup_tree_ts(elem, width, height, display_opts);
  draw_axes(elem, scales, display_opts);

  var layout = tree_layout(tree, elem, display_opts);
  var keep_ids = ts_display_subset(
    layout.nodes,
    display_opts.ts.min_depth,
    display_opts.ts.max_depth,
    display_opts.ts.leaves_only
  );
  var reshaped = get_reshaped_values(values, keep_ids);
  setup_search(elem, Object.keys(reshaped.dvalues));

  var update_fun = update_factory(
    treebox_update,
    elem,
    reshaped,
    layout,
    [],
    scales,
    display_opts
  );

  // add brush in top right for zooming
  var zoom_brush = d3.brush()
      .on("brush", function() {
	      zoom_brush_fun(
	        elem,
	        reshaped.pairs,
	        scales,
	        update_fun,
	        brush_nodes_union,
          tree,
          display_opts
	      );
      })
      .extent([
        [scales.zoom_x.range()[0], scales.zoom_y.range()[1]],
        [scales.zoom_x.range()[1], scales.zoom_y.range()[0]]
      ]);

  d3.select(elem)
    .select("#zoom_brush")
    .append("g")
    .classed("zoom_brush", "true")
    .call(zoom_brush);

  // draw main brush for selecting tree nodes
  var brush_extent = [
    [display_opts.margin.tree_left, display_opts.margin.top],
    [
      (1 - display_opts.scent_frac.width) * (width - display_opts.margin.tree_left - display_opts.margin.tree_right),
      display_opts.margin.top +
        (display_opts.tree.frac) * (height - display_opts.margin.top - display_opts.margin.bottom)
    ]
  ];

  function add_fun() {
    new_brush(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_extent,
      brush_nodes_union,
      tree,
      display_opts
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      reshaped.dvalues,
      scales,
      update_fun,
      brush_nodes_union,
      tree,
      display_opts
    );
  }

  function layout_fun() {
    toggle_fun(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_nodes_union,
      tree,
      display_opts
    );
  }

  // draw search box
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  $(search_id).change(function() {
    brush_fun(elem, reshaped.pairs, scales, update_fun, brush_nodes_union, tree, display_opts);
  });

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  add_button(elem, "toggle layout", layout_fun);
  treebox_update(elem, reshaped, layout, [], scales, display_opts, 100);
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
function get_reshaped_values(values, display_ts) {
  var reshaped = {
    "values": values,
    "pairs": {},
    "dvalues": {}
  };

  var units = d3.set(values.unit).values();
  for (var i = 0; i < units.length; i++) {
    var line_data = get_line_data(values, units[i]);
    if (display_ts.indexOf(units[i]) != -1) {
      reshaped.pairs[units[i]] = line_data;
    }
    reshaped.dvalues[units[i]] = line_data.map(
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
function draw_timebox(elem, width, height, values, tree, display_opts) {
  var scales = get_scales(
    values,
    width,
    height,
    display_opts
  );
  setup_tree_ts(elem, width, height, display_opts);
  draw_axes(elem, scales, display_opts);

  var layout = tree_layout(tree, elem, display_opts);
  var keep_ids = ts_display_subset(
    layout.nodes,
    display_opts.ts.min_depth,
    display_opts.ts.max_depth,
    display_opts.ts.leaves_only
  );

  var reshaped = get_reshaped_values(values, keep_ids);
  setup_search(elem, Object.keys(reshaped.dvalues));

  var update_fun = update_factory(
    timebox_update,
    elem,
    reshaped,
    layout,
    [],
    scales,
    display_opts
  );

  // add brush in top right for zooming
  var zoom_brush = d3.brush()
      .on("brush", function() {
	      zoom_brush_fun(
	        elem,
	        reshaped.pairs,
	        scales,
	        update_fun,
	        brush_ts_intersection,
          tree,
          display_opts
	      );
      })
      .extent([
        [scales.zoom_x.range()[0], scales.zoom_y.range()[1]],
        [scales.zoom_x.range()[1], scales.zoom_y.range()[0]]
      ]);

  d3.select(elem)
    .select("#zoom_brush")
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
      brush_ts_intersection,
      tree,
      display_opts
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_ts_intersection,
      tree,
      display_opts
    );
  }

  function layout_fun() {
    toggle_fun(
      elem,
      reshaped.pairs,
      scales,
      update_fun,
      brush_ts_intersection,
      tree,
      display_opts
    );
  }

  // draw search box
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  $(search_id).change(function() {
    brush_fun(elem, reshaped.pairs, scales, update_fun, brush_ts_intersection, tree, display_opts);
  });

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  add_button(elem, "toggle layout", layout_fun);
  timebox_update(elem, reshaped, layout, [], scales, display_opts, 100);
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
function timebox_update(elem, reshaped, layout, cur_lines, scales, display_opts, duration) {
  update_axes(elem, scales, display_opts);
  draw_zoom(elem, reshaped.pairs, cur_lines, scales, display_opts.ts);
  draw_tree(elem, reshaped.dvalues, cur_lines, layout, scales, true, display_opts, duration);
  draw_ts(elem, reshaped.pairs, cur_lines, scales, false, display_opts);
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
function update_factory(base_fun,
                        elem,
                        reshaped,
                        cur_layout,
                        cur_lines,
                        cur_scales,
                        display_opts) {
  function f(cur_lines, cur_scales, cur_layout, duration) {
    base_fun(
      elem,
      reshaped,
      cur_layout,
      cur_lines,
      cur_scales,
      display_opts,
      duration
    );
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
function treebox_update(elem, reshaped, layout, cur_lines, scales, display_opts, duration) {
  update_axes(elem, scales, display_opts);
  draw_zoom(elem, reshaped.pairs, cur_lines, scales, display_opts.ts);
  console.log(duration);
  draw_tree(elem, reshaped.dvalues, cur_lines, layout, scales, false, display_opts, duration);
  draw_ts(elem, reshaped.pairs, cur_lines, scales, true, display_opts);
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
function brush_fun(elem,
                   pairs,
                   scales,
                   update_fun,
                   combine_fun,
                   tree,
                   display_opts) {
  var units = selected_ts(elem, pairs, combine_fun, scales);
  var layout = tree_layout(tree, elem, display_opts);
  update_fun(units, scales, layout, 100);
}

/**
 * Function to execute every time toggle button pressed
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
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @return null
 * @side-effects Every time the toggle button is pressed, the update_fun() will
 *     be called.
 */
function toggle_fun(elem,
                    pairs,
                    scales,
                    update_fun,
                    combine_fun,
                    tree,
                    display_opts) {
  if (display_opts.tree.layout == "id") {
    display_opts.tree.layout = "subtree_size";
  } else {
    display_opts.tree.layout = "id";
  }

  var units = selected_ts(elem, pairs, combine_fun, scales);
  var layout = tree_layout(tree, elem, display_opts);
  update_fun(units, scales, layout, 1500);
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
function zoom_brush_fun(elem,
                        pairs,
                        scales,
                        update_fun,
                        combine_fun,
                        tree,
                        display_opts) {
  var cur_extent = d3.brushSelection(
    d3.select(elem)
      .select("#zoom_brush")
      .select(".zoom_brush")
      .node()
  );

  // check if ordinal or not, and adjust scales accordingly
  var ordinal = !isNumeric(pairs[Object.keys(pairs)[0]][0].time);
  if (typeof scales.zoom_x.invert === "undefined") {
    scales.zoom_x.invert = ordinal_invert(scales.zoom_x);
  }

  // reset domains for scales
  var new_x0 = scales.zoom_x.invert(cur_extent[0][0]);
  var new_x1 = scales.zoom_x.invert(cur_extent[1][0]);
  if (ordinal) {
    var start_ix = scales.zoom_x.domain().indexOf(new_x0);
    var end_ix = scales.zoom_x.domain().indexOf(new_x1);
    scales.x.domain(scales.zoom_x.domain().slice(start_ix, end_ix + 1));
  } else {
    scales.x.domain([new_x0, new_x1]);
  }

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

  var layout = tree_layout(tree, elem, display_opts);
  update_fun(units, scales, layout, 100);
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
function new_brush(elem,
                   pairs,
                   scales,
                   update_fun,
                   extent,
                   combine_fun,
                   tree,
                   display_opts) {
  var brush = d3.brush()
      .on("brush", function() {
	      brush_fun(
	        elem,
	        pairs,
	        scales,
	        update_fun,
	        combine_fun,
          tree,
          display_opts
	      );
      })
      .extent(extent);

  var n_brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes().length;
  d3.select(elem)
    .select("#ts_brushes")
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
function remove_brush(elem, pairs, scales, update_fun, combine_fun, tree, display_opts) {
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
    combine_fun,
    tree,
    display_opts
  );
}
