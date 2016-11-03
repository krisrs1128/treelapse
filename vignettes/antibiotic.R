#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- setup ----
library("phyloseq")
library("plyr")
library("dplyr")
library("treelapse")
data(abt)

## ---- timebox ----
abt <- abt %>%
  filter_taxa(function(x) sd(x) > 10, prune = TRUE) %>%
  transform_sample_counts(asinh)

tip_values <- t(otu_table(abt))@.Data
mapping <- sample_data(abt)

## ---- get-taxa ----
taxa <- tax_table(abt)
taxa <- gsub("_1", "", taxa)
taxa <- gsub("_2", "", taxa)
taxa <- gsub("uncultured", "", taxa)
taxa[taxa == ""] <- NA
edges <- taxa_edgelist(taxa)

## ---- aggregate-tips ----
times <- unique(mapping$time)
subjects <- unique(mapping$ind)
values <- data.frame(
  subject = character(0),
  time = numeric(0),
  type = character(0),
  unit = character(0),
  value = numeric(0)
)

for (i in seq_along(times)) {
  for (j in seq_along(subjects)) {
    cat(sprintf(
      "Computing tree stats for subject %s at time %f \n",
      subjects[j],
      times[i]
    ))

    cur_ix <- mapping$time == times[i] & mapping$ind == subjects[j]
    if (!any(cur_ix)) next

    cur_tips <- setNames(tip_values[cur_ix, ], colnames(tip_values))
    cur_sums <- tree_sum(edges, cur_tips)
    values <- rbind(
      values,
      data.frame(
        "subject" = subjects[j],
        "time" = times[i],
        "type" = "sum",
        "unit" = names(cur_sums),
        "value" = cur_sums
      )
    )

    cur_means <- tree_mean(edges, cur_tips)
    values <- rbind(
      values,
      data.frame(
        "subject" = subjects[j],
        "time" = times[i],
        "type" = "mean",
        "unit" = names(cur_means),
        "value" = cur_means
      )
    )
  }
}

## ---- prep-timebox-data ----
cur_subject <- "D"
time_data <- values %>%
  filter(subject == cur_subject, type == "sum") %>%
  select(time, unit, value) %>%
  arrange(unit)

## ---- timebox-mappings ----
conditions <- mapping %>%
  filter(ind == cur_subject) %>%
  select(time, condition) %>%
  unique()
conditions

## ---- treebox ----
treebox(time_data, edges, size_min = 1, size_max = 10)

## ---- timebox ----
timebox_tree(time_data, edges, size_min = 1, size_max = 10)

## ---- timebox-means-data ----
time_data <- values %>%
  filter(subject == cur_subject, type == "mean") %>%
  select(time, unit, value) %>%
  arrange(unit)

## ---- treebox-means ----
treebox(time_data, edges, size_min = .5, size_max = 2)

## ---- timebox-means ----
timebox_tree(time_data, edges, size_min = .5, size_max = 2)

## ---- doi-sankey ----
condition_values <- values %>%
  left_join(conditions) %>%
  group_by(subject, unit, type, condition) %>%
  summarise(value = mean(value))

sankey_data <- condition_values %>%
  filter(subject == cur_subject, type == "sum") %>%
  as.data.frame() %>%
  select(condition, unit, value)
colnames(sankey_data)[1] <- "group"
sankey_data$group <- gsub(" ", "", sankey_data$group)

doi_sankey(sankey_data, edges, width = 4000, leaf_width = 30)
values <- sankey_data
