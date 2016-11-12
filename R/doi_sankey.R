#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom magrittr %>%
#' @importFrom dplyr arrange select left_join group_by summarise
#' @importFrom jsonlite toJSON
#' @export
doi_sankey <- function(values,
                       edges,
                       focus_node_id = NULL,
                       width = NULL,
                       height = NULL,
                       size_max = 20,
                       leaf_width = 10,
                       leaf_height = 100) {
  root <- get_root(edges)
  if (is.null(focus_node_id)) {
    focus_node_id  <- root
  }

  edges <- edges %>%
    merge_edge_values(values)

  # forward options using x
  x <- list(
    values,
    edges,
    root,
    focus_node_id,
    size_max,
    leaf_width,
    leaf_height
  )

  # create widget
  htmlwidgets::createWidget(
    name = "doi_sankey",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}
