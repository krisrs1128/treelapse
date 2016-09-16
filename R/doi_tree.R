#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#' @export
doi_tree <- function(values, edges, root = NULL, width = NULL, height = NULL) {
  if (is.null(root)) {
    root  <- edges[1, 1]
  }

  # forward options using x
  x <- list(
    values,
    toJSON(tree_json(edges, root))
  )

  # create widget
  htmlwidgets::createWidget(
    name = "doi_tree",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}
