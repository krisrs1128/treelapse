
function draw_timebox(elem, width, height, values, tree) {

  var units = d3.set(values.unit).values();
  var scales = get_scales(values, width, height);

  line_data = {};
  for (var i = 0; i < units.length; i++) {
    line_data[units[i]] = get_line_data(values, units[i]);
  }

  var update_fun = timebox_update_factory(elem, width, height, values, tree);

  function button_fun() {
    new_brush(line_data, scales, update_fun, width, height);
  }

  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"), ["all_ts", "all_brushes", "nodes", "links"]);
  add_button(elem, "new box", button_fun);
  add_button(elem, "change focus", change_focus);
  timebox_update(elem, width, height, values, tree, []);
}

function timebox_update_factory(elem, width, height, values, tree) {
  function f(cur_lines) {
    timebox_update(elem, width, height, values, tree, cur_lines);
  }

  return f;
}

function brush_fun(line_data, scales, update_fun, width, height) {
  var brushes = d3.selectAll(".brush").nodes();
  if (brushes.length !== 0) {
    units = brush_intersection(
      brushes,
      Object.keys(line_data),
      scales
    );
  } else {
    units = [];
  }
  update_fun(units);
}


function timebox_update(elem, width, height, values, tree, cur_lines) {
  draw_ts(elem, values, cur_lines, width, height);
}

function new_brush(line_data, scales, update_fun, width, height) {
  var brush = d3.brush()
      .on("brush", function() {
	brush_fun(line_data, scales, update_fun, width, height);
      });

  var n_brushes = d3.selectAll(".brush").nodes().length;
  d3.select("#all_brushes")
    .append("g")
    .classed("brush", true)
    .attrs({"id": "brush-" + n_brushes})
    .call(brush);

  focus_brush(n_brushes);
}
