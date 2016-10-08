
function draw_treebox(elem, width, height, values, tree, size_min, size_max) {
  var units = d3.set(values.unit).values();
  var scales = get_scales(values, width, height, size_min, size_max);

  line_data = {};
  for (var i = 0; i < units.length; i++) {
    line_data[units[i]] = get_line_data(values, units[i]);
  }

  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(
    d3.select("svg"),
    ["all_ts", "all_brushes", "links", "nodes", "mouseover"]
  );
  d3.select("#mouseover")
    .append("text");

  add_button(elem, "new box", function() {});
  add_button(elem, "change focus", function() {});
  add_button(elem, "remove box", function() {});
}
