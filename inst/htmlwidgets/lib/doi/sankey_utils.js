
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

function edge_centers(x_pos, values, scale) {
  reshaped_values = values.unit.map(function(unit, i) {
    return {
      "unit": unit,
      "group": values.group[i],
      "value": values.value[i]
    };
  });

  centers = [];
  for (var i = 0; i < x_pos.length; i++) {
    var widths = reshaped_values
	.filter(function(d) {
	  return d.unit == x_pos[i].unit;
	})
	.map(function(d) {
	  return {
	    "group": d.group,
	    "width": scale(d.value)
	  };
	});

    var cur_coords = offset_x(
      x_pos[i].x,
      widths.map(function(d) { return d.width; })
    );

    for (var j = 0; j < cur_coords.length; j++) {
      centers.push({
	"unit": x_pos[i].unit,
	"group": widths[j].group,
	"x": cur_coords[j],
	"width": widths[j].width
      });
    }
  }

  return centers;
}

function sankey_link_attrs(values, scales, group, centers) {
  var attrs = link_attr_defaults();
  attrs.opacity = 0.1;
  attrs.stroke = scales.fill(group);

  attrs.d = function(d) {
    var target_center = centers
	.filter(function(center) {
	  return center.unit == d.target.data.name && center.group == group;
	})[0]
	.x;

    var source_center = centers
	.filter(function(center) {
	  return center.unit == d.source.data.name && center.group == group;
	})[0]
	.x;

    return "M" + target_center + "," + d.target.y +
      "C" + target_center + "," + (d.target.y + d.source.y) / 2 +
      " " + source_center + "," +  (d.target.y + d.source.y) / 2 +
      " " + source_center + "," + d.source.y;
  };

  attrs["stroke-width"] = function(d) {
    return centers
      .filter(function(center) {
	return center.unit == d.target.data.name && center.group == group;
      })[0]
      .width;
  };

  return attrs;
}
