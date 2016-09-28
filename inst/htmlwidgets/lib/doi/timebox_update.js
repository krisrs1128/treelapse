
function draw_timebox(elem, width, height, values, tree) {

  var units = d3.set(values.unit).values();
  var scales = get_scales(values, width, height);

  line_data = {};
  for (var i = 0; i < units.length; i++) {
    line_data[units[i]] = get_line_data(values, units[i]);
  }

  var update_fun = timebox_update_factory(elem, width, height, values, tree);

  function add_fun() {
    new_brush(line_data, scales, update_fun, width, height);
  }

  function remove_fun() {
    remove_brush(line_data, scales, update_fun, width, height);
  }

  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(
    d3.select("svg"),
    ["all_ts", "all_brushes", "links", "nodes", "mouseover"]
  );
  d3.select("#mouseover")
    .append("text");

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", change_focus);
  add_button(elem, "remove box", remove_fun);
  timebox_update(elem, width, height, values, tree, []);
}

function timebox_update(elem, width, height, values, tree, cur_lines) {
  draw_ts(elem, values, cur_lines, width, height);
  draw_tree(elem, values, cur_lines, width, height, tree);
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

function remove_brush(line_data, scales, update_fun, width, height) {
  var brush_ix = 0;
  d3.selectAll(".brush").filter(
    function(d, i) {
      if(d3.select(this).attr("brush_selected") === "true") {
	brush_ix = i;
	return true;
      }
      return false;
    }).remove();

  // renumber brushes
  d3.selectAll(".brush")
    .attr("id", function(d, i) {
      return "brush-" + i;
    });

  var n_brushes = d3.selectAll(".brush").nodes().length;
  focus_brush(brush_ix % n_brushes);
  brush_fun(line_data, scales, update_fun, width, height);
}
