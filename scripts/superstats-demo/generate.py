"""Train the actual superstats workflow and export its trial-wise posteriors."""

import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "superstats-training"
CACHE.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("KERAS_BACKEND", "jax")
os.environ.setdefault("JAX_PLATFORMS", "cpu")
os.environ.setdefault("NUMBA_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MPLCONFIGDIR", str(CACHE / "matplotlib"))

import bayesflow as bf
import keras
import numpy as np
from numba import njit
from scipy.stats import gaussian_kde
import superstats as sup

SEED = 20261027
SOURCE_COMMIT = "00b40acd97e6eb2b0f5c0e1c933afd69cd9dcd40"
STEPS = 100
BOUNDS = {"v": (-3.0, 3.0), "a": (0.5, 2.5)}
MODEL = CACHE / "ddm.keras"
OUTPUT = ROOT / "content" / "demos" / "superstats-ddm.json"


@njit
def seed_simulator(seed):
    np.random.seed(seed)


def seed_all(seed):
    keras.utils.set_random_seed(seed)
    seed_simulator(seed)


def make_workflow():
    prior = sup.JointPrior(
        v=sup.transition.RandomWalk(bounds=BOUNDS["v"], sigma=0.16, delta=0.0),
        a=sup.transition.RandomWalk(
            bounds=BOUNDS["a"], initial_prior=sup.Prior("normal", loc=0.0, scale=0.6),
            sigma=0.08, delta=0.0,
        ),
        tau=0.25,
        bias=0.5,
    )
    simulator = sup.GenerativeModel(
        prior=prior, model=sup.simulation.sample_ddm, missing=None, contamination=None,
    )
    return sup.Workflow(
        simulator=simulator,
        summary_network=sup.networks.RecurrentNet(
            summary_dim=32, hidden_dim=(64, 64), dropout=0.0,
        ),
        inference_network=bf.networks.CouplingFlow(
            depth=4, transform="affine", subnet_kwargs={"widths": (64, 64)},
        ),
    )


def native(value):
    if isinstance(value, np.ndarray):
        return np.round(value.astype(np.float64), 5).tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def summarize(draws):
    return {
        "median": np.median(draws, axis=0),
        "lower": np.quantile(draws, 0.025, axis=0),
        "upper": np.quantile(draws, 0.975, axis=0),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--training-examples", type=int, default=8192)
    parser.add_argument("--draws", type=int, default=512)
    parser.add_argument("--reuse", action="store_true")
    args = parser.parse_args()
    started = time.perf_counter()
    seed_all(SEED)
    workflow = make_workflow()
    if args.reuse:
        workflow.approximator = keras.saving.load_model(MODEL)
        training = json.loads((CACHE / "training.json").read_text())
    else:
        print(f"Simulating {args.training_examples} DDM sequences with superstats", flush=True)
        train = workflow.simulator.sample(batch_size=args.training_examples, num_steps=STEPS, tile_to_steps=True)
        validation = workflow.simulator.sample(batch_size=256, num_steps=STEPS, tile_to_steps=True)
        history = workflow.fit_offline(
            data=train, validation_data=validation, epochs=args.epochs, batch_size=64,
            callbacks=[keras.callbacks.EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)],
            verbose=2,
        )
        workflow.approximator.save(MODEL)
        training = {
            "sequences": args.training_examples, "validationSequences": 256,
            "epochs": len(history.history["loss"]), "batchSize": 64,
            "loss": history.history["loss"], "validationLoss": history.history["val_loss"],
        }
        (CACHE / "training.json").write_text(json.dumps(training, default=native))

    seed_all(SEED + 1)
    print("Checking recovery on 128 independent simulated sequences", flush=True)
    targets = workflow.simulator.sample(batch_size=128, num_steps=STEPS)
    estimates = workflow.sample(data=targets, num_samples=256, batch_size=16)
    verification = {}
    for key in BOUNDS:
        draws = estimates[key][..., 0]
        truth = targets[key][..., 0]
        median = np.median(draws, axis=1)
        lo, hi = np.quantile(draws, [0.025, 0.975], axis=1)
        verification[key] = {
            "correlation": float(np.corrcoef(truth.ravel(), median.ravel())[0, 1]),
            "rmse": float(np.sqrt(np.mean((median - truth) ** 2))),
            "pointwise95Coverage": float(np.mean((truth >= lo) & (truth <= hi))),
        }
    print("VERIFICATION", json.dumps(verification), flush=True)

    seed_all(SEED + 2)
    data = workflow.simulator.sample(batch_size=4, num_steps=STEPS)
    estimates = workflow.sample(data=data, num_samples=args.draws, batch_size=4)
    # Keep unmodified samples for independent verification of every exported summary.
    np.savez_compressed(CACHE / "posterior.npz", **estimates)
    np.savez_compressed(CACHE / "observations.npz", **data)
    parameters = [
        {"key": "v", "symbol": "v", "label": "Drift rate", "description": "The speed and direction of evidence accumulation.", "bounds": BOUNDS["v"]},
        {"key": "a", "symbol": "a", "label": "Boundary separation", "description": "The distance between decision thresholds: how much evidence a decision requires.", "bounds": BOUNDS["a"]},
    ]
    examples = []
    for index in range(4):
        example = {
            "label": f"Sequence {index + 1}",
            "responseTime": data["response_time"][index],
            "choice": data["choice"][index],
            "parameters": {},
        }
        for key, bounds in BOUNDS.items():
            draws = estimates[key][index, ..., 0]
            # KDEs retain the learned shape; no Gaussian substitution or smoothing in time.
            lower = min(bounds[0], float(np.quantile(draws, 0.001)))
            upper = max(bounds[1], float(np.quantile(draws, 0.999)))
            grid = np.linspace(lower, upper, 128)
            density = np.stack([gaussian_kde(draws[:, t])(grid) for t in range(STEPS)])
            example["parameters"][key] = {
                "truth": data[key][index, :, 0], **summarize(draws),
                "densityGrid": grid, "density": density,
            }
        examples.append(example)
    artifact = {
        "provenance": {
            "implementation": "superstats.Workflow", "sourceCommit": SOURCE_COMMIT,
            "sourceUrl": f"https://github.com/LuSchumacher/superstats/tree/{SOURCE_COMMIT}",
            "notebookUrl": f"https://github.com/LuSchumacher/superstats/blob/{SOURCE_COMMIT}/examples/minimal_workflow_demo.ipynb",
            "seed": SEED, "steps": STEPS, "draws": args.draws,
            "modelSha256": hashlib.sha256(MODEL.read_bytes()).hexdigest(),
            "versions": {key: importlib.metadata.version(key) for key in ("superstats", "bayesflow", "keras", "jax", "numpy", "scipy", "numba")},
            "fixed": {"tau": 0.25, "bias": 0.5, "v_sigma": 0.16, "a_sigma": 0.08, "v_delta": 0.0, "a_delta": 0.0},
            "training": training, "verification": verification,
            "validationSequences": 128,
            "summaryNetwork": {"class": "superstats.networks.RecurrentNet", "hidden_dim": [64, 64], "summary_dim": 32, "dropout": 0.0},
            "inferenceNetwork": {"class": "bayesflow.networks.CouplingFlow", "depth": 4, "transform": "affine", "subnet_kwargs": {"widths": [64, 64]}},
        },
        "parameters": parameters, "examples": examples,
    }
    OUTPUT.write_text(json.dumps(artifact, default=native, separators=(",", ":"), allow_nan=False) + "\n")
    print(f"Exported {OUTPUT} ({OUTPUT.stat().st_size:,} bytes) in {time.perf_counter() - started:.1f}s", flush=True)


if __name__ == "__main__":
    main()
