#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- setup ----

library("data.table")
library("plyr")
library("dplyr")
library("treelapse")
zillow <- fread("~/Desktop/Neighborhood_Zhvi_AllHomes.csv") %>%
  head(100) %>%
  filter(!(RegionID %in% c("51128", "194430"))) %>%
  as.data.table()
zillow$RegionID <- paste0("region_", zillow$RegionID)
zillow$CountyName <- make.unique(zillow$CountyName)
zillow$Metro <- make.unique(zillow$Metro)
zillow$City <- make.unique(zillow$City)
zillow$RegionName <- make.unique(zillow$RegionName)

## ---- get-edges ----
region_scales <- c(
  "State",
  "CountyName",
  "Metro",
  "City",
  "RegionName",
  "RegionID"
)
paths <- zillow[, region_scales, with = F] %>%
  as.matrix()
head(paths)
paths[, "CountyName"] <- paste0("Cn:", paths[, "CountyName"])
paths[, "Metro"] <- paste0("M:", paths[, "Metro"])
paths[, "City"] <- paste0("Ci:", paths[, "City"])
paths[, "RegionName"] <- paste0("R:", paths[, "RegionName"])

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
#  select(RegionID, starts_with("1996")) %>%
  as.data.frame()
tip_values[is.na(tip_values)] <- median(tip_values[, -1] %>% unlist(), na.rm = T)

grouped_list <- list()
for (i in seq_len(ncol(tip_values) - 1)) {
  cat(sprintf("Processing month %d\n", i))
  cur_values <- setNames(tip_values[, i + 1], tip_values[, 1])
  grouped_list[[i]] <- tree_mean(edges, log(1 + cur_values))
}

#names(grouped_list) <- colnames(tip_values)[-1]
values <- do.call(rbind, grouped_list) %>%
  melt(varnames = c("time", "unit"))

## ---- timebox-trees ----
timebox_tree(values, edges, size_max = 4)

head(values)
