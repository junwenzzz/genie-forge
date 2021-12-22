# Genie-Forge


## Facility Management Assistant

This repository contains the standalone version of Genie, the end user programmable
assistant. It is a single-user version, suitable for running on home servers and
smart speakers.

Genie is a research project from the Stanford University Open Virtual Assistant Lab.
You can find more information at <https://oval.cs.stanford.edu>.

## Running Genie standalone

The recommended way to run Genie is through VS code.

## Development setup

To develop genie-server, you should clone this repository, then install the dependencies with:

You can then build the repository with:
```
npm ci
```

This will only install the minimal set of dependencies, and will not install any voice support. To enable voice, you must also install [genie-client-cpp](https://github.com/stanford-oval/genie-client-cpp).
