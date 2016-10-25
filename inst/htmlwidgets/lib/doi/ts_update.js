function setup_tree_ts(elem, width, height, values, tree, scales) {
  var units = d3.set(values.unit).values();
  line_data = {};
  for (var i = 0; i < units.length; i++) {
    line_data[units[i]] = get_line_data(values, units[i]);
  }

  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(
    d3.select(elem).select("svg"),
    ["all_ts"]
  );

  d3.select(elem)
    .select("svg")
    .append("rect")
    .attrs({
      "id": "tree_backdrop",
      "height": 0.43 * height,
      "width": width,
      "fill": "#F7F7F7"
    });

  setup_groups(
    d3.select(elem).select("svg"),
    ["zoom_ts", "links", "nodes", "all_brushes", "mouseover"]
  );

  d3.select(elem)
    .select("#mouseover")
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
      elem,
      line_data,
      scales,
      update_fun,
      brush_extent,
      brush_nodes_union
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_nodes_union
    );
  }

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
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

  var zoom_brush = d3.brush()
      .on("brush", function() {
	cur_extent = d3.brushSelection(
	  d3.select("#zoom_ts").select(".zoom_brush").node()
	);
	scales.x.domain(
	  [scales.zoom_x.invert(cur_extent[0][0]),
	   scales.zoom_x.invert(cur_extent[1][0])]
	);
	scales.y.domain(
	  [scales.zoom_y.invert(cur_extent[1][1]),
	   scales.zoom_y.invert(cur_extent[0][1])]
	);
	update_fun([], scales);
      })
      .extent([[0.8 * width, 0], [width, 0.37 * height]]);

  console.log(zoom_brush);
  d3.select("#zoom_ts")
    .append("g")
    .classed("zoom_brush", "true")
    .call(zoom_brush);

  var brush_extent = [[0, 0.43 * height], [width, height]];

  function add_fun() {
    new_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_extent,
      brush_ts_intersection
    );
  }

  function remove_fun() {
    remove_brush(
      elem,
      line_data,
      scales,
      update_fun,
      brush_ts_intersection
    );
  }

  add_button(elem, "new box", add_fun);
  add_button(elem, "change focus", function() { return change_focus(elem); });
  add_button(elem, "remove box", remove_fun);
  timebox_update(elem, values, tree, [], scales);
}

function timebox_update(elem, values, tree, cur_lines, scales) {
  draw_zoom(elem, values, cur_lines, scales);
  draw_ts(elem, values, cur_lines, scales, false);
  draw_tree(elem, values, cur_lines, tree, scales, true);
}

function update_factory(base_fun, elem, values, tree, cur_lines, cur_scales) {
  function f(cur_lines, cur_scales) {
    base_fun(elem, values, tree, cur_lines, cur_scales);
  }

  return f;
}

function treebox_update(elem, values, tree, cur_lines, scales) {
  draw_ts(elem, values, cur_lines, scales, true);
  draw_tree(elem, values, cur_lines, tree, scales, false);
}

function brush_fun(elem, line_data, scales, update_fun, combine_fun) {
  var brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes();
  if (brushes.length !== 0) {
    units = combine_fun(
      elem,
      brushes,
      scales
    );
  } else {
    units = [];
  }
  console.log(scales.x.domain())
  update_fun(units, scales);
}

function new_brush(elem, line_data, scales, update_fun, extent, combine_fun) {
  var brush = d3.brush()
      .on("brush", function() {
	brush_fun(
	  elem,
	  line_data,
	  scales,
	  update_fun,
	  combine_fun
	);
      })
      .extent(extent);

  var n_brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes().length;
  d3.select(elem)
    .select("#all_brushes")
    .append("g")
    .classed("brush", true)
    .attrs({"id": "brush-" + n_brushes})
    .call(brush);

  focus_brush(elem, n_brushes);
}

function remove_brush(elem, line_data, scales, update_fun, combine_fun) {
  var brush_ix = 0;
  d3.select(elem)
    .selectAll(".brush").filter(
    function(d, i) {
      if(d3.select(this).attr("brush_selected") === "true") {
	brush_ix = i;
	return true;
      }
      return false;
    }).remove();

  // renumber brushes
  d3.select(elem)
    .selectAll(".brush")
    .attr("id", function(d, i) {
      return "brush-" + i;
    });

  var n_brushes = d3.select(elem)
      .selectAll(".brush")
      .nodes().length;
  focus_brush(elem, brush_ix % n_brushes);
  brush_fun(
    elem,
    line_data,
    scales,
    update_fun,
    combine_fun
  );
}
