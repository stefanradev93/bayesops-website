"""Numerical and provenance checks for the published inference snapshots."""

import hashlib
import json
import os
from pathlib import Path
import unittest

import numpy as np
from scipy.integrate import solve_ivp
from simulator import INITIAL, TIMES, OBSERVATION_TIMES, features, trajectories

ROOT = Path(__file__).resolve().parents[2]


class SnapshotTests(unittest.TestCase):
    @unittest.skipUnless((ROOT / '.cache/bayesflow-training/lotka-volterra.keras').exists(),
                         'Local checkpoint is optional; rerun generate.py to create it')
    def test_saved_network_reproduces_recorded_estimates(self):
        os.environ.setdefault('KERAS_BACKEND', 'torch')
        os.environ.setdefault('MPLCONFIGDIR', str(ROOT / '.cache/bayesflow-training/matplotlib'))
        import torch
        torch.set_num_threads(4)
        import bayesflow  # Registers saved network/adapter types with Keras.
        import keras
        self.assertTrue(bayesflow.__version__)
        model = keras.saving.load_model(ROOT / '.cache/bayesflow-training/lotka-volterra.keras')
        data = json.loads((ROOT / 'content/demos/bayesflow-lotka-volterra.json').read_text(encoding='utf-8'))
        for example in data['examples']:
            observed = np.asarray(example['observations'])[None]
            draws = model.sample(num_samples=512, conditions={'x': features(observed)})['theta'][0]
            # Independent posterior draws should agree to Monte Carlo precision.
            np.testing.assert_allclose(np.asarray(draws).mean(axis=0), example['inference']['mean'], atol=.02)

    def test_rk4_matches_independent_adaptive_solver(self):
        for parameters in ([1.3, .75, .85, .7], [.8, 1.2, 1.25, 1.35]):
            a, b, g, d = parameters
            reference = solve_ivp(
                lambda t, xy: [a * xy[0] - b * xy[0] * xy[1],
                               -g * xy[1] + d * xy[0] * xy[1]],
                [TIMES[0], TIMES[-1]], INITIAL, t_eval=TIMES, rtol=1e-10, atol=1e-12)
            self.assertTrue(reference.success)
            np.testing.assert_allclose(trajectories(parameters)[0], reference.y.T, rtol=1e-4)

    def test_stationary_ecosystem_remains_stationary(self):
        # x*=gamma/delta=1.5 and y*=alpha/beta=0.5 equal INITIAL.
        np.testing.assert_allclose(trajectories([1, 2, 1.5, 1])[0],
                                   np.broadcast_to(INITIAL, (len(TIMES), 2)), rtol=1e-6)

    def test_snapshot_records_measured_coverage_and_rmse(self):
        data = json.loads((ROOT / "content/demos/bayesflow-lotka-volterra.json").read_text(encoding="utf-8"))
        self.assertEqual(data["model"]["architecture"], "CouplingFlow")
        self.assertEqual(data["simulation"]["horizon"], TIMES[-1])
        self.assertEqual(data["simulation"]["observationCount"], len(OBSERVATION_TIMES))
        for index, records in enumerate(data["diagnostics"]):
            self.assertEqual(len(records), data["validation"]["datasets"])
            for record in records:
                self.assertTrue(all(np.isfinite(v) for v in record.values()))
                self.assertTrue(.5 <= record["lower"] <= record["upper"] <= 1.5)
                self.assertTrue(0 <= record["rank"] <= 1)
            coverage = np.mean([r["lower"] <= r["truth"] <= r["upper"] for r in records])
            rmse = np.sqrt(np.mean([(r["truth"] - r["estimate"]) ** 2 for r in records]))
            self.assertAlmostEqual(coverage, data["validation"]["coverage90"][index], places=5)
            self.assertAlmostEqual(rmse, data["validation"]["rmse"][index], places=5)
        model = ROOT / ".cache/bayesflow-training/lotka-volterra.keras"
        if model.exists():
            self.assertEqual(hashlib.sha256(model.read_bytes()).hexdigest(), data["model"]["checkpointSha256"])
        for example in data["examples"]:
            self.assertEqual(len(example["time"]), len(example["populations"]))
            self.assertEqual(example["time"][-1], TIMES[-1])
            np.testing.assert_allclose(example["observationTimes"], OBSERVATION_TIMES)
            np.testing.assert_allclose(example["populations"][0], INITIAL)
            np.testing.assert_allclose(example["populations"], trajectories(example["truth"])[0, ::2], atol=2e-5)


if __name__ == "__main__":
    unittest.main()
