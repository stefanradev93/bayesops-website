"""The four-rate Lotka–Volterra model used by the static product demo.

Both populations are observed at fixed times with independent lognormal noise.
Initial populations, observation noise, and observation times are fixed, not
extra inferred parameters. Rates are independent Uniform(0.5, 1.5).
"""

import numpy as np

KEYS = ("alpha", "beta", "gamma", "delta")
LABELS = ("Prey growth", "Hunting pressure", "Predator decline", "Predator growth")
SYMBOLS = ("α", "β", "γ", "δ")
LOWER, UPPER = 0.5, 1.5
INITIAL = np.array([1.5, 0.5])
DURATION, STEP = 20.0, 0.025
NOISE = 0.12
OBSERVATION_STRIDE = 10
TIMES = np.linspace(0, DURATION, round(DURATION / STEP) + 1)
OBSERVATION_TIMES = TIMES[::OBSERVATION_STRIDE]


def trajectories(parameters):
    """Vectorized RK4 integration in log-population space preserves positivity."""
    parameters = np.atleast_2d(np.asarray(parameters, dtype=np.float64))
    if parameters.shape[1] != 4 or not np.isfinite(parameters).all():
        raise ValueError("Expected finite four-parameter vectors")
    alpha, beta, gamma, delta = parameters.T
    state = np.broadcast_to(np.log(INITIAL), (len(parameters), 2)).copy()
    result = np.empty((len(parameters), len(TIMES), 2), dtype=np.float32)
    result[:, 0] = INITIAL

    def derivative(value):
        populations = np.exp(value)
        return np.column_stack((alpha - beta * populations[:, 1],
                                -gamma + delta * populations[:, 0]))

    for index in range(1, len(TIMES)):
        k1 = derivative(state)
        k2 = derivative(state + STEP / 2 * k1)
        k3 = derivative(state + STEP / 2 * k2)
        k4 = derivative(state + STEP * k3)
        state += STEP / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        result[:, index] = np.exp(state)
    if not np.isfinite(result).all() or not (result > 0).all():
        raise ValueError("Nonfinite or nonpositive simulated populations")
    return result


def observations(parameters, rng):
    states = trajectories(parameters)[:, ::OBSERVATION_STRIDE]
    return states * np.exp(rng.normal(0, NOISE, states.shape))


def features(observed):
    """Preserve both ordered time series; the network sees no true parameters."""
    observed = np.asarray(observed)
    if observed.shape[-2:] != (len(OBSERVATION_TIMES), 2):
        raise ValueError("Expected one observation per species and time point")
    if not np.isfinite(observed).all() or not (observed > 0).all():
        raise ValueError("Observed populations must be finite and positive")
    return np.log(observed).reshape(len(observed), -1).astype(np.float32)


def simulation_bank(count, seed):
    rng = np.random.default_rng(seed)
    theta = rng.uniform(LOWER, UPPER, size=(count, 4)).astype(np.float32)
    return {"theta": theta, "x": features(observations(theta, rng))}
