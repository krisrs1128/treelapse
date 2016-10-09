function setup_tree_ts(elem, width, height, values, tree, scales) {
  var units = d3.set(values.unit).values();
  line_data = {};
  for (var i = 0; i < units.length; i++) {
    line_data[units[i]] = get_line_data(values, units[i]);
  }

  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(
    d3.select("svg"),
    ["all_ts", "links", "nodes", "all_brushes", "mouseover"]
  );

  d3.select("#mouseover")
    .append("text");
  return line_data;
}

function draw_treebox(elem, width, height, values, tree, size_min, size_max) {
  var scales = get_scales(values, 0.9 * width, height, size_min, size_max);
  var line_data = setup_tree_ts(elem, width, height, values, tree, scales);

  var update_fun = update_factory(
    treebox_update,
    elem,
    values,
    tree,
    [],
    scales
  );

  var brush_extent = [[0, 0], [width, 0.39 * height]];

  function add_fun() {
    new_brush(
      line_data,
      scales,
      update_fun,
      brush_extent,
      brush_nodes_union
    );
  }

  function remove_fun() {
    remove_brush(
      line_data,
      scales,
      update_fun,
      brush_nodes_union
    );
  }

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", change_focus);
  add_button(elem, "remove box", remove_fun);
  treebox_update(elem, values, tree, [], scales);
}

function draw_timebox(elem, width, height, values, tree, size_min, size_max) {
  var scales = get_scales(values, width, height, size_min, size_max);
  var line_data = setup_tree_ts(elem, width, height, values, tree, scales);
  var update_fun = update_factory(
    timebox_update,
    elem,
    values,
    tree,
    [],
    scales
  );

  var brush_extent = [[0, 0.43 * height], [width, height]];

  function add_fun() {
    new_brush(
      line_data,
      scales,
      update_fun,
      brush_extent,
      brush_ts_intersection
    );
  }

  function remove_fun() {
    remove_brush(
      line_data,
      scales,
      update_fun,
      brush_ts_intersection
    );
  }

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", change_focus);
  add_button(elem, "remove box", remove_fun);
  timebox_update(elem, values, tree, [], scales);
}

function timebox_update(elem, values, tree, cur_lines, scales) {
  draw_ts(elem, values, cur_lines, scales, false);
  draw_tree(elem, values, cur_lines, tree, scales, true);
}

function update_factory(base_fun, elem, values, tree, cur_lines, scales) {
  function f(cur_lines) {
    base_fun(elem, values, tree, cur_lines, scales);
  }

  return f;
}

function treebox_update(elem, values, tree, cur_lines, scales) {
  draw_ts(elem, values, cur_lines, scales, true);
  draw_tree(elem, values, cur_lines, tree, scales, false);
}

function brush_fun(line_data, scales, update_fun, combine_fun) {
  var brushes = d3.selectAll(".brush").nodes();
  if (brushes.length !== 0) {
    units = combine_fun(
      brushes,
      Object.keys(line_data),
      scales
    );
  } else {
    units = [];
  }
  update_fun(units);
}

function new_brush(line_data, scales, update_fun, extent, combine_fun) {
  var brush = d3.brush()
      .on("brush", function() {
	brush_fun(
	  line_data,
	  scales,
	  update_fun,
	  combine_fun
	);
      })
      .extent(extent);

  var n_brushes = d3.selectAll(".brush").nodes().length;
  d3.select("#all_brushes")
    .append("g")
    .classed("brush", true)
    .attrs({"id": "brush-" + n_brushes})
    .call(brush);

  focus_brush(n_brushes);
}

function remove_brush(line_data, scales, update_fun, combine_fun) {
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
  brush_fun(
    line_data,
    scales,
    update_fun,
    combine_fun
  );
}
