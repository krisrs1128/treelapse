
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
