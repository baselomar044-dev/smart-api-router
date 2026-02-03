// ============================================
// 🤖 AGENT ROUTES - Full Agent API
// ============================================

import { Router } from 'express';
import { agentEngine, PRESET_AGENTS, BUILT_IN_TOOLS } from '../lib/agent-system';
import { authenticateToken } from './auth';

const router = Router();

// ================== GET PRESET AGENTS ==================

router.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: PRESET_AGENTS,
  });
});

// ================== GET AVAILABLE TOOLS ==================

router.get('/tools', (req, res) => {
  res.json({
    success: true,
    data: BUILT_IN_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  });
});

// ================== LIST USER AGENTS ==================

router.get('/', authenticateToken, (req, res) => {
  try {
    const agents = agentEngine.listAgents();
    res.json({
      success: true,
      data: agents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== GET SINGLE AGENT ==================

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const agent = agentEngine.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== CREATE AGENT ==================

router.post('/', authenticateToken, (req, res) => {
  try {
    const agent = agentEngine.createAgent(req.body);
    res.status(201).json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== UPDATE AGENT ==================

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const agent = agentEngine.updateAgent(req.params.id, req.body);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== DELETE AGENT ==================

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const success = agentEngine.deleteAgent(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found or cannot be deleted',
      });
    }
    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== EXECUTE AGENT ==================

router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { input, context } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
      });
    }

    const execution = await agentEngine.execute(req.params.id, input, context);
    
    res.json({
      success: true,
      data: execution,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== STREAM EXECUTE AGENT ==================

router.post('/:id/stream', authenticateToken, async (req, res) => {
  try {
    const { input, context } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of agentEngine.streamExecute(req.params.id, input, context)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
    res.end();
  }
});

// ================== GET EXECUTION HISTORY ==================

router.get('/:id/executions', authenticateToken, (req, res) => {
  try {
    const executions = agentEngine.listExecutions(req.params.id);
    res.json({
      success: true,
      data: executions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ================== GET SINGLE EXECUTION ==================

router.get('/executions/:execId', authenticateToken, (req, res) => {
  try {
    const execution = agentEngine.getExecution(req.params.execId);
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
      });
    }
    res.json({
      success: true,
      data: execution,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
