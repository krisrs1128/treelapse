#' Create Timebox Trees
#'
#' Timebox trees provide a way of linking time series and tree views, where
#' selections are made along the time series.
#' 
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#' @importFrom dplyr arrange select left_join group_by summarise
#' @importFrom magrittr %>%
#' @export
#' @examples
#' data(sim_edges)
#' data(sim_data)
#' display_opts <- list("size_min" = 1)
#' timebox_tree(sim_data, sim_edges, display_opts = display_opts)
timebox_tree <- function(values,
                         edges,
                         width = NULL,
                         height = NULL,
                         display_opts = list()) {
  root <- get_root(edges)
  edges <- edges %>%
    merge_edge_values(values)

  # forward options using x
  x <- list(
    values,
    root,
    edges,
    merge_timebox_style(display_opts)
  )

  # create widget
  htmlwidgets::createWidget(
    name = "timebox_tree",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}

#' @export
timebox_tree_output <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "timebox_tree", width, height, package = "treelapse")
}

#' @export
render_timebox_tree <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, timebox_tree_output, env, quoted = TRUE)
}

