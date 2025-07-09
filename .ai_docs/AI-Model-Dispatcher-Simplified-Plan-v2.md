# AI Model Dispatcher Framework - Simplified Implementation Plan v2

**Created**: 2025-06-26  
**Status**: Recommended Approach  
**Complexity**: Medium (Incremental Enhancement)  
**Based on**: Existing n8n-automations infrastructure

## Executive Summary

This simplified approach enhances the existing n8n-automations system with intelligent AI model selection and optimization capabilities while preserving current functionality and minimizing infrastructure changes.

## Key Insights from Current System Analysis

### Existing Strengths to Leverage
- **Working SQLite AI Memory**: Already tracking conversations and performance (`ai_conversations`, `ai_insights`, `workflow_performance`)
- **Established Model Strategy**: Clear model selection rules (qwen2.5:7b for analysis, phi3:mini for quick tasks, llama3.2:3b for general)
- **Existing Workflows**: Proven digest workflows with direct Ollama integration
- **Resource Optimization**: System already optimized for 4GB memory constraints
- **Monitoring Stack**: Prometheus/Grafana already monitoring Ollama performance

### Current Model Usage Patterns
```bash
# From AI_MEMORY_README.md - Already implemented:
📊 ANALYSIS TASKS: qwen2.5:7b (Best reasoning, complex analysis)
⚡ QUICK TASKS: phi3:mini (Fast, simple operations)  
🔍 GENERAL PURPOSE: llama3.2:3b (Balanced performance)
📝 SUMMARIZATION: llama3.2:1b (Lightweight, efficient)
```

## Simplified Implementation Strategy

### Phase 1: Enhance Existing AI Memory System (Days 1-2)

#### 1.1 Extend SQLite Schema for Model Intelligence
```sql
-- Add to existing data/jira_ai_memory.db
CREATE TABLE IF NOT EXISTS model_performance_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    prompt_length INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN,
    memory_usage_mb INTEGER,
    quality_score REAL, -- 0.0 to 1.0 based on user feedback/success
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_selection_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    complexity_level TEXT NOT NULL, -- 'low', 'medium', 'high'
    preferred_model TEXT NOT NULL,
    fallback_model TEXT,
    min_memory_mb INTEGER,
    max_timeout_ms INTEGER,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_model_performance_model_task ON model_performance_tracking(model_name, task_type);
CREATE INDEX idx_selection_rules_task_complexity ON model_selection_rules(task_type, complexity_level);
```

#### 1.2 Seed Initial Model Rules
```sql
INSERT INTO model_selection_rules (task_type, complexity_level, preferred_model, fallback_model, min_memory_mb, max_timeout_ms) VALUES
('text-generation', 'low', 'phi3:mini', 'llama3.2:1b', 2048, 10000),
('text-generation', 'medium', 'llama3.2:3b', 'phi3:mini', 4096, 30000),
('text-generation', 'high', 'qwen2.5:7b', 'llama3.2:3b', 8192, 60000),
('summarization', 'low', 'llama3.2:1b', 'phi3:mini', 1024, 15000),
('summarization', 'medium', 'phi3:mini', 'llama3.2:3b', 2048, 20000),
('analysis', 'low', 'llama3.2:3b', 'phi3:mini', 4096, 30000),
('analysis', 'medium', 'qwen2.5:7b', 'llama3.2:3b', 8192, 45000),
('analysis', 'high', 'qwen2.5:7b', 'llama3.2:3b', 8192, 90000);
```

### Phase 2: Create Smart Model Selector N8N Node (Days 3-4)

#### 2.1 Smart Model Selection Function
Create `scripts/smart-model-selector.js`:

```javascript
// Smart Model Selector for N8N Workflows
class SmartModelSelector {
  constructor(dbPath = './data/jira_ai_memory.db') {
    this.sqlite3 = require('sqlite3');
    this.db = new this.sqlite3.Database(dbPath);
  }

  async selectOptimalModel(taskType, promptText, complexity = 'medium') {
    return new Promise((resolve, reject) => {
      // Calculate prompt complexity
      const actualComplexity = this.calculateComplexity(promptText, complexity);
      
      // Get preferred model from rules
      const query = `
        SELECT preferred_model, fallback_model, max_timeout_ms 
        FROM model_selection_rules 
        WHERE task_type = ? AND complexity_level = ? AND active = 1
        ORDER BY id DESC LIMIT 1
      `;
      
      this.db.get(query, [taskType, actualComplexity], async (err, rule) => {
        if (err) return reject(err);
        
        if (!rule) {
          // Default fallback
          return resolve({
            model: 'llama3.2:3b',
            timeout: 30000,
            reasoning: 'Default model - no rule found'
          });
        }

        // Check recent performance
        const performance = await this.getRecentPerformance(rule.preferred_model, taskType);
        
        // Decide between preferred and fallback
        const selectedModel = this.shouldUseFallback(performance) ? 
          rule.fallback_model : rule.preferred_model;

        resolve({
          model: selectedModel,
          timeout: rule.max_timeout_ms,
          reasoning: `Selected based on ${taskType}/${actualComplexity} rules and recent performance`
        });
      });
    });
  }

  calculateComplexity(promptText, userComplexity) {
    const length = promptText.length;
    const hasCode = /```|`.*`|function|class|import|export/.test(promptText);
    const hasAnalysis = /analyze|compare|evaluate|assess|review/.test(promptText.toLowerCase());
    
    // Auto-adjust complexity based on content
    if (length > 2000 || hasCode || hasAnalysis) {
      return userComplexity === 'low' ? 'medium' : 'high';
    }
    if (length < 200 && !hasCode && !hasAnalysis) {
      return userComplexity === 'high' ? 'medium' : 'low';
    }
    
    return userComplexity;
  }

  async getRecentPerformance(modelName, taskType) {
    return new Promise((resolve) => {
      const query = `
        SELECT AVG(response_time_ms) as avg_time, AVG(quality_score) as avg_quality, COUNT(*) as count
        FROM model_performance_tracking 
        WHERE model_name = ? AND task_type = ? 
        AND timestamp > datetime('now', '-24 hours')
      `;
      
      this.db.get(query, [modelName, taskType], (err, result) => {
        if (err || !result) {
          resolve({ avg_time: 5000, avg_quality: 0.8, count: 0 });
        } else {
          resolve(result);
        }
      });
    });
  }

  shouldUseFallback(performance) {
    // Use fallback if recent performance is poor
    return performance.avg_quality < 0.6 || performance.avg_time > 45000;
  }

  async logPerformance(modelName, taskType, promptLength, responseTimeMs, success, qualityScore = 0.8) {
    const query = `
      INSERT INTO model_performance_tracking 
      (model_name, task_type, prompt_length, response_time_ms, success, quality_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.db.run(query, [modelName, taskType, promptLength, responseTimeMs, success, qualityScore]);
  }
}

module.exports = SmartModelSelector;
```

#### 2.2 N8N Function Node Template
Create template for N8N workflows:

```javascript
// N8N Function Node: Smart AI Request
const SmartModelSelector = require('/data/scripts/smart-model-selector.js');
const selector = new SmartModelSelector();

async function smartAIRequest(prompt, taskType = 'text-generation', complexity = 'medium') {
  const startTime = Date.now();
  
  try {
    // 1. Select optimal model
    const selection = await selector.selectOptimalModel(taskType, prompt, complexity);
    
    // 2. Make AI request with selected model
    const response = await $http.request({
      url: `${$env.OLLAMA_BASE_URL}/api/generate`,
      method: 'POST',
      body: {
        model: selection.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: taskType === 'analysis' ? 0.3 : 0.7,
          num_predict: taskType === 'summarization' ? 500 : 1000
        }
      },
      timeout: selection.timeout
    });

    const responseTime = Date.now() - startTime;
    
    // 3. Log performance
    await selector.logPerformance(
      selection.model,
      taskType,
      prompt.length,
      responseTime,
      true,
      0.8 // Default quality score - can be enhanced with feedback
    );

    return {
      response: response.response,
      model_used: selection.model,
      reasoning: selection.reasoning,
      response_time_ms: responseTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log failure
    await selector.logPerformance(
      selection?.model || 'unknown',
      taskType,
      prompt.length,
      responseTime,
      false,
      0.0
    );

    throw error;
  }
}

// Export for use in N8N
return [{ json: await smartAIRequest($json.prompt, $json.taskType, $json.complexity) }];
```

### Phase 3: Enhance Existing Workflows (Days 5-6)

#### 3.1 Update Unified Multi-Platform Digest
Replace direct Ollama calls with smart selector:

```javascript
// OLD: Direct Ollama call
const aiSummary = await $http.request({
  url: "http://ollama:11434/api/generate",
  method: "POST", 
  body: { model: "qwen2.5:7b", prompt: complexPrompt }
});

// NEW: Smart model selection
const aiSummary = await smartAIRequest(
  complexPrompt,
  'analysis',  // taskType
  'high'      // complexity
);
```

#### 3.2 Add Performance Monitoring Node
```javascript
// N8N Function Node: Performance Monitor
function updateWorkflowMetrics() {
  const metrics = {
    workflow_id: $workflow.id,
    execution_time: $execution.mode === 'manual' ? Date.now() - $execution.startedAt : null,
    ai_requests: $input.all().filter(item => item.json.model_used).length,
    models_used: [...new Set($input.all().map(item => item.json.model_used))],
    total_response_time: $input.all()
      .filter(item => item.json.response_time_ms)
      .reduce((sum, item) => sum + item.json.response_time_ms, 0)
  };

  // Store in SQLite for analysis
  // This can be expanded to trigger optimization rules
  
  return [{ json: metrics }];
}
```

### Phase 4: Add Simple Auto-Optimization (Days 7-8)

#### 4.1 Optimization Script
Create `scripts/ai-optimizer.js`:

```javascript
// Simple AI Optimization Engine
class SimpleAIOptimizer {
  constructor(dbPath = './data/jira_ai_memory.db') {
    this.sqlite3 = require('sqlite3');
    this.db = new this.sqlite3.Database(dbPath);
  }

  async runOptimization() {
    console.log('🤖 Running AI optimization...');
    
    // 1. Analyze recent performance
    const insights = await this.analyzePerformance();
    
    // 2. Update model selection rules if needed
    await this.updateModelRules(insights);
    
    // 3. Generate optimization report
    await this.generateReport(insights);
    
    console.log('✅ Optimization complete');
  }

  async analyzePerformance() {
    const query = `
      SELECT 
        model_name,
        task_type,
        AVG(response_time_ms) as avg_time,
        AVG(quality_score) as avg_quality,
        COUNT(*) as usage_count,
        (COUNT(*) * 1.0 / (SELECT COUNT(*) FROM model_performance_tracking WHERE timestamp > datetime('now', '-7 days'))) as usage_percentage
      FROM model_performance_tracking 
      WHERE timestamp > datetime('now', '-7 days')
      GROUP BY model_name, task_type
      HAVING usage_count >= 3
      ORDER BY usage_count DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async updateModelRules(insights) {
    for (const insight of insights) {
      // If a model is consistently fast and high quality, promote it
      if (insight.avg_quality > 0.8 && insight.avg_time < 20000 && insight.usage_count > 10) {
        console.log(`📈 Promoting ${insight.model_name} for ${insight.task_type}`);
        // Logic to update preferred model in rules
      }
      
      // If a model is slow or low quality, consider fallback
      if (insight.avg_quality < 0.6 || insight.avg_time > 60000) {
        console.log(`📉 Flagging ${insight.model_name} for review`);
        // Logic to flag for manual review
      }
    }
  }

  async generateReport(insights) {
    const report = {
      timestamp: new Date().toISOString(),
      total_requests: insights.reduce((sum, i) => sum + i.usage_count, 0),
      best_performers: insights.filter(i => i.avg_quality > 0.8 && i.avg_time < 30000),
      needs_attention: insights.filter(i => i.avg_quality < 0.6 || i.avg_time > 45000),
      recommendations: this.generateRecommendations(insights)
    };

    // Store report in SQLite or log file
    console.log('📊 Optimization Report:', JSON.stringify(report, null, 2));
  }

  generateRecommendations(insights) {
    const recommendations = [];
    
    // Add specific recommendations based on performance data
    const slowModels = insights.filter(i => i.avg_time > 40000);
    if (slowModels.length > 0) {
      recommendations.push(`Consider reducing complexity for models: ${slowModels.map(m => m.model_name).join(', ')}`);
    }

    const underutilized = insights.filter(i => i.usage_percentage < 0.1 && i.avg_quality > 0.7);
    if (underutilized.length > 0) {
      recommendations.push(`Consider promoting underutilized high-quality models: ${underutilized.map(m => m.model_name).join(', ')}`);
    }

    return recommendations;
  }
}

module.exports = SimpleAIOptimizer;
```

#### 4.2 Cron Job for Optimization
Add to existing monitoring scripts:

```bash
#!/bin/bash
# File: scripts/daily-ai-optimization.sh

echo "🤖 Running daily AI optimization..."

# Run the optimization script
cd /data
node scripts/ai-optimizer.js

# Clean up old performance data (keep 30 days)
sqlite3 data/jira_ai_memory.db "DELETE FROM model_performance_tracking WHERE timestamp < datetime('now', '-30 days');"

echo "✅ Daily AI optimization complete"
```

### Phase 5: Monitoring and Dashboards (Days 9-10)

#### 5.1 Grafana Dashboard Enhancement
Add AI model performance panels to existing dashboards:

```json
{
  "title": "AI Model Performance",
  "type": "stat",
  "targets": [
    {
      "expr": "avg_over_time(ai_response_time_ms[5m])",
      "legendFormat": "Avg Response Time"
    }
  ]
}
```

#### 5.2 Prometheus Metrics Export
Enhance `scripts/ollama-metrics-exporter.py`:

```python
# Add AI model performance metrics
def export_ai_metrics():
    # Read from SQLite and export to Prometheus
    conn = sqlite3.connect('./data/jira_ai_memory.db')
    
    # Model usage metrics
    usage_data = conn.execute("""
        SELECT model_name, COUNT(*) as usage_count 
        FROM model_performance_tracking 
        WHERE timestamp > datetime('now', '-1 hour')
        GROUP BY model_name
    """).fetchall()
    
    for model, count in usage_data:
        model_usage_counter.labels(model=model).inc(count)
```

## Benefits of Simplified Approach

### Immediate Wins
- ✅ **No Infrastructure Changes**: Uses existing SQLite, Docker, N8N setup
- ✅ **Preserves Working System**: Current workflows continue to function
- ✅ **Quick Implementation**: 7-10 days vs 15+ days for full framework
- ✅ **Lower Risk**: Incremental changes with rollback capability

### Enhanced Capabilities
- 🧠 **Intelligent Model Selection**: Automatic model optimization based on task type and performance
- 📊 **Performance Tracking**: Enhanced monitoring of AI model efficiency
- 🔄 **Self-Optimization**: Simple learning algorithm that improves over time
- 🎯 **Task-Specific Routing**: Different models for different complexity levels

### Resource Efficiency
- 💾 **Memory Optimized**: Works within existing 4GB constraints
- ⚡ **Performance Focused**: Reduces response times through optimal model selection
- 💰 **Cost Effective**: Better resource utilization without additional infrastructure

## Implementation Timeline

| Day | Task | Deliverable |
|-----|------|------------|
| 1-2 | Extend SQLite schema and seed data | Enhanced AI memory database |
| 3-4 | Create smart model selector | N8N function nodes for intelligent routing |
| 5-6 | Update existing workflows | Enhanced digest workflows |
| 7-8 | Add optimization engine | Automated performance improvement |
| 9-10 | Enhance monitoring | Updated dashboards and metrics |

## Success Metrics

### Performance Improvements
- **Response Time**: 15-25% improvement through optimal model selection
- **Success Rate**: 95%+ successful AI requests (up from current baseline)
- **Resource Efficiency**: Better CPU/memory utilization tracking

### Operational Benefits
- **Reliability**: Automatic fallback to working models
- **Observability**: Better insights into AI performance
- **Maintainability**: Clear performance data for decision making

## Migration Path to Full Framework

If the simplified approach proves successful, it provides a clear path to the full framework:

1. **Database Migration**: SQLite → PostgreSQL (data migration tools)
2. **API Layer**: Extract model selector logic to dedicated API service  
3. **Container Orchestration**: Add dynamic container management
4. **Advanced ML**: Upgrade optimization engine with ML capabilities

## Risk Mitigation

### Low Risk Implementation
- **Backward Compatibility**: Old workflows continue to work during migration
- **Gradual Rollout**: Test with single workflow before full deployment
- **Easy Rollback**: Simple to disable smart selection and revert to direct calls

### Testing Strategy
- **A/B Testing**: Compare smart vs direct model calls
- **Performance Benchmarking**: Measure before/after metrics
- **Workflow Validation**: Ensure digest quality remains high

## Conclusion

This simplified approach provides 80% of the benefits of the full AI Model Dispatcher Framework with 20% of the implementation complexity. It builds on existing strengths, preserves system stability, and provides a foundation for future enhancements.

The approach is:
- ✅ **Practical**: Works with current infrastructure
- ✅ **Proven**: Based on existing working patterns
- ✅ **Progressive**: Enables future migration to full framework
- ✅ **Performant**: Immediate improvements to AI response quality and speed

**Recommendation**: Implement this simplified v2 approach first, measure results, then decide if full framework migration is needed.