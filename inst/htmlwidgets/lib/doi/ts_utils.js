/*******************************************************************************
* @fileoverview Functions for drawing and updating time and treebox displays.
* @see_also ts_update.js
*
* @author kriss1@stanford.edu
*******************************************************************************/

/*******************************************************************************
* Functions for drawing the static tree and time series in timebox trees
*******************************************************************************/

/**
 * Return the scales required for positioning in time + treeboxes
 *
 * @param {object} values An object with three subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {float} width The available width (in pixels) for the display, used
 *     for calculating the range of x values.
 * @param {float} height The available height (in pixels) for the display, used
 *     for calculating the range of y values.
 * @param {float} size_min The minimum size (in pixels) of any node.
 * @param {float} size_max The maximum size (in pixels) of any node.
 * @return {dictionary of d3-scale} A dictionary keyed by "x", "y", and "r"
 *     giving scales for computing positions in the time + treeboxes.
 **/
function get_scales(values, width, height, size_min, size_max) {
  return {
    "x": d3.scaleLinear()
      .domain(d3.extent(values.time))
      .range([0, width]),
    "y": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([height, 0.43 * height]),
    "r": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([size_min, size_max])
  };
}

/**
 * Draw static TS associated with time / treeboxes
 *
 * @param elem {d3 selection} The html selection on which all the brushes to
 *     check are located.
 * @param {object} values An object with three subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param cur_lines {array of string} An array of IDs for the time series /
 *     nodes that are currently being selected by either timeboxes or treeboxes.
 *     This will be used to highlight those nodes in the tree (and mute the
 *     rest).
 * @param scales {dictionary of d3-scales} An object with keys "x" and "y"
 *     giving scales from which x and y positions of the tree nodes are
 *     calculated.
 * @param mouseover_text {boolean} true or false depending on whether to display
 *     mouseover information when a node is hovered over.
 * @return null
 * @side-effects Draws the static time series (svg-paths) on the elem.
 **/
function draw_ts(elem, values, cur_lines, scales, mouseover_text) {
  var units = d3.set(values.unit).values();
  var ts_selection = d3.select(elem)
      .select("#all_ts")
      .selectAll(".ts_line")
      .data(units);

  ts_selection.exit().remove();

  var line_fun = d3.line()
      .x(function(d) { return scales.x(d.time); })
      .y(function(d) { return scales.y(d.value); });

  ts_selection.enter()
    .append("path")
    .classed("ts_line", true)
    .attrs({
      "id": function(d) { return d; },
      "fill": "none",
      "stroke": "#303030",
      "stroke-width": 0,
      "d": function(d) {
	return line_fun(
	  get_line_data(values, d)
	);
      }
    });

  d3.select(elem)
    .selectAll(".ts_line")
    .transition()
    .duration(100)
    .attrs({
      "stroke": function(d) {
	if (cur_lines.indexOf(d) != -1) {
	  return "#2D869F";
	}
	return "#696969";
      },
      "stroke-width": function(d) {
	if (cur_lines.indexOf(d) != -1) {
	  return 1;
	}
	return 0.5;
      },
      "opacity": function(d) {
	if(cur_lines.indexOf(d) != -1) {
	  return 0.9;
	}
	return 0.1;
      }
    });

  if (mouseover_text) {
    ts_selection
      .on("mouseover",
	  function(d) {
	    var cur_data = get_line_data(values, d);
	    var cur_y = cur_data[cur_data.length - 1].value;
	    var cur_x = cur_data[cur_data.length - 1].time;

	    d3.select(elem)
	      .select("#mouseover")
	      .attrs({
		"transform": "translate(" + (5 + scales.x(cur_x)) + "," +
		  scales.y(cur_y) + ")"
	      });

	    d3.select(elem)
	      .select("#mouseover > text")
	      .text(d)
	      .attrs({
		"font-size": 11,
		"font-family": "roboto"
	      });
	  });
  }

}

/**
 * Specify attribute functions for tree links in time + treeboxes
 *
 * @param {object} values An object with three subarrays,
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {array of string} cur_lines An array of IDs for the time series /
 *     nodes that are currently being selected by either timeboxes or treeboxes.
 *     This will be used to highlight those nodes in the tree (and mute the
 *     rest).
 * @param {dictionary of d3-scales} scales An object with keys "r"  giving
 *     the scale from which the radius of the tree nodes are calculated / width
 *     of tree edges.
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 path selection's .attr() to give styling /
 *     positioning for text on time + treeboxes tree nodes.
 **/
function timebox_link_attrs(values, cur_lines, scales) {
  var attr_funs = link_attr_defaults();
  attr_funs.stroke = "#F0F0F0";

  attr_funs.stroke_width = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.target.data.name[0]
    );
    return scales.r(d3.mean(cur_values));
  };

  return attr_funs;
}

/**
 * Specify attribute functions for tree nodes in time + treeboxes
 *
 * @param {object} values An object with three subarrays,
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param cur_lines {array of string} An array of IDs for the time series /
 *     nodes that are currently being selected by either timeboxes or treeboxes.
 *     This will be used to highlight those nodes in the tree (and mute the
 *     rest).
 * @param scales {dictionary of d3-scales} An object with keys "r"  giving
 *     the scale from which the radius of the tree nodes are calculated.
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 circles selection's .attr() to give styling /
 *     positioning for text on time + treeboxes tree nodes.
 **/
function timebox_node_attrs(values, cur_lines, scales) {
  var attr_funs = node_attr_defaults();

  attr_funs.r = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.name[0]
    );
    return 1.2 * scales.r(d3.mean(cur_values));
  };

  attr_funs.fill = function(d) {
    if (cur_lines.indexOf(d.data.name[0]) != -1) {
      return "#2D869F";
    }
    return "#F0F0F0";
  };

  return attr_funs;
}

/**
 * Draw the static tree associated with a tree object
 *
 * @param elem {d3 selection} The html selection on which all the brushes to
 *     check are located.
 * @param {object} values An object with three subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param cur_lines {array of string} An array of IDs for the time series /
 *     nodes that are currently being selected by either timeboxes or treeboxes.
 *     This will be used to highlight those nodes in the tree (and mute the
 *     rest).
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param scales {dictionary of d3-scales} An object with keys "x" and "y"
 *     giving scales from which x and y positions of the tree nodes are
 *     calculated.
 * @param mouseover_text {boolean} true or false depending on whether to display
 *     mouseover information when a node is hovered over.
 * @return null
 * @side-effects Draws the static tree structure (circles and paths between
 *     them) on elem.
 **/
function draw_tree(elem, values, cur_lines, tree, scales, mouseover_text) {
  var hierarchy = d3.hierarchy(tree);

  // width + height info are in the scales
  var cluster = d3.cluster()
      .size([scales.x.range()[1], 0.37 * scales.y.range()[0]]);
  var layout = cluster(hierarchy);

  // draw links
  selection_update(
    "path",
    d3.select(elem).select("#links"),
    layout.links(),
    "tree_link",
    timebox_link_attrs(values, cur_lines, scales),
    100
  );

  // draw nodes
  selection_update(
    "circle",
    d3.select(elem).select("#nodes"),
    layout.descendants(),
    "tree_node",
    timebox_node_attrs(values, cur_lines, scales),
    100
  );

  // display names on mouseover
  if (mouseover_text) {
    d3.select(elem)
      .selectAll(".tree_node")
      .on("mouseover",
	  function(d) {
	    var r = parseFloat(d3.select(this).attr("r"));
	    d3.select(elem)
	      .select("#mouseover")
	      .attrs({
		"transform": "translate(" + (d.x + 2 * Math.sqrt(r))+
		  "," + (d.y - 2 * Math.sqrt(r)) + ")"
	      });

	    d3.select(elem)
	      .select("#mouseover > text")
	      .text(d.data.name[0])
	      .attrs({
		"font-size": 11,
		"font-family": "roboto"
	      });
	  });
  }
}

/*******************************************************************************
* Functions required for doing timebox / treebox querying using brush extents
*******************************************************************************/

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
 * Focus on the brush with the specified id
 *
 * The "focused" brush is the only one that we can manipulate at a time.
 * @param elem {d3 selection} The html selection on which all the brushes to
 *     check are located.
 * @param brush_ix {int} The index for the brush to refocus on.
 * @return null
 * @side-effects Updates the styling and pointer-events for each brush so that
 *     the brush with id "brush-{brush-id}" is the focus.
 **/
function focus_brush(elem, brush_ix) {

  // update pointer events / styling for each brush
  d3.select(elem)
    .selectAll(".brush")
    .attrs({
      "brush_selected": function (d) {
	var cur_id = d3.select(this).attr("id");
	if (cur_id == "brush-" + brush_ix) {
	  return true;
	}
	return false;
      },
      "pointer-events": function(d) {
	var cur_id = d3.select(this).attr("id");
	if (cur_id == "brush-" + brush_ix) {
	  return "all";
	}
	return "none";
      },
      "opacity": function(d) {
	var cur_id = d3.select(this).attr("id");
	if (cur_id == "brush-" + brush_ix) {
	  return 1;
	}
	return 0.4;
      }
    });

  // same updates, but for rectangle contained in brush
  d3.select(elem)
    .selectAll(".brush > rect")
    .attrs({
      "pointer-events": function(d) {
	return d3.select(this.parentNode)
	  .attr("pointer-events");
      }
    });
}

/**
 * Update which brush is focused (can be clicked / dragged)
 *
 * @param elem {d3 selection} The html selection on which all the brushes to
 *     check are located.
 * @return null
 * @side-effects Cycles the brush with the top-pointer event (from the one that
 *     is selected to whatever the next one that had been added is).
 **/
function change_focus(elem) {
  var brushes = d3.select(elem)
      .selectAll(".brush").nodes();

  var brush_ix = 0;
  for (var i = 0; i < brushes.length; i++) {
    var value = brushes[i].attributes.brush_selected.value;
    if(value === "true") {
      brush_ix = i;
    }
  }

  brush_ix = (brush_ix + 1) % brushes.length;
  focus_brush(elem, brush_ix);
}

/**
 * Get the extent of a brush
 *
 * @param brushes {array of d3-brush} An array containing all the d3-brushes on
 *     the display.
 * @param scales {dictionary of d3-scales} An object with keys "x" and "y"
 *     giving scales from which x and y positions of the brushes are calculated.
 * @return box_extent {Object} An object specifying the bounds for
 *     nodes which we should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 **/
function get_box_extent(brush, scales) {
  var box_extent = d3.brushSelection(brush);
  return {
    "x_min": scales.x.invert(box_extent[0][0]),
    "y_min": scales.y.invert(box_extent[1][1]),
    "x_max": scales.x.invert(box_extent[1][0]),
    "y_max": scales.y.invert(box_extent[0][1])
  };
}

/**
 * Return ids of time series going through intersection of brushes
 *
 * @param elem {d3 selection} The html selection on which all the time series to
 *     check are located.
 * @param brushes {array of d3-brush} An array containing all the d3-brushes on
 *     the display.
 * @return units {array of strings} The ids for tree nodes contained in any of
 *     the specified brushes.
 **/
function brush_ts_intersection(elem, brushes, scales) {
  var units = d3.select(elem)
      .selectAll(".ts_line")
      .nodes()
      .map(function(d) { return d.id; });

  for (var i = 0; i < brushes.length; i++) {
    var box_extent = get_box_extent(brushes[i], scales);
    units = intersect(
      units,
      lines_in_box(line_data, box_extent)
    );

  }
  return units;
}

/**
 * Check whether an individual point is contained within the box_extent
 *
 * @param point {object} An object of the form {"time": float, "value": float}.
 * @param box_extent {Object} An object specifying the bounds for nodes which we
 *     should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 * @return {bool} An indicator of whether the given point goes through the
 *     box_extent.
 **/
function point_in_box(point, box_extent) {
  return (point.time >= box_extent.x_min) &&
    (point.time <= box_extent.x_max) &&
    (point.value >= box_extent.y_min) &&
    (point.value <= box_extent.y_max);
}

/**
 * Check whether a line contains any points within the box_extent
 *
 * @param line_data {array of ["time": float, "value": float]} An array specifying the time
 *     series structure. Each array element is a length two [time, value] array.
 * @param box_extent {Object} An object specifying the bounds for nodes which we
 *     should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 * @return {bool} An indicator of whether the specified line has any points
 *     going through the box_extent.
 **/
function line_in_box(line_data, box_extent) {
  for (var i = 0; i < line_data.length; i++) {
    var cur_check = point_in_box(line_data[i], box_extent);
    if (cur_check) {
      return true;
    }
  }
  return false;
}

/**
 * Return ids associated with any time series contained in a given brush
 *
 * @param line_data {object} An object whose keys are IDs for time series. For
 *     example
 *             {"a": [{"time": 0, "value": 1}, ...],
 *              "b": [{"time": 0, "value": 3}, ...]}
 *     are two time series with ids "a" and "b".
 * @param box_extent {Object} An object specifying the bounds for nodes which we
 *     should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 * @return contained_ids {array of string} The IDs for each time series that has
 *      at least one timepoint / value pair going through the box_extent.
 **/
function lines_in_box(line_data, box_extent) {
  var contained_ids = [];
  for (var line_id in line_data) {
    if (line_in_box(line_data[line_id], box_extent)) {
      contained_ids.push(line_id);
    }
  }
  return contained_ids;
}

/**
 * Return tree node ids contained in any existing brush's extents
 *
 * @param elem {d3 selection} The html selection on which all the .tree_nodes to
 *     check are located.
 * @param brushes {array of d3-brush} An array containing all the d3-brushes on
 *     the display.
 * @return units {array of strings} The ids for tree nodes contained in any of
 *     the specified brushes.
 **/
function brush_nodes_union(elem, brushes) {
  var scales = {
    "x": d3.scaleLinear(),
    "y": d3.scaleLinear()
  };

  var units = [];
  for (var i = 0; i < brushes.length; i++) {
    var box_extent = get_box_extent(brushes[i], scales);
    units = union(
      units,
      nodes_in_box(elem, box_extent)
    );

  }
  return units;
}

/**
 * Return tree node ids contained within a brush's extent
 *
 * @param elem {d3 selection} The html selection on which all the .tree_nodes to
 *     check are located.
 * @param box_extent {Object} An object specifying the bounds for nodes which we
 *     should return as "in the box". It must have the keys,
 *       - x_min {float} The minimum x-value for the node to in order for it to
 *             be returned.
 *       - x_max {float} Same, for maximum x-value.
 *       - y_min {float} Same, for minimum y-value.
 *       - y_max {float} Same, for maximum y-value.
 * @return node_ids {array of strings} The ids for tree nodes contained in the
 *     given box_extent.
 **/
function nodes_in_box(elem, box_extent) {
  var nodes = d3.select(elem)
      .selectAll(".tree_node")
      .filter(function(d) {
	return d.x >= box_extent.x_min &&
	  d.x <= box_extent.x_max &&
	  d.y >= box_extent.y_max &&
	  d.y <= box_extent.y_min;
      }).nodes();
  var node_ids = nodes.map(
    function(d) { return d.id; }
  );
  return node_ids;
}


/*******************************************************************************
* Miscellaneous helpers
*******************************************************************************/

/**
 * Get the intersection of two arrays
 *
 * @param a {array} One of the arrays to intersect.
 * @param b {array} One of the arrays to intersect.
 * @return {array} An array containing elements that are in both a and b.
 **/
function intersect(a, b) {
  var t;
  if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
  return a.filter(function (e) {
    if (b.indexOf(e) !== -1) return true;
  });
}

/**
 * Get the union of two arrays
 *
 * @param a {array} One of the arrays to union.
 * @param b {array} One of the arrays to union.
 * @return {array} An array containing any elements that are in either a or b.
 **/
function union(a, b) {
  var obj = {};
  for (var i = a.length - 1; i >= 0; --i)
     obj[a[i]] = a[i];
  for (var i = b.length - 1; i >= 0; --i)
     obj[b[i]] = b[i];
  var res = [];
  for (var k in obj) {
    if (obj.hasOwnProperty(k))  // <-- optional
      res.push(obj[k]);
  }
  return res;
}
