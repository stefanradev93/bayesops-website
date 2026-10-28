"""Train a BayesFlow flow and export actual inference as a static JSON snapshot."""

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "bayesflow-training"
CACHE.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("KERAS_BACKEND", "torch")
os.environ.setdefault("MPLCONFIGDIR", str(CACHE / "matplotlib"))

import torch  # noqa: E402
torch.set_num_threads(4)
import keras  # noqa: E402
import bayesflow as bf  # noqa: E402
import numpy as np  # noqa: E402
from simulator import (KEYS, LABELS, SYMBOLS, LOWER, UPPER, INITIAL, NOISE,
                       TIMES, OBSERVATION_TIMES, observations, features,
                       simulation_bank, trajectories)  # noqa: E402

SEED = 20261026
MODEL = CACHE / "lotka-volterra.keras"
OUTPUT = ROOT / "content" / "demos" / "bayesflow-lotka-volterra.json"


def native(value):
    if isinstance(value, np.ndarray):
        return np.round(value.astype(np.float64), 6).tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def infer(model, observed, draws):
    return np.asarray(model.sample(num_samples=draws, conditions={"x": features(observed)})["theta"])


def example(model, parameters, seed, title, draws):
    rng = np.random.default_rng(seed)
    theta = np.array(parameters, dtype=np.float32)
    observed = observations(theta, rng)
    posterior = infer(model, observed, draws)[0]
    predicted = trajectories(posterior[:64])
    return {
        "title": title, "truth": theta, "time": TIMES[::2],
        "populations": trajectories(theta)[0, ::2],
        "observationTimes": OBSERVATION_TIMES, "observations": observed[0],
        "inference": {"mean": posterior.mean(axis=0),
                      "lower": np.quantile(posterior, .05, axis=0),
                      "upper": np.quantile(posterior, .95, axis=0)},
        "predictive": {"median": np.median(predicted, axis=0)[::2],
                       "lower": np.quantile(predicted, .05, axis=0)[::2],
                       "upper": np.quantile(predicted, .95, axis=0)[::2]},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--training-examples", type=int, default=32768)
    parser.add_argument("--validation-examples", type=int, default=128)
    parser.add_argument("--draws", type=int, default=512)
    parser.add_argument("--reuse", action="store_true")
    args = parser.parse_args()
    keras.utils.set_random_seed(SEED)
    started = time.perf_counter()
    protocol = {"horizon": float(TIMES[-1]), "step": float(TIMES[1] - TIMES[0]),
                "observationCount": len(OBSERVATION_TIMES), "observationNoise": NOISE,
                "initial": INITIAL.tolist()}

    if args.reuse:
        training = json.loads((CACHE / "training.json").read_text())
        if training.get("simulation") != protocol:
            raise ValueError("The cached network uses a different simulation protocol. Retrain without --reuse.")
        model = keras.saving.load_model(MODEL)
    else:
        print(f"Generating {args.training_examples} training simulations", flush=True)
        bank = simulation_bank(args.training_examples, SEED)
        heldout = simulation_bank(2048, SEED + 1)
        adapter = (bf.Adapter().constrain("theta", lower=LOWER, upper=UPPER)
                   .convert_dtype("float64", "float32")
                   .rename("theta", "inference_variables")
                   .rename("x", "inference_conditions"))
        model = bf.ContinuousApproximator(
            inference_network=bf.networks.CouplingFlow(
                depth=4, subnet_kwargs={"widths": [64, 64], "activation": "swish"}),
            adapter=adapter)
        model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-3))
        train = bf.OfflineDataset(bank, batch_size=512, adapter=adapter)
        validation = bf.OfflineDataset(heldout, batch_size=512, adapter=adapter)
        history = model.fit(
            dataset=train, validation_data=validation, epochs=args.epochs,
            callbacks=[keras.callbacks.EarlyStopping(monitor="val_loss", patience=12, restore_best_weights=True),
                       keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=.5, patience=5, min_lr=5e-5)],
            verbose=2)
        model.save(MODEL)
        training = {"seed": SEED, "examples": args.training_examples,
                    "epochs": len(history.history["loss"]), "history": history.history,
                    "simulation": protocol}
        (CACHE / "training.json").write_text(json.dumps(training, default=native))

    # Evaluation data and noise are independent of training and early stopping.
    test = simulation_bank(args.validation_examples, SEED + 2)
    posterior = []
    for start in range(0, args.validation_examples, 16):
        batch = model.sample(num_samples=args.draws, conditions={"x": test["x"][start:start+16]})["theta"]
        posterior.append(np.asarray(batch))
    posterior = np.concatenate(posterior)
    lower = np.quantile(posterior, .05, axis=1)
    upper = np.quantile(posterior, .95, axis=1)
    means = posterior.mean(axis=1)
    truths = test["theta"]
    rng = np.random.default_rng(SEED + 3)
    ranks = ((posterior < truths[:, None]).sum(axis=1) + rng.random(truths.shape)) / (args.draws + 1)
    diagnostics = [[{"truth": float(truths[i, j]), "estimate": float(means[i, j]),
                     "lower": float(lower[i, j]), "upper": float(upper[i, j]), "rank": float(ranks[i, j])}
                    for i in range(args.validation_examples)] for j in range(4)]
    coverage = ((lower <= truths) & (truths <= upper)).mean(axis=0)
    rmse = np.sqrt(((means - truths) ** 2).mean(axis=0))
    print("Held-out 90% interval coverage:", coverage, "RMSE:", rmse, flush=True)
    examples = [
        example(model, [1.0, .9, .8, .9], SEED + 10, "Balanced cycles", args.draws),
        example(model, [1.3, .75, .85, .7], SEED + 11, "Prey boom", args.draws),
        example(model, [.8, 1.2, 1.25, 1.35], SEED + 12, "Predator pressure", args.draws),
    ]
    result = {
        "schemaVersion": 1,
        "model": {"name": "Lotka–Volterra", "bayesflow": bf.__version__, "keras": keras.__version__,
                  "torch": torch.__version__, "backend": keras.backend.backend(),
                  "architecture": "CouplingFlow", "checkpointSha256": hashlib.sha256(MODEL.read_bytes()).hexdigest(),
                  "trainingExamples": training["examples"], "epochs": training["epochs"],
                  "seed": SEED, "generatedAt": datetime.now(timezone.utc).isoformat()},
        "simulation": {**protocol, "prior": "Independent uniform"},
        "parameters": [{"key": k, "label": label, "symbol": symbol, "domain": [LOWER, UPPER]}
                       for k, label, symbol in zip(KEYS, LABELS, SYMBOLS)],
        "validation": {"datasets": args.validation_examples, "posteriorDraws": args.draws,
                       "seed": SEED + 2, "coverage90": coverage, "rmse": rmse},
        "diagnostics": diagnostics, "examples": examples,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, default=native, separators=(",", ":")), encoding="utf-8")
    print(f"Saved {OUTPUT.relative_to(ROOT)} in {time.perf_counter() - started:.1f}s", flush=True)


if __name__ == "__main__":
    main()
