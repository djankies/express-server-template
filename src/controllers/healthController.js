import healthService from '../services/healthService.js';

export const getHealth = async (req, res) => {
  try {
    const health = await healthService.getFullHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
};

export const getLiveness = async (req, res) => {
  try {
    const liveness = await healthService.getLivenessCheck();
    res.json(liveness);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
};

export const getReadiness = async (req, res) => {
  try {
    const readiness = await healthService.getReadinessCheck();
    const statusCode = readiness.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
};
