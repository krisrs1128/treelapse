#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#' @export
timebox_tree <- function(values,
                         edges,
                         root = NULL,
                         width = NULL,
                         height = NULL,
                         size_min = 0,
                         size_max = 10
                         ) {
  if (is.null(root)) {
    root  <- edges[1, 1]
  }

  # forward options using x
  x <- list(
    values,
    toJSON(tree_json(edges, root)),
    size_min,
    size_max
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
