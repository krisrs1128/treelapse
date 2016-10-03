#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#' @export
doi_sankey <- function(values,
                       edges,
                       focus_node_id = NULL,
                       root = NULL,
                       width = NULL,
                       height = NULL,
                       size_max = 20) {
  if (is.null(focus_node_id)) {
    focus_node_id  <- edges[1, 1]
  }
  if (is.null(root)) {
    root  <- edges[1, 1]
  }

  # forward options using x
  x <- list(
    values,
    toJSON(tree_json(edges, root)),
    focus_node_id,
    size_max
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
