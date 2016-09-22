#' @title Generate a nested list representing a tree structure
#' @description This representation is easily converted to the json required by
#' d3 by using toJSON in the jsonlite package.
#' @param el [data.frame] A data.frame with names "parent" and "child", giving
#' the edgelist for the tree structure to generate. Columns called "length" or
#' "depth" will also be accepted and stored in the resulting list.
#' @param cur_node The name of the root node in the edgelist, from which to
#' start the recursive descent.
#' @return [list] A nested list whose structure reflects the edgelist in el. At
#' each level, "name" is a character string specifying the name of the root in
#' the subtree and children is a list with the same structure as the overall
#' tree. If "length" or "depth" are provided in "el", this information is stored
#' along with "name".
#' @examples
#' el <- data.frame(
#'   parent = c("1", "1", "2", "2", "3", "3"),
#'   child = c("2", "3", "4", "5", "6", "7"),
#'   stringsAsFactors = FALSE
#' )
#' tree_json(el, "1")
#' @export
tree_json <- function(el, cur_node) {
  stopifnot(
    all(c("child", "parent") %in% colnames(el))
  )

  cur_ix <- which(el$parent == cur_node)
  children <- el[cur_ix, "child"]

  if (length(children) == 0) {
    res <- list("name" = cur_node)
  } else {
    sublist <- list()
    for (i in seq_along(children)) {
      sublist[[i]] <- tree_json(el, children[i])
      sublist[[i]]$length <- el[cur_ix[i], "length"]
      sublist[[i]]$depth <- el[cur_ix[i], "depth"]
    }
    res <- list(
      "name" = cur_node,
      "children" = sublist
    )
  }
  res
}

#' @param Get Edgelist from Tax Table
#' @importFrom dplyr %>% arrange
#' @importFrom zoo na.locf
taxa_edgelist <- function(taxa) {
  taxa <- cbind(taxa, OTU = rownames(taxa))

  for (i in seq_len(nrow(taxa))) {
    taxa[i, ] <- na.locf(taxa[i, ])
  }

  el  <- list()
  for (j in seq_len(ncol(taxa) - 1)) {
    cur_el  <- data.frame(
      parent = taxa[, j],
      child = taxa[, j + 1],
      stringsAsFactors = FALSE
    )

    # discard self-loops introduced by na.locf
    cur_el <- cur_el[cur_el$parent != cur_el$child, ]
    el[[j]] <- unique(cur_el)
  }

  do.call(rbind, el) %>%
    arrange(parent, child)
}
