function get_scales(values, width, height) {
  return {
    "x": d3.scaleLinear()
      .domain(d3.extent(values.time))
      .range([0, width]),
    "y": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([height, 0.4 * height])
  };
}


function draw_ts(elem, values, cur_lines, width, height) {
  var units = d3.set(values.unit).values();
  var ts_selection = d3.select("#all_ts")
      .selectAll(".ts_line")
      .data(units);

  ts_selection.exit().remove();

  var scales = get_scales(values, width, height);
  var line_fun = d3.line()
      .x(function(d) { return scales.x(d.time); })
      .y(function(d) { return scales.y(d.value); });

  ts_selection.enter()
    .append("path")
    .classed("ts_line", true)
    .attrs({
      "fill": "none",
      "stroke": "#303030",
      "stroke-width": 0,
      "d": function(d) {
	return line_fun(
	  get_line_data(values, d)
	);
      }
    });

  d3.selectAll(".ts_line").transition()
    .duration(700)
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
	return 0.1;
      },
      "alpha": function(d) {
	if(cur_lines.indexOf(d) != -1) {
	  return 0.8;
	}
	return 0.05;
      }
    });

}

function timebox_link_attrs(values, cur_lines) {
  var attr_funs = link_attr_defaults();

  attr_funs.fill = function(d) {
    if (cur_lines.indexOf(d.target.data.name[0]) != -1) {
      return "#2D869F";
    }
    return "#696969";
  };

  return attr_funs;
}

function timebox_node_attrs(values, cur_lines) {
  var attr_funs = node_attr_defaults();

  attr_funs.fill = function(d) {
    if (cur_lines.indexOf(d.data.name[0]) != -1) {
      return "#2D869F";
    }
    return "#696969";
  };

  return attr_funs;
}

function draw_tree(elem, values, cur_lines, width, height, tree) {
  var hierarchy = d3.hierarchy(tree);
  var cluster = d3.cluster()
      .size([width, 0.37 * height]);
  var layout = cluster(hierarchy);

  // draw links
  tree_links_base(
    d3.select("#links"),
    layout.links(),
    "tree_link",
    timebox_link_attrs(values, cur_lines)
  );

  // draw nodes
  tree_nodes_base(
    d3.select("#nodes"),
    layout.descendants(),
    "tree_node",
    timebox_node_attrs(values, cur_lines)
  );


}

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

function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        if (b.indexOf(e) !== -1) return true;
    });
}

function point_in_box(point, box_extent) {
  return (point.time >= box_extent.time_min) &&
    (point.time <= box_extent.time_max) &&
    (point.value >= box_extent.value_min) &&
    (point.value <= box_extent.value_max);
}

function line_in_box(line_data, box_extent) {
  for (var i = 0; i < line_data.length; i++) {
    var cur_check = point_in_box(line_data[i], box_extent);
    if (cur_check) {
      return true;
    }
  }
  return false;
}

function lines_in_box(line_data, box_extent) {
  var contained_ids = [];
  for (var line_id in line_data) {
    if (line_in_box(line_data[line_id], box_extent)) {
      contained_ids.push(line_id);
    }
  }
  return contained_ids;
}

function brush_intersection(brushes, units, scales) {
    for (var i = 0; i < brushes.length; i++) {
      var box_extent = d3.brushSelection(brushes[i]);
      box_extent = {
	"time_min": scales.x.invert(box_extent[0][0]),
	"value_min": scales.y.invert(box_extent[1][1]),
	"time_max": scales.x.invert(box_extent[1][0]),
	"value_max": scales.y.invert(box_extent[0][1])
      };

      units = intersect(
	units,
	lines_in_box(line_data, box_extent)
      );

    }
  return units;
}

function focus_brush(brush_ix) {
  d3.selectAll(".brush")
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
  d3.selectAll(".brush > rect")
    .attrs({
      "pointer-events": function(d) {
	return d3.select(this.parentNode)
	  .attr("pointer-events");
      }
    });
}

function change_focus() {
  var brushes = d3.selectAll(".brush").nodes();

  var brush_ix = 0;
  for (var i = 0; i < brushes.length; i++) {
    var value = brushes[i].attributes.brush_selected.value;
    if(value === "true") {
      brush_ix = i;
    }
  }

  brush_ix = (brush_ix + 1) % brushes.length;
  focus_brush(brush_ix);
}
