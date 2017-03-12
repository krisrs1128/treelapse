#! /usr/bin/env Rscript

## File description -------------------------------------------------------------
## Functions for adapting style in treelapse views.


#' Merge in default style opts
#'
#' Completes a partially filled list of style options.
#'
#' @export
merge_style_opts <- function(opts) {
  default_opts <- list(
    "size_min" = 0,
    "size_max" = 10,
    "font_size" = 14,
    "mouseover_font_size" = 14,
    "axis_font_size" = 14,
    "font_family" = "Roboto",
    "n_ticks_x" = 5,
    "n_ticks_y" = 5,
    "tick_size" = 6,
    "margin" = list("bottom" = 20),
    "tree_frac" = 0.43
  )
  modifyList(default_opts, opts)
}
