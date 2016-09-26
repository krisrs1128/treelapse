
function draw_ts(elem, values, cur_lines, width, height) {
  var units = d3.set(values.unit).values();
  var ts_selection = d3.select("#all_ts")
      .selectAll(".ts_line")
      .data(units);

  ts_selection.exit().remove();

  var scales = {
    "x": d3.scaleLinear()
      .domain(d3.extent(values.time))
      .range([0, width]),
    "y": d3.scaleLinear()
      .domain(d3.extent(values.value))
      .range([height, 0.4 * height])
  };

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
	var cur_times = get_matching_subarray(
	  values.time,
	  values.unit,
	  d
	);

	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d
	);

	var cur_data = cur_times.map(function (e, i) {
	  return {"time": e, "value": cur_values[i]};
	});

	return line_fun(cur_data);
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
