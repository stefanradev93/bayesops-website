# Recorded BayesFlow ecosystem demo

The product page plays back real Lotka–Volterra simulations and actual posterior
inference from a trained BayesFlow `ContinuousApproximator` with a four-layer
`CouplingFlow`. The site needs no Python runtime, API, or inference server.

The published artifact is `content/demos/bayesflow-lotka-volterra.json`.
It includes trajectories, noisy observations, three recorded examples, posterior
means and empirical 90% intervals, 128 held-out recovery records for each rate,
randomized posterior ranks, and a model fingerprint with the training settings.
The local checkpoint and training history are kept in the ignored directory
`.cache/bayesflow-training/` and are not included in the static site.

## Model and observation process

With prey `x` and predators `y`:

```text
dx/dt = alpha*x - beta*x*y
dy/dt = -gamma*y + delta*x*y
```

All four rates have independent Uniform(0.5, 1.5) priors. Initial populations are
fixed at (1.5, 0.5). Both species are observed at 81 equally spaced times from 0
to 20, with independent multiplicative lognormal noise (log standard deviation
0.12). The inference network sees only the logged observations in time order.
The browser particle movement illustrates abundance; it is not an agent-based
simulation. Its counts and the displayed population curves use the recorded ODE.

Training uses 32,768 simulations with seed 20261026, batch size 512, Adam, and up
to 80 epochs with early stopping and learning-rate reduction. A separate 2,048
simulation set controls stopping. The network uses four affine coupling layers
with 64/64-unit swish subnets; its adapter constrains all inferred rates to the
prior bounds. Training data, stopping data, and final evaluation data use
different random seeds. The three illustrative examples are fixed scenarios,
not a selection used for the aggregate calibration plot.

The exported evaluation uses 512 posterior draws per dataset. Recovery intervals
are empirical 5th/95th quantiles. Calibration uses randomized marginal ranks
among the 512 draws, with approximate pointwise 95% normal envelopes. The envelopes
are not simultaneous confidence bands. The selected example's rose recovery
marker is not added to the calibration sample.

## Regenerate

Use Python 3.12 and an isolated environment. From the repository root on Windows:

```powershell
uv venv --python 3.12 .venv-bayesflow
uv pip install --python .venv-bayesflow/Scripts/python.exe torch==2.14.1 --index-url https://download.pytorch.org/whl/cpu
uv pip install --python .venv-bayesflow/Scripts/python.exe -r scripts/bayesflow-demo/requirements.txt
.venv-bayesflow/Scripts/python.exe scripts/bayesflow-demo/generate.py
.venv-bayesflow/Scripts/python.exe scripts/bayesflow-demo/verify.py
```

On macOS/Linux use `.venv-bayesflow/bin/python` and install the appropriate
PyTorch wheel. Backend and dependency versions are recorded in the snapshot.
To export again using the existing local checkpoint, pass `--reuse`. Posterior
sampling is stochastic; exported draws need not be bit-identical across hardware
or separate runs. Training/evaluation seeds and checkpoint hashes are retained.
Reuse requires the same simulation protocol. Changing the horizon, observation
times, initial populations, or observation noise requires retraining.

The snapshot's `model` and `validation` fields record the completed epochs,
per-parameter 90% interval coverage, and RMSE for the published run.
These describe this small model and observation process, not general
BayesFlow performance claims. All outcomes are exported; no validation cases
are removed to improve the displayed diagnostics.

Reference: [BayesFlow Lotka–Volterra example](https://bayesflow.org/v2.1.0/_examples/Lotka_Volterra_Point_Estimation.html).
