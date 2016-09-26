
function draw_timebox(elem, width, height, values, tree) {
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"), ["all_ts", "all_brushes", "nodes", "links"]);
  timebox_update(elem, width, height, values, tree);
}

function timebox_update(elem, width, height, values, tree) {
  draw_ts(elem, values, ["Bacteria", "P:Firmicutes"], width, height);
}
