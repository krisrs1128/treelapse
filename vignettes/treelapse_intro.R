#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- setup ----
library("ape")
library("treelapse")
library("plyr")

## ---- make-edgelist ----
n_tips <- 100
tree <- rtree(n_tips)
edges <- data.frame(tree$edge)
edges <- colwise(as.character)(edges)

colnames(edges) <- c("parent", "child")
head(edges)

## ---- doi-values ----
units <- unique(c(edges$parent, edges$child))
values <- data.frame(
  "unit" = units,
  "value" = runif(n_tips + tree$Nnode)
)

## ---- doi-display-1 ----
doi_tree(values, edges, leaf_width = 50, size_min = 2)

## ---- doi-tip-values ----
# reduce to just tips
tip_values <- values %>%
  filter(unit %in% 1:n_tips)
tip_names <- tip_values$unit
tip_values <- setNames(tip_values$value, tip_names)

# aggregate tip values
summed_values <- tree_sum(edges, tip_values)
values <- data.frame(
  unit = names(summed_values),
  value = summed_values
)

## ---- doi-display-2 ----
doi_tree(values, edges, leaf_width = 50, size_min = 2)

## ---- make-sankey-data  ----

make_grouped_data <- function(n_groups, n_tips, edges) {
  grouped_values <- matrix(
    runif(n_tips * n_groups), n_tips, n_groups,
    dimnames = list(seq_len(n_tips), seq_len(n_groups))
  )

  grouped_list <- list()
  for (i in seq_len(n_groups)) {
    grouped_list[[i]] <- tree_sum(edges, grouped_values[, i])
  }

  grouped_values <- do.call(rbind, grouped_list) %>%
    melt(varnames = c("group", "unit"))
  grouped_values$unit <- as.character(grouped_values$unit)
  grouped_values$group <- as.character(grouped_values$group)
  grouped_values
}

## ---- vis-sankey-doi ----
grouped_values <- make_grouped_data(3, n_tips, edges)
doi_sankey(grouped_values, edges)

## ---- make-timebox-data ----
n_times <- 100
timebox_values <- make_grouped_data(100, n_tips, edges)
colnames(timebox_values) <- c("time", "unit", "value")

## ---- vis-timebox ----
timebox_tree(timebox_values, edges, size_min = 1)

## ---- vis-treebox ----
treebox(timebox_values, edges, size_min = 1)
