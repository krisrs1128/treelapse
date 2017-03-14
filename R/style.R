#! /usr/bin/env Rscript

## File description -------------------------------------------------------------
## Functions for adapting style in treelapse views.


#' Merge in default style for timebox trees / treeboxes
#'
#' Completes a partially filled list of style options.
#'
#' @export
merge_timebox_style<- function(opts) {
  default_opts <- list(
    "size_min" = 1,
    "size_max" = 10,
    "mouseover_font_size" = 15,
    "axis_font_size" = 13,
    "font_family" = "Roboto",
    "n_ticks_x" = 4,
    "n_ticks_y" = 4,
    "tick_size" = 6,
    "scent_frac" = list("width" = 0.15, "height" = 0.2),
    "margin" = list(
      "bottom" = 30,
      "top" = 20,
      "ts_right" = 30,
      "ts_left" = 30,
      "tree_right" = 15,
      "tree_left" = 15
    ),
    "tree_frac" = 0.43
  )
  modifyList(default_opts, opts)
}

#' Merge in default style for doi tree / sankey
#'
#' Completes a partially filled list of style options.
#'
#' @export
merge_doi_style <- function(opts) {
  default_opts <- list(
    "size_min" = 0,
    "size_max" = 20,
    "leaf_width" = 10,
    "leaf_height" = 100,
    "focus_font_size" = 20,
    "font_size" = 10,
    "text_offset" = 0.5
    "text_display_neighbors" = 1
  )
  modifyList(default_opts, opts)
}
