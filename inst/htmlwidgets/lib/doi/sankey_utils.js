
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

function edge_centers(x_pos,
		      edgelist,
		      values,
		      scale,
		      center_type) {
  reshaped_values = values.unit.map(function(unit, i) {
    return {
      "unit": unit,
      "group": values.group[i],
      "value": values.value[i]
    };
  });

  centers = [];
  for (var i = 0; i < x_pos.length; i++) {
    if (center_type == "target") {
      var cur_targets = edgelist
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

function sankey_link_attrs(values,
			   scales,
			   group,
			   centers,
			   tree,
			   search_str) {
  var attrs = link_attr_defaults();
  attrs.opacity = 0.1;
  attrs.stroke = scales.fill(group);

  attrs.d = function(d) {

    // targets need to be based on overall abundance of edge flowing in, not
    // widths of each descendant edge
    var target_center = centers.source
	.filter(function(center) {
	  return (center.target == d.target.data.name) &&
	    (center.group == group);
	})[0].x;

    // sources need to be based abundances of edges flowing out
    var source_center = centers.target
	.filter(function(center) {
	  return (center.source == d.source.data.name) &&
	    (center.group == group) &&
	    (center.target == d.target.data.name);
	})[0].x;

    return "M" + target_center + "," + d.target.y +
      "C" + target_center + "," + (d.target.y + d.source.y) / 2 +
      " " + source_center + "," +  (d.target.y + d.source.y) / 2 +
      " " + source_center + "," + d.source.y;
  };

  attrs["stroke-width"] = function(d) {
    return centers.source
      .filter(function(center) {
	return (center.group == group) &&
	  (center.target == d.target.data.name);
      })[0].width;
  };


  attrs["stroke-opacity"] = function(d) {
    var cur_tree = tree.get_subtree(d.target.data.name);
    if (cur_tree.contains_partial_match(search_str)) {
      return 0.8;
    }
    return 0.2;
  };

  return attrs;
}

function sankey_text_attrs(values, scales) {
  var attrs = text_attr_defaults();

  attrs.x = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.name
    );

    return d.x + 0.5 * scales.size(d3.sum(cur_values)) + 5;
  };

  attrs.y = function(d) { return d.y; };

  attrs.fill = "#474747";

  attrs.text = function(d) {
    if (d.data.doi >= -1) {
      return d.data.name;
    }
  };

  attrs["font-size"] = function(d) {
    if (d.data.doi === 0) {
      return 20;
    }
    return 10;
  };

  return attrs;
}
