/*******************************************************************************
* @fileoverview Functions for calculating positions for and drawing the DOI
* Sankey trees.
*
* @author kriss1@stanford.edu
*******************************************************************************/

/**
 * Retrieve positions for sankey group elements, given the overall  center
 *
 * @param x {float} The x-position for the overall edge, for the current ID.
 * @param widths {array of float} The widths to be associated with each group in
 *     the Sankey tree (at the current ID).
 * @return new_x {array of float} The x-positions to assign to each group for
 *     the current ID, in a way that ensures the individual widths agree with
 *     widths and the overall edge center is at x.
 **/
function offset_x(x, widths) {
  var half_width = 0.5 * d3.sum(widths);
  var new_x = [x - half_width + 0.5 * widths[0]];

  for (var i = 1; i < widths.length; i++) {
    new_x.push(
      new_x[i - 1] + 0.5 * (widths[i - 1] + widths[i])
    );
  }

  return new_x;
}

/**
 * Comparison for ordering edges in sankey tree
 *
 * We need to sort edges first by which group they belong to, then which child
 * (target) they are associated with.
 *
 * @param {object} a An entity associated with a node. Expected to have group
 *     and target attributes for calculating -- the values of these will
 *     determine the sort ordering.
 * @param {object} b An entity associated with a node. Expected to have group
 *     and target attributes for calculating -- the values of these will
 *     determine the sort ordering.
 * @return {int} Either 0, -1, or 1 for whether a should be considered equal to,
 *     less than, or greater than b, respectively.
 **/
function compare(a,b) {
  if (a.group < b.group)
    return -1;
  if (a.group > b.group)
    return 1;
  if (a.target < b.target)
    return -1;
  if (a.target > b.target)
    return 1;
  return 0;
}

/**
 * Retrieve offset centers for each edge-group combination
 *
 * @param {array of float} x_pos The centers for each edge in the Sankey tree.
 *     These will need to be offset to give the centers for each group in the
 *     Sankey tree.
 * @param {array of objects} links An array with elements like
 *     {"source": string, "target": string}.
 * @param {Object} values An object with two subarrays,
 *       - unit: The entity id for each measurement.
 *       - group: The group memberships for each measurement.
 *       - value: The abundance for the specified unit / group combination.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {d3.scale} scale A scale object from which to map value.value's into
 *     pixel widths on the screen.
 * @param {string} center_type We have to offset differently depending whether
 *     we are at a source or target of a link. This must have values either
 *     "source" or "target".
 * @return {array of objects} centers An array of objects describing the source,
 *     target, group, x-position, and width for each node and associated group.
 **/
function edge_centers(x_pos, links, values, scale, center_type) {
  reshaped_values = values.unit.map(function(unit, i) {
    return {
      "unit": unit,
      "group": values.group[i],
      "value": values.value[i]
    };
  });

  var centers = [];
  for (var i = 0; i < x_pos.length; i++) {
    if (center_type == "target") {
      var cur_targets = links
	        .filter(function(d) { return d.source == x_pos[i].unit; })
	        .map(function(d) { return d.target; });

      // case we're at a leaf, no need to offset according to children
      if (cur_targets.length === 0) {
	      cur_targets = [x_pos[i].unit];
      }
    } else if (center_type == "source") {
      var cur_targets = [x_pos[i].unit];
    }

    var cur_values = reshaped_values
	      .filter(function(d) {
	        return cur_targets.indexOf(d.unit) != -1;
	      });

    var widths = cur_values
	      .map(function(d) {
	        return {
	          "target": d.unit,
	          "group": d.group,
	          "width": scale(d.value)
	        };
	      })
	      .sort(compare);

    var cur_coords = offset_x(
      x_pos[i].x,
      widths.map(function(d) { return d.width; })
    );

    for (var j = 0; j < cur_coords.length; j++) {
      centers.push({
	      "source": x_pos[i].unit,
	      "target": widths[j].target,
	      "group": widths[j].group,
	      "x": cur_coords[j],
	      "width": widths[j].width
      });
    }
  }

  return centers;
}

/**
 * Specify attribute functions for links in Sankey tree
 *
 * @param {Object} values An object with two subarrays,
 *       - unit: The entity id for each measurement.
 *       - group: The group memberships for each measurement.
 *       - value: The abundance for the specified unit / group combination.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {dictionary of scales} scales A dictionary of scale objects used in
 *     calculating attributes. Here, we only need a scales.fill() scale, used
 *     for shading the groups in different colors.
 * @param {string} group The current group to define attributes for.
 * @param {array of objects} centers An array of objects describing the source,
 *     target, group, x-position, and width for each node and associated group.
 * @param tree_obj {Tree} The Tree that we are drawing. This is used for
 *     searching partial matches among descendants (to determine whether to
 *     highlight a node or not).
 * @param {string} search_strs The string to scan across all node ids looking for
 *     a partial match.
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 path selection's .attr() to give styling /
 *     position for Sankey trees.
 **/
function sankey_link_attrs(values, scales, group, centers, tree, search_strs) {
  var attrs = link_attr_defaults();
  attrs.opacity = 0.1;
  attrs.stroke = scales.fill(group);

  // get paths positions
  attrs.d = function(d) {
    // targets need to be based on overall abundance of edge flowing in, not
    // widths of each descendant edge
    var target_center = centers.source
	      .filter(function(center) {
	        return (center.target == d.target.data.id) &&
	          (center.group == group);
	      })[0].x;

    // sources need to be based abundances of edges flowing out
    var source_center = centers.target
	      .filter(function(center) {
	        return (center.source == d.source.data.id) &&
	          (center.group == group) &&
	          (center.target == d.target.data.id);
	      })[0].x;

    return "M" + target_center + "," + d.target.y +
      "C" + target_center + "," + (d.target.y + d.source.y) / 2 +
      " " + source_center + "," +  (d.target.y + d.source.y) / 2 +
      " " + source_center + "," + d.source.y;
  };

  // set widths and opacity depending on abundance and search strings
  attrs["stroke-width"] = function(d) {
    return centers.source
      .filter(function(center) {
	      return (center.group == group) &&
	        (center.target == d.target.data.id);
      })[0].width;
  };

  attrs["stroke-opacity"] = function(d) {
    if (search_strs[1] === null) { // case nothing selected
      return 0.8;
    }

    var cur_tree = tree.get_subtree(d.target.data.id);
    for (var i = 0; i < search_strs.length; i++) {
      if (search_strs[i] !== null &&
	        search_strs[i] !== "" &&
	        cur_tree.contains_partial_match(search_strs[i])) {
	      return 0.8;
      }
    }
    return 0.2;
  };

  return attrs;
}

/**
 * Specify attribute functions for text in Sankey tree
 *
 * @param {Object} values An object with two subarrays,
 *       - unit: The entity id for each measurement.
 *       - group: The group memberships for each measurement.
 *       - value: The abundance for the specified unit / group combination.
 *     The i^th element in each of the three arrays correspond to the same
 *     entity.
 * @param {dictionary of scales} scales A dictionary of scale objects used in
 *     calculating attributes. Here, we only need a scales.fill() scale, used
 *     for shading the groups in different colors.
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 text selection's .attr() to give styling /
 *     position for Sankey trees.
 **/
function sankey_text_attrs(values, scales, style_opts) {
  var attrs = text_attr_defaults();

  attrs.x = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.id
    );

    return d.x + style_opts.text_offset * scales.size(d3.sum(cur_values)) + 5;
  };

  attrs.y = function(d) { return d.y; };
  attrs.fill = "#474747";
  attrs.text = function(d) {
    if (d.data.doi >= -style_opts.text_display_neighbors) {
      return d.data.id;
    }
  };

  attrs["font-size"] = function(d) {
    if (d.data.doi === 0) {
      return style_opts.focus_font_size;
    }
    return style_opts.font_size;
  };

  return attrs;
}
