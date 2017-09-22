#' Create treeboxes
#'
#' Treeboxes provide a way of linking time series and tree views, where
#' selections are made along the tree.
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#' @importFrom dplyr arrange select left_join group_by summarise
#' @importFrom magrittr %>%
#' @export
#' @examples
#' data(sim_edges)
#' data(sim_data)
#' display_opts <- list("size_min" = 1)
#' treebox(sim_data, sim_edges, display_opts = display_opts)
treebox <- function(values,
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
    merge_timebox_display(display_opts)
  )

  # create widget
  htmlwidgets::createWidget(
    name = "treebox",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}

#' @export
treebox_output <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "treebox", width, height, package = "treelapse")
}

#' @export
render_treebox <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, treebox_output, env, quoted = TRUE)
}
