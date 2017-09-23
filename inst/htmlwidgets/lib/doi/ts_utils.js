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
function get_scales(values, width, height, display_opts) {
  var x_scale;
  var zoom_x_scale;

  if (isNumeric(values.time[0])) {
    // numeric x case
    x_scale = d3.scaleLinear()
      .domain(d3.extent(values.time))
      .range([
        display_opts.margin.ts_left,
        width - display_opts.margin.ts_right
      ]);
    zoom_x_scale = d3.scaleLinear()
      .domain(d3.extent(values.time))
      .range([
        display_opts.margin.tree_left +
          (1 - display_opts.scent_frac.width) * (width - display_opts.margin.tree_left - display_opts.margin.tree_right),
        width - display_opts.margin.tree_right
      ]);
  } else {
    // ordinal (parallel coordinates) x case
    x_scale = d3.scalePoint()
      .domain(d3.set(values.time).values())
      .range([
        display_opts.margin.ts_left,
        width - display_opts.margin.ts_right
      ])
      .align(0);
    zoom_x_scale = d3.scalePoint()
      .domain(d3.set(values.time).values())
      .range([
        display_opts.margin.tree_left +
          (1 - display_opts.scent_frac.width) * (width - display_opts.margin.tree_left - display_opts.margin.tree_right),
        width - display_opts.margin.tree_right
      ]);
  }

  return {
    "x": x_scale,
    "y": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([
        height - display_opts.margin.bottom,
        display_opts.margin.top +
          display_opts.tree.frac * (height - display_opts.margin.bottom - display_opts.margin.top)
      ]),
    "r": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([display_opts.size_min, display_opts.size_max]),
    "zoom_x": zoom_x_scale,
    "zoom_y": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([
        display_opts.margin.top +
          display_opts.scent_frac.height * (height - display_opts.margin.top - display_opts.margin.bottom),
        display_opts.margin.top
      ])
  };
}

/**
 * Draw static TS associated with time / treeboxes
 *
 * @param {d3 selection} elem The html selection on which all the brushes to
 *     check are located.
 * @param {object of arrays} dvalues An object whose keys are series IDs and
 *     whose values are the series y values associated with each ID.
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
function draw_ts(elem,
                 dvalues,
                 cur_lines,
                 scales,
                 mouseover_text,
                 display_opts) {
  var ts_select = draw_ts_internal(
    elem,
    dvalues,
    scales,
    "all_ts",
    cur_lines,
    get_search_values(elem),
    display_opts.ts
  );

  d3.select(elem)
    .select("#mouseover > text")
    .attrs({
      "font-size": display_opts.mouseover_font_size,
      "font-family": display_opts.font_family
    });

  var search_lines = get_search_values(elem);

  var ts_points = [];
  var keys = Object.keys(dvalues);
  for (var i = 0; i < keys.length; i++) {
    if (cur_lines.indexOf(keys[i]) != -1) {
      var cur_points = dvalues[keys[i]].map(
        function(x) {
          return {"data": {"id": keys[i]}, "x": x.time, "y": x.value};
        }
      );
      ts_points = ts_points.concat(cur_points);
    }
  }

  d3.select(elem)
    .select("#ts_voronoi")
    .selectAll("path")
    .remove();

  // setup voronoi mouseover background
  var voronoi = d3.voronoi()
      .x(function(d) { return scales.x(d.x); })
      .y(function(d) { return scales.y(d.y); })
      .extent([[0, scales.y.range()[1]], [scales.x.range()[1], scales.y.range()[0]]]);

  var poly = voronoi(ts_points)
      .polygons()
      .filter(function(d) { return typeof(d) != "undefined"; });

  var voronoi_paths = d3.select(elem)
      .select("#ts_voronoi")
      .selectAll("path")
	    .data(poly).enter()
      .append("path")
      .attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
      .attrs({
        "fill": "none",
        "pointer-events": "all"
      });

  if (mouseover_text) {
    voronoi_paths.on("mouseover", function(d) {
      return info_over(elem, d, scales);
    });
  }
}

/**
 * Specify attribute functions for tree links in time + treeboxes
 *
 * @param {object of arrays} dvalues An object whose keys are series IDs and
 *     whose values are the series y values associated with each ID.
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
function timebox_link_attrs(dvalues, cur_lines, scales, tree_style) {
  var attr_funs = link_attr_defaults();
  attr_funs.stroke = tree_style.col_unselected;

  attr_funs["stroke-width"] = function(d) {
    var cur_values = dvalues[d.target.data.id];
    return scales.r(d3.mean(cur_values));
  };

  return attr_funs;
}

/**
 * Specify attribute functions for tree nodes in time + treeboxes
 *
 * @param {object of arrays} dvalues An object whose keys are series IDs and
 *     whose values are the series y values associated with each ID.
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
function timebox_node_attrs(dvalues, cur_lines, search_lines, scales, tree_style) {
  var attr_funs = node_attr_defaults();

  attr_funs.r = function(d) {
    var cur_values = dvalues[d.data.id];
    return 1.2 * scales.r(d3.mean(cur_values));
  };

  attr_funs.fill = function(d) {
    if (cur_lines.indexOf(d.data.id) != -1) {
      return tree_style.col_selected;
    }
    return tree_style.col_unselected;
  };

  attr_funs.stroke = tree_style.col_search;
  attr_funs["stroke-width"] = function(d) {
    if (search_lines.indexOf(d.data.id) != -1) {
      var cur_values = dvalues[d.data.id];
      return scales.r(d3.mean(cur_values));
    } else {
      return 0;
    }
  };

  return attr_funs;
}

/**
 * Update the mouseover text
 *
 * @param d {object} The mouse-overed voronoi polygon, computed by
 *    d3.voronoi().polygon()
 * @return null
 * @side-effects Removes the current mouseover text and changes it to the new
 * voronoi cell's label.
 **/
function info_over(elem, d, scales) {
  d3.select(elem)
    .select("#mouseover")
    .attr("transform", "translate(" + scales.x(d.data.x) + "," + scales.y(d.data.y) + ")");
  d3.select(elem)
    .select("#mouseover > text")
    .text(d.data.data.id);
}

/**
 * Extract Layout from Tree
 *
 * This returns the coordinates of tree nodes and links, based on a json object.
 * It basically just wraps the d3.hierarchy, and then adjusts margins.
 *
 * @param tree {Tree} A tree object (actually, a properly nested JSON would
 *     suffice) on which we can call d3.hierarchy to compute the layout.
 * @param elem {d3 selection} The html selection on which all the brushes to
 *     check are located.
 * @param display_opts A {object} An object containing margin size information.
 * @return layout {object} An object with two major components
 *   - nodes: The heirarchy.nodes() element from d3, but with x and y offset by
 *       margins.
 *   - links: The hierarchy.links() element from d3, also with coordinates offset.
 */
function tree_layout(tree, elem, display_opts) {
  var hierarchy = d3.hierarchy(tree);

  if (display_opts.tree.layout == "id") {
    hierarchy = hierarchy.sort(function(a, b) {
      return b.height - a.height || a.data.id.localeCompare(b.data.id);
    });
  } else {
    hierarchy = hierarchy.sort(function(a, b) {
      return b.descendants().length - a.descendants().length;
    });
  }

  var width = d3.select(elem).select("svg").attr("width");
  var height = d3.select(elem).select("svg").attr("height");

  // width + height info are in the scales
  var cluster = d3.tree()
      .size([
        0.95 * (1 - display_opts.scent_frac.width) * (width - display_opts.margin.tree_left - display_opts.margin.tree_right),
        0.95 * display_opts.tree.frac * (height - display_opts.margin.bottom - display_opts.margin.top)
      ]);
  var layout = cluster(hierarchy);

  // translate nodes according to margins
  var nodes = layout.descendants()
  nodes.forEach(function(n) {
    n.y += display_opts.margin.top;
    n.x += display_opts.margin.tree_left;
  });

  return {
    "nodes": nodes,
    "links": layout.links()
  };
}

/**
 * Draw the static tree associated with a tree object
 *
 * @param elem {d3 selection} The html selection on which all the brushes to
 *     check are located.
 * @param {object of arrays} dvalues An object whose keys are series IDs and
 *     whose values are the series y values associated with each ID.
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
function draw_tree(elem,
                   dvalues,
                   cur_lines,
                   layout,
                   scales,
                   mouseover_text,
                   display_opts,
                   duration) {
  selection_update(
    "path",
    d3.select(elem).select("#links"),
    layout.links,
    "tree_link",
    timebox_link_attrs(dvalues, cur_lines, scales, display_opts.tree),
    duration
  );

  // draw nodes
  var search_lines = get_search_values(elem);
  selection_update(
    "circle",
    d3.select(elem).select("#nodes"),
    layout.nodes,
    "tree_node",
    timebox_node_attrs(dvalues, cur_lines, search_lines, scales, display_opts.tree),
    duration
  );

  var voronoi = d3.voronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .extent([[0, 0], [scales.x.range()[1], scales.y.range()[1]]]);

  var poly = voronoi(layout.nodes)
      .polygons()
      .filter(function(d) { return typeof(d) != "undefined"; });

  var voronoi_paths = d3.select(elem)
      .select("#tree_voronoi")
      .selectAll("path")
	    .data(poly).enter()
      .append("path");

  var voronoi_paths = d3.selectAll("#tree_voronoi")
      .selectAll("path")
      .attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
      .attrs({
        "fill": "none",
        "pointer-events": "all"
      });

  // display names on mouseover
  if (mouseover_text) {
    var id_scale = {"x": function(x) { return x;}, "y": function(x) { return x; }};
    voronoi_paths.on("mouseover", function(d) {
      return info_over(elem, d, id_scale);
    });
  }
}

/**
 * Generic time series drawing function
 *
 * @param  {d3 selection} elem The html selection on which the DOI tree display
 *     will be drawn.
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @param {string} cur_id The ID of the html element on which to draw the time
 *     series.
 * @param {array of strings} cur_lines An array containing ids of the nodes and
 *     series to highlight.
 * @return {d3 selection} ts_selection The d3 html selection with bound data.
 * @side-effects Draws the ts encoded in pairs onto the element elem.
 **/
function draw_ts_internal(elem,
                          pairs,
                          scales,
                          cur_id,
                          cur_lines,
                          search_lines,
                          ts_style) {
  var first_pairs = pairs[Object.keys(pairs)[0]];
  if (!isNumeric(first_pairs.time)) {
    var x_levels = first_pairs.map(function(d) { return d.time; });
    var cur_x_domain = scales.x.domain();
    var domain_ends = [cur_x_domain[0], cur_x_domain[cur_x_domain.length - 1]];
  }

  var line_fun = d3.line()
      .x(function(d) {
	      var pos = scales.x(d.time);
	      if (isNaN(pos)) {
          if (x_levels.indexOf(d.time) < x_levels.indexOf(domain_ends[0])) {
            return scales.x.range()[0] - 100; // subtract 10 to hide from view
          } else {
            return scales.x.range()[1] + 100;
          }
	      }
	      return pos;
      })
      .y(function(d) { return scales.y(d.value); });
  var units = Object.keys(pairs);

  // brushed over lines
  var ts_selection = d3.select(elem)
      .select("#" + cur_id)
      .selectAll("." + cur_id)
      .data(units, function(d) { return d; });

  ts_selection.filter(function(d) { return cur_lines.indexOf(d) != -1; })
    .raise();
  ts_selection.filter(function(d) { return search_lines.indexOf(d) != -1; })
    .raise();

  ts_selection.exit().remove();
  ts_selection.enter()
    .append("path")
    .classed(cur_id, true)
    .attrs({
      "id": function(d) { return d; },
      "fill": "none",
      "stroke": ts_style.col_unselected,
      "stroke-width": ts_style.width_unselected,
      "opacity": ts_style.opacity_unselected,
      "d": function(d) {
	      return line_fun(
	        pairs[d]
	      );
      }
    });

  ts_selection.transition()
    .duration(100)
    .attrs({
      "stroke": function(d) {
	      if (search_lines.indexOf(d) != -1) {
	        return ts_style.col_search;
	      }
	      if (cur_lines.indexOf(d) != -1) {
	        return ts_style.col_selected;
	      }
	      return ts_style.col_unselected;
      },
      "stroke-width": function(d) {
	      if (cur_lines.indexOf(d) != -1) {
	        return ts_style.width_selected;
	      }
        if (search_lines.indexOf(d) != -1) {
          return ts_style.width_search;
        }
	      return ts_style.width_unselected;
      },
      "d": function(d) {
	      return line_fun(pairs[d]);
      },
      "opacity": function(d) {
	      if(cur_lines.indexOf(d) != -1) {
	        return ts_style.opacity_selected;
	      }
        if(search_lines.indexOf(d) != -1) {
          return ts_style.opacity_search;
        }
	      return ts_style.opacity_unselected;
      }
    });

  return ts_selection;
}

/**
 * Draw time series used for zooming into series
 *
 * @param  {d3 selection} elem The html selection on which the tree / timebox
 *     display will be drawn.
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
 * @param {array of strings} cur_lines An array containing ids of the nodes and
 *     series to highlight.
 * @param {Object of d3.scales} scales An object with different scales for
 *     positions and sizes for the time series and nodes.
 * @return null
 * @side-effects Draws zooming time series on the #zoom_ts group on elem
 **/
function draw_zoom(elem, pairs, cur_lines, scales, ts_style) {
  var search_lines = get_search_values(elem);
  var cur_scales = {"x": scales.zoom_x, "y": scales.zoom_y};
  draw_ts_internal(
    elem,
    pairs,
    cur_scales,
    "zoom_ts",
    cur_lines,
    search_lines,
    ts_style
  );
}

/*******************************************************************************
* Functions required for doing timebox / treebox querying using brush extents
*******************************************************************************/

/**
 * Get TS to Display
 *
 * We provide an option to the user for displaying subsets of time series in the
 * timebox and treebox views. This can be used to show only the leaves, for
 * example, or only those series within some range of depths. This function
 * reads the users request and returns the IDs of series to actually display.
 *
 * @param nodes {object} An array describing every node in the tree. It is
 * expected to have attributes for depth, children, and id.
 * @param min_depth {int} What is the minimum depth for nodes whose associated
 * TS we will display?
 * @param max_depth {int} What is the maximum depth for nodes whose associated
 * TS we will display?
 * @param leaves_only {boolean}: Should only series corresponding to leaves be
 * displayed?
 */
function ts_display_subset(nodes, min_depth, max_depth, leaves_only) {
  var filtered_nodes;
  if (max_depth === null) {
    max_depth = Infinity;
  }

  if (leaves_only) {
    filtered_nodes = nodes.filter(
      function(d) {
        return typeof(d.children) == "undefined"
      });
  } else {
    filtered_nodes = nodes.filter(
      function(d) {
        return (d.depth <= max_depth) & (d.depth >= min_depth);
      }
    );
  }

  return filtered_nodes.map(function(d) { return d.data.id; });
}

/**
 * Reshape line data in form required for d3.svg.line()
 *
 * @param values {object} An object with three subarrays,
 *       - time {array of float} The times associated with Tree nodes.
 *       - value {array of float} The y values associated with Tree nodes.
 *       - unit {array of string} The node names associated with values.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param cur_unit {string} The ID of the entity to extract the time series for.
 * @return {array of objects} An with time / value pairs for each time series
 *     line. For example, [{"time": 0, "value": 1}, ...]
 **/
function get_unit_values(values, cur_unit) {
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
* Invert a rangeBands scale
*
* Based on https://github.com/d3/d3/pull/598
*
* @param {d3.scaleRangeBand} scale A rangebands scale mapping ordinals
* to continuous values.
* @return {function} function A function that returns the domain-category
* closest to the observed continuous range value (the input x).
**/
function ordinal_invert(scale) {
  return function(x) {
    var x_pos = [0].concat(scale.domain().map(scale));
    for (var i = 0; i < x_pos.length - 1; i++) {
      x_pos[i] = 0.5 * (x_pos[i] + x_pos[i + 1]);
    }
    x_pos.pop();
    return scale.domain()[d3.bisect(x_pos, x) - 1];
  };
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
  if (typeof scales.x.invert === "undefined") {
    scales.x.invert = ordinal_invert(scales.x);
  }

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
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
 * @param {array of d3-brush} brushes An array containing all the d3-brushes on
 *     the display.
 * @return units {array of strings} The ids for tree nodes contained in any of
 *     the specified brushes.
 **/
function brush_ts_intersection(elem, pairs, brushes, scales) {
  var units = d3.select(elem)
      .selectAll(".all_ts")
      .nodes()
      .map(function(d) { return d.id; });

  for (var i = 0; i < brushes.length; i++) {
    var box_extent = get_box_extent(brushes[i], scales);
    units = intersect(
      units,
      lines_in_box(pairs, box_extent, scales)
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
function point_in_box(point, box_extent, scales) {
  if (!isNumeric(point.time)) {
    var x_domain = scales.x.domain()
    return (x_domain.indexOf(point.time) >= x_domain.indexOf(box_extent.x_min)) &&
      (x_domain.indexOf(point.time) <= x_domain.indexOf(box_extent.x_max)) &&
      (point.value >= box_extent.y_min) &&
      (point.value <= box_extent.y_max);
  }
  return (point.time >= box_extent.x_min) &&
    (point.time <= box_extent.x_max) &&
    (point.value >= box_extent.y_min) &&
    (point.value <= box_extent.y_max);
}

/**
 * Check whether a line contains any points within the box_extent
 *
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
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
function line_in_box(pairs, box_extent, scales) {
  for (var i = 0; i < pairs.length; i++) {
    var cur_check = point_in_box(pairs[i], box_extent, scales);
    if (cur_check) {
      return true;
    }
  }
  return false;
}

/**
 * Return ids associated with any time series contained in a given brush
 *
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
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
function lines_in_box(pairs, box_extent, scales) {
  var contained_ids = [];
  for (var line_id in pairs) {
    if (line_in_box(pairs[line_id], box_extent, scales)) {
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
 * @param {array of objects} pairs An with time / value pairs for each time
 *      series line. For example, [{"time": 0, "value": 1}, ...]
 * @param brushes {array of d3-brush} An array containing all the d3-brushes on
 *     the display.
 * @return units {array of strings} The ids for tree nodes contained in any of
 *     the specified brushes.
 **/
function brush_nodes_union(elem, pairs, brushes, scales) {
  scales = {
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
