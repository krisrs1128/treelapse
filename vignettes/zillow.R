#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- setup ----

library("data.table")
library("plyr")
library("dplyr")
library("treelapse")
zillow <- fread("~/Desktop/Neighborhood_Zhvi_AllHomes.csv") %>%
  filter(State == "CA") %>%
  as.data.table()
zillow$RegionID <- paste0(zillow$RegionID, "_", zillow$RegionName)

zillow_impute <- zillow[, 8:ncol(zillow), with = F] %>%
  as.matrix() %>%
  apply(1, function(x) { na.locf(x, fromLast = T)}) %>%
  t()

zillow[, 8:ncol(zillow)] <- data.table(zillow_impute)

## ---- get-edges ----
region_scales <- c(
  "State",
  "Metro",
  "CountyName",
  "City",
#  "RegionName",
  "RegionID"
)
paths <- zillow[, region_scales, with = F] %>%
  as.matrix()
head(paths)
paths[, "CountyName"] <- paste0("Cn:", paths[, "CountyName"])
paths[, "Metro"] <- paste0("M:", paths[, "Metro"])
paths[, "City"] <- paste0("Ci:", paths[, "City"])

for (i in seq_len(nrow(paths))) {
  if (any(paths[i, ] == "")) {
    last_nonempty <- min(which(paths[i, ] == "")) - 1
    paths[i, paths[i, ] == ""] <- paths[i, last_nonempty]
  }
}

edges <- taxa_edgelist(paths)
edges <- rbind(
  edges,
  data.frame(
    "parent" = "root",
    "child" = setdiff(edges[, 1], edges[, 2])
  )
)

## ---- get-values ----
tip_values <- zillow %>%
  select(RegionID, starts_with("19"), starts_with("20")) %>%
  as.data.frame()

grouped_list <- list()
for (i in seq_len(ncol(tip_values) - 1)) {
  cat(sprintf("Processing month %d\n", i))
  cur_values <- setNames(tip_values[, i + 1], tip_values[, 1])
  grouped_list[[i]] <- tree_mean(edges, log(cur_values))
}

values <- do.call(rbind, grouped_list) %>%
  melt(varnames = c("time", "unit"))

## ---- timebox-trees ----
timebox_tree(values, edges, size_max = 4)
treebox(values, edges, size_max = 4)
