import { Router } from 'express';
import { getHealth, getLiveness, getReadiness } from '../controllers/healthController.js';

const router = Router();

// Full health check with detailed system information
router.get('/', getHealth);

// Simple liveness probe for basic availability check
router.get('/live', getLiveness);

// Readiness probe for service availability
router.get('/ready', getReadiness);

export default router;
