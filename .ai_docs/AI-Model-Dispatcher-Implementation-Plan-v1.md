# AI Model Dispatcher Framework Implementation Plan v1

**Created**: 2025-06-26  
**Status**: Initial Draft  
**Complexity**: High (Full Framework Implementation)  

## Executive Summary

This document outlines a comprehensive plan to implement the AI Model Dispatcher Framework into the existing n8n-automations project. The framework will provide intelligent AI model selection, dynamic container orchestration, and self-learning optimization capabilities.

## Current System Analysis

### Existing Infrastructure
- **n8n**: Workflow automation platform (stable, working)
- **Ollama**: Local AI models (llama3.2:3b, phi3:mini, qwen2.5:7b)
- **Redis**: Caching and session management
- **Prometheus/Grafana**: Monitoring stack
- **Nginx**: Reverse proxy
- **SQLite**: Currently used for some AI memory features

### Key Strengths to Preserve
- Working digest workflows (Gmail, Slack, Jira, Trello)
- Established monitoring and metrics
- Cloudflare tunnel integration
- Resource-optimized container setup
- Existing AI memory system with SQLite

### Integration Challenges Identified
- Current system uses SQLite, framework suggests PostgreSQL
- Existing Ollama setup is single-instance, framework needs multi-container
- Current workflows directly call Ollama, need dispatcher layer
- Resource constraints (4GB memory limit for Ollama)

## Framework Implementation Plan v1 (Full Implementation)

### Phase 1: Foundation Setup (Days 1-3)

#### 1.1 Database Migration Strategy
```bash
# Current: SQLite for AI memory
./data/sqlite/ai_memory.db

# Proposed: PostgreSQL with full schema
- model_registry (AI models and metadata)
- performance_logs (execution metrics)
- container_lifecycle (dynamic container management)
- optimization_rules (self-learning rules)
- request_queue (intelligent queuing)
```

#### 1.2 Docker Compose Enhancement
```yaml
# Add to existing docker-compose.yml:
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_dispatcher
      POSTGRES_USER: dispatcher
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    
  ai-dispatcher-api:
    build: ./ai-dispatcher/api
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: postgresql://dispatcher:${POSTGRES_PASSWORD}@postgres:5432/ai_dispatcher
      REDIS_URL: redis://redis:6379
    
  optimization-engine:
    build: ./ai-dispatcher/optimization-engine
    environment:
      DATABASE_URL: postgresql://dispatcher:${POSTGRES_PASSWORD}@postgres:5432/ai_dispatcher
```

#### 1.3 Directory Structure
```
ai-dispatcher/
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/
│       └── 001_sample_models.sql
├── api/
│   ├── src/
│   │   ├── app.js
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── Dockerfile
├── optimization-engine/
│   ├── src/
│   │   ├── optimizer.py
│   │   └── ml_models/
│   ├── requirements.txt
│   └── Dockerfile
└── n8n-workflows/
    └── ai-dispatcher-main.json
```

### Phase 2: Core API Development (Days 4-6)

#### 2.1 REST API Endpoints
```javascript
// ai-dispatcher/api/src/app.js
app.post('/api/dispatch', async (req, res) => {
  // Main AI request dispatcher
  // 1. Parse request requirements
  // 2. Select optimal model
  // 3. Get/create container
  // 4. Execute request
  // 5. Log performance
});

app.get('/api/models', async (req, res) => {
  // Model registry management
});

app.get('/api/containers', async (req, res) => {
  // Container lifecycle status
});

app.get('/api/performance', async (req, res) => {
  // Performance analytics
});
```

#### 2.2 Model Selection Algorithm
```javascript
async function selectBestModel(taskType, complexity, requirements) {
  const models = await db.query(`
    SELECT mr.*, mps.avg_processing_time, mps.success_rate
    FROM model_registry mr
    LEFT JOIN model_performance_summary mps ON mr.id = mps.id
    WHERE mr.task_type = $1 AND mr.complexity_score <= $2
    ORDER BY mps.success_rate DESC, mps.avg_processing_time ASC
    LIMIT 1
  `, [taskType, complexity]);
  
  return models[0];
}
```

#### 2.3 Dynamic Container Management
```javascript
async function getOrCreateContainer(model) {
  // Check for existing running container
  let container = await findRunningContainer(model.id);
  
  if (!container) {
    // Create new optimized container
    container = await createOptimizedContainer(model);
    await pullModel(container, model);
    await registerContainer(container, model);
  }
  
  return container;
}
```

### Phase 3: N8N Integration (Days 7-9)

#### 3.1 Dispatcher Workflow
```json
{
  "name": "AI Model Dispatcher",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "ai-dispatch",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Parse Request Requirements",
      "type": "n8n-nodes-base.code"
    },
    {
      "name": "Call Dispatcher API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://ai-dispatcher-api:3000/api/dispatch",
        "method": "POST"
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.code"
    }
  ]
}
```

#### 3.2 Existing Workflow Migration
```javascript
// Current direct Ollama calls:
const response = await $http.request({
  url: "http://ollama:11434/api/generate",
  method: "POST",
  body: { model: "llama3.2:3b", prompt: prompt }
});

// New dispatcher calls:
const response = await $http.request({
  url: "http://ai-dispatcher-api:3000/api/dispatch",
  method: "POST",
  body: {
    prompt: prompt,
    taskType: "text-generation",
    complexity: "medium",
    requirements: { maxTokens: 1000, timeout: 30 }
  }
});
```

### Phase 4: Self-Learning Engine (Days 10-12)

#### 4.1 Optimization Engine
```python
# ai-dispatcher/optimization-engine/src/optimizer.py
class AIDispatcherOptimizer:
    async def analyze_performance(self):
        # Analyze recent performance data
        # Identify underperforming models
        # Suggest optimizations
        
    async def update_model_rankings(self):
        # Update model performance scores
        # Adjust selection algorithms
        
    async def optimize_resources(self):
        # Right-size container resources
        # Implement cost optimizations
```

#### 4.2 Machine Learning Components
```python
import tensorflow as tf

class PerformancePredictionModel:
    def predict_processing_time(self, model_name, prompt_length, complexity):
        # ML model to predict processing time
        
    def recommend_optimal_model(self, requirements):
        # ML-based model recommendation
```

### Phase 5: Advanced Features (Days 13-15)

#### 5.1 Advanced Prompt Optimization
```javascript
const promptTemplates = {
  'text-generation': {
    'llama3.2': 'You are a helpful assistant. {prompt}',
    'phi3': 'Task: {prompt}\nResponse:',
    'qwen2.5': 'Analyze and respond: {prompt}'
  },
  'code-generation': {
    'llama3.2': 'Generate code for: {prompt}',
    'phi3': 'Code task: {prompt}'
  }
};

function optimizePrompt(originalPrompt, model, taskType) {
  const template = promptTemplates[taskType][model.family];
  return template.replace('{prompt}', originalPrompt);
}
```

#### 5.2 Auto-Scaling Logic
```bash
#!/bin/bash
# Container lifecycle management

cleanup_idle_containers() {
  # Find and stop idle containers
  idle_containers=$(docker ps --format "table {{.Names}}" | grep "ollama-")
  for container in $idle_containers; do
    if is_idle $container; then
      docker stop $container
      update_database $container "stopped"
    fi
  done
}

scale_based_on_queue() {
  queue_length=$(get_queue_length)
  if [ $queue_length -gt 10 ]; then
    trigger_scale_up
  fi
}
```

## Resource Requirements

### Infrastructure Needs
- **Memory**: Additional 2-4GB for PostgreSQL and API services
- **CPU**: Additional 1-2 cores for optimization engine
- **Storage**: Additional 5-10GB for database and logs
- **Network**: Internal container communication

### Development Resources
- **Backend Development**: Express.js, PostgreSQL, Docker
- **Python Development**: TensorFlow, asyncio, database integration
- **N8N Workflow Development**: Complex workflow creation and testing
- **DevOps**: Container orchestration, monitoring integration

## Risk Assessment

### High Risks
1. **Complexity Overhead**: Full framework may be over-engineered for current needs
2. **Resource Constraints**: Current system optimized for minimal resources
3. **Migration Complexity**: Moving from SQLite to PostgreSQL
4. **Compatibility Issues**: Existing workflows may break during migration

### Medium Risks
1. **Performance Impact**: Additional API layers may introduce latency
2. **Maintenance Burden**: Complex system requires ongoing maintenance
3. **Learning Curve**: Team needs to understand new architecture

### Mitigation Strategies
1. **Phased Implementation**: Implement incrementally with rollback options
2. **Parallel Systems**: Run old and new systems in parallel during transition
3. **Comprehensive Testing**: Extensive testing before production deployment
4. **Documentation**: Detailed documentation for maintenance and troubleshooting

## Success Metrics

### Performance Metrics
- **Response Time Improvement**: 20-30% faster AI responses through optimal model selection
- **Resource Utilization**: 40-50% better resource efficiency through dynamic scaling
- **Success Rate**: 99%+ successful AI request completion
- **Cost Optimization**: 30-40% reduction in compute costs through intelligent scheduling

### Operational Metrics
- **Uptime**: 99.9% system availability
- **Error Rate**: <1% failed requests
- **Learning Effectiveness**: Measurable improvement in model selection over time
- **Scalability**: Handle 10x current request volume

## Alternative Approaches

### Simplified Approach (v2 - Recommended)
Instead of full framework implementation, consider:
1. **Enhanced Ollama Management**: Improve existing Ollama setup with better model switching
2. **Simple Model Router**: Basic routing logic in N8N workflows
3. **Performance Tracking**: Add metrics to existing monitoring without full database migration
4. **Incremental Optimization**: Small improvements to existing system

### Hybrid Approach (v3)
1. **Keep SQLite**: Extend current SQLite schema instead of PostgreSQL migration
2. **API Layer**: Add simple API layer without full container orchestration
3. **N8N-First**: Implement intelligence primarily in N8N workflows
4. **Gradual Migration**: Slowly migrate features to full framework over time

## Recommendations

Given the analysis of the current system and complexity assessment, I recommend:

1. **Start with Simplified Approach (v2)**: Less disruptive, faster implementation
2. **Prove Value First**: Demonstrate benefits before full framework investment
3. **Iterative Development**: Build incrementally on proven concepts
4. **Preserve Existing Strengths**: Don't break what's currently working well

## Next Steps

1. **Review and Approve Plan**: Stakeholder review of this comprehensive plan
2. **Choose Implementation Approach**: Decide between v1 (full), v2 (simplified), or v3 (hybrid)
3. **Create Detailed Implementation Plan**: Based on chosen approach
4. **Set Up Development Environment**: Prepare for implementation
5. **Begin Phased Implementation**: Start with lowest-risk, highest-value features

---

**Note**: This v1 plan represents the full vision of the AI Model Dispatcher Framework. A simplified v2 approach document will follow, focusing on incremental improvements to the existing system while preserving its strengths and minimizing risks.