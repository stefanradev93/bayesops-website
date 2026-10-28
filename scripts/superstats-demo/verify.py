"""Check exported curves against the untouched superstats inference snapshot."""

import json
from pathlib import Path

import numpy as np
from scipy.stats import gaussian_kde

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "superstats-training"


def main():
    demo = json.loads((ROOT / "content" / "demos" / "superstats-ddm.json").read_text())
    samples = np.load(CACHE / "posterior.npz")
    observations = np.load(CACHE / "observations.npz")
    assert demo["provenance"]["implementation"] == "superstats.Workflow"
    assert len(demo["examples"]) == 4
    for index, example in enumerate(demo["examples"]):
        np.testing.assert_allclose(example["responseTime"], observations["response_time"][index], atol=5.1e-6)
        np.testing.assert_array_equal(example["choice"], observations["choice"][index])
        assert set(example["choice"]) <= {0, 1}
        assert min(example["responseTime"]) > 0.25
        for key, parameter in example["parameters"].items():
            draws = samples[key][index, ..., 0]
            assert draws.shape == (demo["provenance"]["draws"], 100)
            np.testing.assert_allclose(parameter["truth"], observations[key][index, :, 0], atol=5.1e-6)
            np.testing.assert_allclose(parameter["median"], np.median(draws, axis=0), atol=5.1e-6)
            np.testing.assert_allclose(parameter["lower"], np.quantile(draws, 0.025, axis=0), atol=5.1e-6)
            np.testing.assert_allclose(parameter["upper"], np.quantile(draws, 0.975, axis=0), atol=5.1e-6)
            density = np.asarray(parameter["density"])
            assert density.shape == (100, 128)
            assert np.isfinite(density).all() and (density >= 0).all()
            # Verify selected KDEs independently, allowing for grid rounding in JSON.
            for trial in (0, 49, 99):
                expected = gaussian_kde(draws[:, trial])(parameter["densityGrid"])
                np.testing.assert_allclose(density[trial], expected, atol=2e-4, rtol=2e-4)
    print("Verified all four sequences: observations, truth, medians, 95% intervals, and sampled marginal KDEs.")
    print("Independent recovery:", json.dumps(demo["provenance"]["verification"], indent=2))


if __name__ == "__main__":
    main()
