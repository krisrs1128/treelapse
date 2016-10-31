## ---- setup ----
library("treelapse")
library("phyloseq")
data(GlobalPatterns)

GPr <- transform_sample_counts(GlobalPatterns, function(x) asinh(x))
GPfr <- filter_taxa(GPr, function(x) sd(x) > 2.8, TRUE)
taxa <- taxa_edgelist(tax_table(GPfr))

values <- tree_sum(
  data.frame(taxa),
  apply(otu_table(GPfr)@.Data, 1, mean)
)

values <- data.frame(
  unit = names(values),
  value = values,
  stringsAsFactors = FALSE
)

## ---- visualize ----
devtools::install()
doi_tree(values, taxa, "Bacteria", "Bacteria", 1100, 500,
         leaf_width = 35, leaf_height = 75, size_max = 20,
         size_min = 1.5)
