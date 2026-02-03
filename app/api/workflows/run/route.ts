// ============================================
// SOLVE IT! - Workflow Execution API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { Workflow, WorkflowStep, Agent, Tool } from '@/lib/types';
import { chat } from '@/lib/ai/providers';
import { APIKeysConfig, ChatMessage } from '@/lib/ai/types';

interface WorkflowContext {
  variables: Record<string, any>;
  stepResults: Record<string, any>;
  logs: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, agents, tools, apiKeys, initialVariables } = body as {
      workflow: Workflow;
      agents: Agent[];
      tools: Tool[];
      apiKeys: APIKeysConfig;
      initialVariables?: Record<string, any>;
    };
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'سلسلة العمل مطلوبة' },
        { status: 400 }
      );
    }
    
    if (!apiKeys || Object.keys(apiKeys).length === 0) {
      return NextResponse.json(
        { error: 'مفاتيح API مطلوبة' },
        { status: 400 }
      );
    }
    
    // Initialize context
    const context: WorkflowContext = {
      variables: { ...workflow.variables, ...initialVariables },
      stepResults: {},
      logs: [],
    };
    
    context.logs.push(`🚀 بدء سلسلة العمل: ${workflow.name}`);
    
    // Execute steps in order
    for (const step of workflow.steps) {
      try {
        context.logs.push(`📍 تنفيذ الخطوة: ${step.name}`);
        
        const result = await executeStep(step, context, agents, tools, apiKeys);
        context.stepResults[step.id] = result;
        context.variables['lastResult'] = result;
        
        context.logs.push(`✅ اكتملت الخطوة: ${step.name}`);
      } catch (error: any) {
        context.logs.push(`❌ فشلت الخطوة: ${step.name} - ${error.message}`);
        
        if (step.onErrorStepId) {
          // Handle error by jumping to error step
          const errorStep = workflow.steps.find(s => s.id === step.onErrorStepId);
          if (errorStep) {
            context.logs.push(`🔄 التحويل لخطوة الخطأ: ${errorStep.name}`);
            const errorResult = await executeStep(errorStep, context, agents, tools, apiKeys);
            context.stepResults[errorStep.id] = errorResult;
          }
        } else {
          // No error handler, fail the workflow
          return NextResponse.json({
            success: false,
            error: error.message,
            context,
          }, { status: 500 });
        }
      }
    }
    
    context.logs.push(`🎉 اكتملت سلسلة العمل بنجاح!`);
    
    return NextResponse.json({
      success: true,
      result: context.variables['lastResult'],
      context,
    });
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'حدث خطأ في تنفيذ سلسلة العمل' 
      },
      { status: 500 }
    );
  }
}

async function executeStep(
  step: WorkflowStep,
  context: WorkflowContext,
  agents: Agent[],
  tools: Tool[],
  apiKeys: APIKeysConfig
): Promise<any> {
  switch (step.type) {
    case 'agent':
      return executeAgentStep(step, context, agents, apiKeys);
    case 'tool':
      return executeToolStep(step, context, tools);
    case 'condition':
      return executeConditionStep(step, context);
    case 'loop':
      return executeLoopStep(step, context, agents, tools, apiKeys);
    default:
      throw new Error(`نوع خطوة غير مدعوم: ${step.type}`);
  }
}

async function executeAgentStep(
  step: WorkflowStep,
  context: WorkflowContext,
  agents: Agent[],
  apiKeys: APIKeysConfig
): Promise<any> {
  const agent = agents.find(a => a.id === step.config.agentId);
  if (!agent) {
    throw new Error(`الوكيل غير موجود: ${step.config.agentId}`);
  }
  
  // Build prompt with variable substitution
  let prompt = step.config.prompt || '';
  for (const [key, value] of Object.entries(context.variables)) {
    prompt = prompt.replace(`{{${key}}}`, String(value));
  }
  
  const messages: ChatMessage[] = [
    ...agent.memory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: prompt },
  ];
  
  const response = await chat(messages, apiKeys, {
    systemPrompt: agent.systemPrompt,
    forceProvider: agent.preferredProvider as any,
  });
  
  return response.content;
}

async function executeToolStep(
  step: WorkflowStep,
  context: WorkflowContext,
  tools: Tool[]
): Promise<any> {
  const tool = tools.find(t => t.id === step.config.toolId);
  if (!tool) {
    throw new Error(`الأداة غير موجودة: ${step.config.toolId}`);
  }
  
  // Build parameters with variable substitution
  const parameters: Record<string, any> = {};
  if (step.config.inputMapping) {
    for (const [paramName, varName] of Object.entries(step.config.inputMapping)) {
      parameters[paramName] = context.variables[varName] ?? varName;
    }
  }
  
  // Execute tool via API
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, parameters }),
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.result;
}

async function executeConditionStep(
  step: WorkflowStep,
  context: WorkflowContext
): Promise<boolean> {
  const condition = step.config.condition || 'true';
  
  // Simple condition evaluation
  // WARNING: This is simplified - in production use a proper expression parser
  try {
    const evalContext = { ...context.variables, ...context.stepResults };
    const fn = new Function(...Object.keys(evalContext), `return ${condition}`);
    return fn(...Object.values(evalContext));
  } catch (error) {
    throw new Error(`خطأ في تقييم الشرط: ${condition}`);
  }
}

async function executeLoopStep(
  step: WorkflowStep,
  context: WorkflowContext,
  agents: Agent[],
  tools: Tool[],
  apiKeys: APIKeysConfig
): Promise<any[]> {
  const loopCount = step.config.loopCount || 1;
  const results: any[] = [];
  
  for (let i = 0; i < loopCount; i++) {
    context.variables['loopIndex'] = i;
    context.logs.push(`🔄 التكرار ${i + 1}/${loopCount}`);
    
    // Execute nested steps if any
    // For now, just return the loop index
    results.push({ iteration: i });
  }
  
  return results;
}
