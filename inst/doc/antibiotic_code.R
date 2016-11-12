#! /usr/bin/env Rscript

# File description -------------------------------------------------------------
# This is the external code script accompanying the antibiotic.Rmd vignette. It
# assumes the abt data is loaded (included in the treelapse package) and then
# prepares the edgelist and values data for visualization with timeboxes and the
# DOI sankeys.

## ---- abt-data ----
data(abt)
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
    if (i %% 10 == 0) {
      cat(sprintf(
        "Computing tree stats for subject %s at time %f \n",
        subjects[j],
        times[i]
      ))
    }

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
treebox(time_data, edges, size_min = .5, size_max = 2)

## ---- timebox-means ----
timebox_tree(time_data, edges, size_min = .5, size_max = 2)

## ---- doi-sankey-data ----
condition_values <- values %>%
  left_join(conditions) %>%
  group_by(subject, unit, type, condition) %>%
  dplyr::summarise(value = mean(value))

sankey_data <- condition_values %>%
   filter(subject == cur_subject, type == "sum") %>%
   as.data.frame() %>%
   select(condition, unit, value)
colnames(sankey_data)[1] <- "group"
sankey_data$group <- gsub(" ", "", sankey_data$group)

## ## ---- doi-sankey ----
doi_sankey(sankey_data, edges, width = 4000, leaf_width = 30)
