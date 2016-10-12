# treelapse

This is an R package for interactive visualization of counts and time series
arranged along trees. Motivated by the problem of describing abundances of
evolutionarily related microbes, we designed representations inspired by
literature in the Data Visualization community.

## Installation ##

First, install the `devtools` package. Then you can get `treelapse` using

```r
devtools::install_github("krisrs1128/treelapse", build_vignettes = TRUE)
```

The `build_vignettes` argument makes sure the vignettes can be viewed
immediately after installation. This will make it take longer to install,
(it should finish in less than 2 minutes though), but makes it easy to see
examples.

## Examples ##

To list the available vignettes, run

```r
browseVignettes("treelapse")
```

`treelapse` currently supports three kinds displays

* DOI Trees: Navigate large trees according to the Degree-of-Interest (DOI)
defined by clicking on different nodes.
* DOI Sankeys: Create a DOI Tree where abundances are split across several
groups.
* Timeboxes: Visually query a (tree-structured) collection of time series, and
see which nodes are associated with selected series.
* Treeboxes: The converse of timeboxes -- select nodes and see which series are
associated.

It also includes a few utilities for structuring data into the required form.

* `tree_sum()`: Aggregate counts from leaves to internal nodes, given a tree
structure.
* `taxa_edgelist()`: Create an edgelist from a taxonomic tables whose columns
are different levels in the hierarchy and rows are leaves. The `ij`th element
is leaf `i`'s ancestors at level `j`.

## References ##

The essential ideas behind the visualization in this package come from these
papers.

* Heer, Jeffrey, and Stuart K. Card. “DOITrees Revisited: Scalable, Space-Constrained Visualization of Hierarchical Data.” Proceedings of the Working Conference on Advanced Visual Interfaces, ACM, 2004, pp. 421–424.
* Hochheiser, Harry, and Ben Shneiderman. “Visual Queries for Finding Patterns in Time Series Data.” University of Maryland, Computer Science Dept. Tech Report, CS-TR-4365, 2002.
* Gómez, John Alexis Guerra, et al. “TreeVersity: Comparing Tree Structures by Topology and Node’s Attributes Differences.” Visual Analytics Science and Technology (VAST), 2011 IEEE Conference on, IEEE, 2011, pp. 275–276.
* Guerra-Gómez, John Alexis, et al. “Visualizing Change over Time Using Dynamic Hierarchies: TreeVersity2 and the StemView.” IEEE Transactions on Visualization and Computer Graphics, vol. 19, no. 12, IEEE, 2013, pp. 2566–2575.

The implementation hinges heavily on these (very nice) tools,
* [https://d3js.org/](d3)
* [http://www.htmlwidgets.org/](htmlwidgets)

## Contact ##

We need your help to improve this package. For bug reports and feature
requests, either create an issue on github or
[email me](mailto:kriss1@stanford.edu).
