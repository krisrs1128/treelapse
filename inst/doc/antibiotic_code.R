#! /usr/bin/env Rscript

# File description -------------------------------------------------------------
# This is the external code script accompanying the antibiotic.Rmd vignette. It
# assumes the abt data is loaded (included in the treelapse package) and then
# prepares the edgelist and values data for visualization with timeboxes and the
# DOI sankeys.

## ---- abt-data ----
abt
mapping <- sample_data(abt)
summary(mapping)

## ---- sampling-times ----
ggplot(mapping) +
  geom_tile(aes(x = time, y = ind, fill = condition)) +
  scale_fill_brewer(palette = "Set3")

## ---- skewness ----
hist(asinh(otu_table(abt)@.Data), main = "Raw RSV Counts")

## ---- abt-transform ----
abt <- abt %>%
  filter_taxa(function(x) sd(x) > 7.5, prune = TRUE) %>%
  transform_sample_counts(asinh)
abt
hist(otu_table(abt)@.Data, main = "Processed RSV Counts")

## ---- abt-values ----
tip_values <- t(otu_table(abt))@.Data

## ---- get-taxa ----
taxa <- tax_table(abt)
taxa <- gsub("_1", "", taxa)
taxa <- gsub("_2", "", taxa)
taxa <- gsub("uncultured", "", taxa)
taxa[taxa == ""] <- NA

incertae_ix <- which(taxa == "Incertae Sedis", arr.ind = TRUE)
for (parent in c("Erysipelotrichi_Erysipelotrichales", "Lachnospiraceae", "Ruminococcaceae")) {
  cur_parent_ix <- which(taxa == parent, arr.ind = TRUE)
  cur_ix <- incertae_ix[incertae_ix[, "row"] %in% cur_parent_ix[, "row"],]
  taxa@.Data[cur_ix] <- paste0("Incerate Sedis_", parent)
}

edges <- taxa_edgelist(taxa)

## ---- aggregate-tips ----
subjects <- unique(mapping$ind)
values <- list()
for (i in seq_along(subjects)) {
  cur_ix  <- mapping$ind == subjects[i]
  for (fun in c("sum", "mean")) {
    cur_fun <- get(sprintf("tree_%s", fun))
    cur_values <- tree_fun_multi(edges, tip_values[cur_ix, ], cur_fun)

    values <- c(
      values,
      list(
        data.table(
          "subject" = subjects[i],
          "type" = fun,
          "time" = mapping$time[cur_ix][cur_values$row],
          cur_values
        )
      )
    )
  }
}

values <- rbindlist(values)

## ---- prep-timebox-data ----
cur_subject <- "D"
time_data <- values %>%
  filter(subject == cur_subject, type == "sum") %>%
  select(time, unit, value) %>%
  arrange(unit, time)

## ---- timebox-mappings ----
conditions <- mapping %>%
  filter(ind == cur_subject) %>%
  select(time, condition) %>%
  unique()

## ---- timebox ----
timebox_tree(time_data, edges, size_min = 1, size_max = 10)

## ---- treebox ----
treebox(time_data, edges, size_min = 1, size_max = 10)

## ---- timebox-means-data ----
time_data <- values %>%
  filter(subject == cur_subject, type == "mean") %>%
  select(time, unit, value) %>%
  arrange(unit)

## ---- treebox-means ----
treebox(time_data, edges, size_min = .5, size_max = 10)

## ---- timebox-means ----
timebox_tree(time_data, edges, size_min = .5, size_max = 10)

## ---- doi-sankey-data ----
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

## ## ---- doi-sankey ----
doi_sankey(sankey_data, edges, width = 4000, leaf_width = 30)
