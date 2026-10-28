# Superstats posterior explorer

The page at `/products/superstats` displays recorded inference from the actual
`superstats.Workflow`, using the built-in diffusion decision model (DDM). It
does not run inference in JavaScript. Trial selection, playback, parameter
selection, dataset selection, and the truth overlay explore the saved results.

The implementation is pinned to superstats commit
`00b40acd97e6eb2b0f5c0e1c933afd69cd9dcd40`. The workflow follows its
[minimal example](https://github.com/LuSchumacher/superstats/blob/00b40acd97e6eb2b0f5c0e1c933afd69cd9dcd40/examples/minimal_workflow_demo.ipynb),
with two stochastic parameters and smaller neural networks for CPU training.

## Model

- Drift rate `v`: `superstats.transition.RandomWalk`, bounds `(-3, 3)`,
  initial latent prior `Normal(0, 1)`, increment SD `0.16`, additive drift `0`.
- Boundary separation `a`: `RandomWalk`, bounds `(0.5, 2.5)`,
  initial latent prior `Normal(0, 0.6)`, increment SD `0.08`, additive drift `0`.
- Non-decision time `tau = 0.25 s` and starting bias `0.5` are fixed.
- The package generates walks in unconstrained space and applies its scaled
  sigmoid to bound them; these are not clipped Gaussian trajectories.
- `superstats.simulation.sample_ddm` produces response time and choice at each
  of 100 trials. Missingness and contamination are disabled.
- `superstats.networks.RecurrentNet`: two bidirectional GRU layers with 64 hidden
  units each, 32 summary features, no dropout. BayesFlow coupling flow:
  four affine transforms, subnet widths `(64, 64)`.

The flow estimates `(v_t, a_t)` at each trial conditional on the bidirectional
summary of the complete observed sequence. The browser shows these **trial-wise
marginals**. It does not interpret matching sample indices across trials as
coherent joint trajectory draws. The full data dictionary is passed to
`Workflow.sample`; its `_prepare_conditions` method keeps only the observed
variables and time steps, excluding latent ground truth from inference.

## Reproduce

Python 3.12 or 3.13 is needed to generate results; the website only needs Node.
From the repository root:

```bash
uv venv /tmp/superstats-demo-venv --python 3.13
uv pip install --python /tmp/superstats-demo-venv/bin/python -r scripts/superstats-demo/requirements.txt
/tmp/superstats-demo-venv/bin/python scripts/superstats-demo/generate.py
/tmp/superstats-demo-venv/bin/python scripts/superstats-demo/verify.py
```

Training uses 8,192 simulated sequences, 256 validation sequences, up to 40
epochs, and batches of 64. Early stopping restores the best validation weights.
Recovery is measured on another 128 independent sequences with 256 posterior
draws each. The four displayed sequences are a separate draw, with 512 neural
posterior samples per trial. They are not selected by recovery quality.

The generator writes the trained network, history, raw samples, and observations
under the gitignored `.cache/superstats-training/`. After training, `--reuse`
loads that network to regenerate the export without retraining. Keep its model
and history together and regenerate them after changing the model specification.

The tracked `content/demos/superstats-ddm.json` contains the median and 2.5th /
97.5th percentiles computed directly across the returned sample axis, without
temporal smoothing. Marginal densities use SciPy's Gaussian KDE on each trial's
samples, evaluated on a fixed grid; they are not fitted Gaussian posteriors.
The artifact also records package versions, source commit, network checksum,
seeds, training history, and independent recovery metrics. Simulation is seeded
in both NumPy and Numba, with one Numba thread; neural training may still vary
between platforms.

`verify.py` compares every exported observation, true parameter value, posterior
median, and interval with the saved raw outputs, and recomputes selected KDEs.
The signed response-time plot uses positive RTs for upper-boundary choices and
negative RTs for lower-boundary choices; this is display encoding only.
