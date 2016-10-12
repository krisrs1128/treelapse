# treelapse

This is an R package for interactive visualization of tree structured
data. Motivated by the problem of describing abundances (and time series of
abundances) across evolutionarily related microbes, we designed
representations inspired by literature in the Data Visualization community.

## Installation ##

First, install the `devtools` package. Then you can get `treelapse` using

```r
devtools::install_github("krisrs1128/treelapse", build_vignettes = TRUE)
```

The `build_vignettes` argument makes sure the vignettes can be viewed
immediately after installation.

## Examples ##

To open vignettes, run

```r
devtools::build_vignettes("krisrs1128/treelapse", )

library("treelapse")
vignette("treelapse")
```

## Contact ##

We need your help to improve this package. For bug reports and feature
requests, either create an issue on github or
[email me](mailto:kriss1@stanford.edu).
