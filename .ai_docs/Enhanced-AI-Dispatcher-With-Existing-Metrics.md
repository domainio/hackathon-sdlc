# Enhanced AI Model Dispatcher - Leveraging Existing Metrics

**Created**: 2025-06-26  
**Focus**: Build on existing Prometheus/Grafana monitoring infrastructure  
**Goal**: Intelligent AI management using current metrics ecosystem  

## Existing Monitoring Infrastructure ✅

### Current Metrics Sources
```yaml
# Already collecting metrics from:
- Prometheus (9090)           # Central metrics collection
- Grafana (3000)             # Visualization and dashboards  
- Node Exporter (9100)       # System metrics (CPU, memory, disk)
- cAdvisor (8080)            # Container resource usage
- Redis Exporter (9121)      # Cache performance
- Nginx Exporter (9113)      # Web server metrics
- Docker Exporter (9417)     # Container lifecycle events
- Ollama Metrics Exporter (9435)  # AI model performance
```

### N8N Metrics Already Available
```bash
# N8N is already configured with comprehensive metrics:
N8N_METRICS=true
N8N_METRICS_INCLUDE_QUEUE_METRICS=true
N8N_METRICS_INCLUDE_WORKFLOW_ID_LABEL=true
N8N_METRICS_INCLUDE_NODE_TYPE_LABEL=true
N8N_METRICS_INCLUDE_CREDENTIAL_TYPE_LABEL=true
N8N_METRICS_INCLUDE_API_ENDPOINTS=true
N8N_METRICS_PREFIX=n8n_
```

## Enhanced AI Dispatcher Using Existing Metrics

### 1. **Metrics-Driven Model Selection**

#### 1.1 Resource-Aware Selection Using Current Metrics
```javascript
// Enhanced model selector that queries existing Prometheus metrics
class MetricsAwareModelSelector {
  constructor() {
    this.prometheusUrl = 'http://prometheus:9090';
    this.metricsCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  async selectOptimalModel(taskType, prompt, complexity = 'medium') {
    // Get current system metrics from existing infrastructure
    const systemMetrics = await this.getCurrentSystemMetrics();
    const ollamaMetrics = await this.getOllamaMetrics();
    const containerMetrics = await this.getContainerMetrics();

    // Use existing performance data to make intelligent decisions
    const modelRecommendation = await this.analyzeMetricsForModel(
      systemMetrics, ollamaMetrics, containerMetrics, taskType, complexity
    );

    return modelRecommendation;
  }

  async getCurrentSystemMetrics() {
    // Leverage existing node-exporter metrics
    const queries = {
      memoryUsage: 'node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100',
      cpuUsage: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
      loadAverage: 'node_load1',
      diskUsage: 'node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100'
    };

    const metrics = {};
    for (const [key, query] of Object.entries(queries)) {
      metrics[key] = await this.queryPrometheus(query);
    }

    return metrics;
  }

  async getOllamaMetrics() {
    // Use existing ollama-metrics-exporter data
    const queries = {
      modelLoadTime: 'ollama_model_load_duration_seconds',
      activeModels: 'ollama_models_loaded',
      requestQueue: 'ollama_requests_queued',
      responseTime: 'rate(ollama_request_duration_seconds[5m])',
      errorRate: 'rate(ollama_requests_failed_total[5m])'
    };

    const metrics = {};
    for (const [key, query] of Object.entries(queries)) {
      metrics[key] = await this.queryPrometheus(query);
    }

    return metrics;
  }

  async getContainerMetrics() {
    // Use existing cAdvisor metrics for container resource usage
    const queries = {
      ollamaMemoryUsage: 'container_memory_usage_bytes{name="ollama"}',
      ollamaCpuUsage: 'rate(container_cpu_usage_seconds_total{name="ollama"}[5m])',
      containerHealth: 'container_last_seen{name="ollama"}',
      networkIO: 'rate(container_network_receive_bytes_total{name="ollama"}[5m])'
    };

    const metrics = {};
    for (const [key, query] of Object.entries(queries)) {
      metrics[key] = await this.queryPrometheus(query);
    }

    return metrics;
  }

  async analyzeMetricsForModel(systemMetrics, ollamaMetrics, containerMetrics, taskType, complexity) {
    // Intelligence based on real metrics
    const availableMemoryGB = systemMetrics.memoryUsage / 1024 / 1024 / 1024;
    const cpuUsage = systemMetrics.cpuUsage;
    const currentLoad = systemMetrics.loadAverage;

    // Model selection logic using actual performance data
    if (availableMemoryGB < 2 || cpuUsage > 85 || currentLoad > 4) {
      return {
        model: 'phi3:mini',
        reasoning: `System under load: ${cpuUsage.toFixed(1)}% CPU, ${availableMemoryGB.toFixed(1)}GB available`,
        timeout: 15000,
        priority: 'resource_conservation'
      };
    }

    if (ollamaMetrics.requestQueue > 3) {
      return {
        model: taskType === 'analysis' ? 'llama3.2:3b' : 'phi3:mini',
        reasoning: `Queue backlog detected: ${ollamaMetrics.requestQueue} requests pending`,
        timeout: 20000,
        priority: 'queue_management'
      };
    }

    // Normal operation - use complexity-based selection
    const modelMap = {
      'low': 'phi3:mini',
      'medium': 'llama3.2:3b', 
      'high': 'qwen2.5:7b'
    };

    return {
      model: modelMap[complexity] || 'llama3.2:3b',
      reasoning: `Normal operation: ${complexity} complexity, ${availableMemoryGB.toFixed(1)}GB available`,
      timeout: complexity === 'high' ? 60000 : 30000,
      priority: 'optimal_performance'
    };
  }

  async queryPrometheus(query) {
    const cacheKey = query;
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const response = await fetch(
        `${this.prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      const value = data.data?.result?.[0]?.value?.[1] || 0;
      this.metricsCache.set(cacheKey, { value: parseFloat(value), timestamp: Date.now() });
      
      return parseFloat(value);
    } catch (error) {
      console.error(`Failed to query Prometheus: ${error.message}`);
      return 0; // Fallback value
    }
  }
}
```

### 2. **On-Demand Container Management with Metrics**

#### 2.1 Metrics-Driven Lifecycle Management
```javascript
// Container lifecycle manager using existing monitoring
class MetricsBasedLifecycleManager {
  constructor() {
    this.prometheusUrl = 'http://prometheus:9090';
    this.dockerApiUrl = 'http://localhost:2376';
  }

  async shouldStartAIServices() {
    // Check if AI services are needed based on N8N metrics
    const n8nMetrics = await this.queryPrometheus('n8n_workflow_executions_total');
    const pendingExecutions = await this.queryPrometheus('n8n_executions_pending');
    const systemLoad = await this.queryPrometheus('node_load1');

    // Start AI services if there are pending AI workflows and system can handle it
    return pendingExecutions > 0 && systemLoad < 3;
  }

  async shouldStopAIServices() {
    // Check recent AI activity using existing metrics
    const recentRequests = await this.queryPrometheus(
      'sum(rate(ollama_requests_total[10m]))'
    );
    const ollamaMemoryUsage = await this.queryPrometheus(
      'container_memory_usage_bytes{name="ollama"} / 1024 / 1024 / 1024'
    );

    // Stop if no recent activity and consuming significant memory
    return recentRequests === 0 && ollamaMemoryUsage > 1;
  }

  async manageAIContainers() {
    const shouldStart = await this.shouldStartAIServices();
    const shouldStop = await this.shouldStopAIServices();
    const isRunning = await this.isOllamaRunning();

    if (shouldStart && !isRunning) {
      await this.startAIServices();
    } else if (shouldStop && isRunning) {
      await this.stopAIServices();
    }
  }

  async isOllamaRunning() {
    try {
      const response = await fetch('http://ollama:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  async startAIServices() {
    console.log('🚀 Starting AI services based on metrics...');
    
    // Use existing Docker profiles
    const command = 'docker-compose --profile ai up -d ollama sqlite-ai';
    await this.executeCommand(command);
    
    // Wait for readiness using existing health checks
    await this.waitForReadiness();
  }

  async stopAIServices() {
    console.log('🛑 Stopping AI services to conserve resources...');
    
    // Graceful shutdown
    const command = 'docker-compose stop ollama sqlite-ai';
    await this.executeCommand(command);
  }
}
```

### 3. **Enhanced Grafana Dashboards for AI Management**

#### 3.1 AI Model Performance Dashboard
```json
{
  "dashboard": {
    "title": "AI Model Dispatcher Performance",
    "panels": [
      {
        "title": "Model Selection Intelligence",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(ai_model_selections_total[1h])",
            "legendFormat": "Models Selected (1h)"
          }
        ]
      },
      {
        "title": "Resource-Based Model Decisions",
        "type": "piechart", 
        "targets": [
          {
            "expr": "ai_model_selection_reasons",
            "legendFormat": "{{reason}}"
          }
        ]
      },
      {
        "title": "AI Container Lifecycle",
        "type": "timeseries",
        "targets": [
          {
            "expr": "container_last_seen{name=\"ollama\"}",
            "legendFormat": "Ollama Uptime"
          },
          {
            "expr": "container_memory_usage_bytes{name=\"ollama\"} / 1024 / 1024 / 1024",
            "legendFormat": "Memory Usage (GB)"
          }
        ]
      },
      {
        "title": "Model Performance by Type",
        "type": "table",
        "targets": [
          {
            "expr": "avg_over_time(ollama_request_duration_seconds[1h]) by (model)",
            "legendFormat": "{{model}}"
          }
        ]
      },
      {
        "title": "Resource Efficiency Gains", 
        "type": "stat",
        "targets": [
          {
            "expr": "ai_resource_savings_percentage",
            "legendFormat": "Memory Savings %"
          }
        ]
      }
    ]
  }
}
```

#### 3.2 Automated Alerting Rules  
```yaml
# Add to existing Prometheus alerting rules
groups:
  - name: ai_dispatcher_alerts
    rules:
      - alert: AIServiceHighResourceUsage
        expr: container_memory_usage_bytes{name="ollama"} / 1024 / 1024 / 1024 > 3.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI service using high memory"
          description: "Ollama container using {{ $value }}GB memory"

      - alert: AIModelPerformanceDegraded
        expr: avg_over_time(ollama_request_duration_seconds[10m]) > 45
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI model response time degraded"
          description: "Average response time: {{ $value }}s"

      - alert: AIServicesIdleTooLong
        expr: rate(ollama_requests_total[30m]) == 0 and container_memory_usage_bytes{name="ollama"} > 0
        for: 30m
        labels:
          severity: info
        annotations:
          summary: "AI services idle - consider shutdown"
          description: "No AI requests in 30 minutes, wasting resources"
```

### 4. **N8N Integration with Existing Metrics**

#### 4.1 Enhanced N8N Function Node
```javascript
// N8N Function Node: Metrics-Aware AI Request
async function metricsAwareAIRequest() {
  const MetricsAwareSelector = require('/data/scripts/metrics-aware-selector.js');
  const selector = new MetricsAwareSelector();

  // Get optimal model based on current system state
  const selection = await selector.selectOptimalModel(
    $json.taskType || 'general',
    $json.prompt,
    $json.complexity || 'medium'
  );

  console.log(`🧠 Selected model: ${selection.model} (${selection.reasoning})`);

  // Ensure AI services are available (with automatic startup)
  const lifecycleManager = new MetricsBasedLifecycleManager();
  await lifecycleManager.manageAIContainers();

  // Make AI request with selected model
  const startTime = Date.now();
  try {
    const response = await $http.request({
      url: 'http://ollama:11434/api/generate',
      method: 'POST',
      body: {
        model: selection.model,
        prompt: $json.prompt,
        stream: false,
        options: getOptimalParameters(selection.model, $json.taskType)
      },
      timeout: selection.timeout
    });

    const responseTime = Date.now() - startTime;

    // Log performance metrics to existing monitoring
    await logToPrometheus({
      model: selection.model,
      taskType: $json.taskType,
      responseTime: responseTime,
      success: true,
      selectionReason: selection.priority
    });

    return [{
      json: {
        response: response.response,
        model_used: selection.model,
        response_time_ms: responseTime,
        selection_reasoning: selection.reasoning,
        metrics_driven: true
      }
    }];

  } catch (error) {
    // Log failure to existing monitoring
    await logToPrometheus({
      model: selection.model,
      taskType: $json.taskType,
      responseTime: Date.now() - startTime,
      success: false,
      error: error.message
    });

    throw error;
  }
}

function getOptimalParameters(model, taskType) {
  const paramMap = {
    'phi3:mini': { temperature: 0.5, num_predict: 500 },
    'llama3.2:3b': { temperature: 0.7, num_predict: 1000 },
    'qwen2.5:7b': { temperature: 0.3, num_predict: 2048 }
  };
  
  return paramMap[model] || paramMap['llama3.2:3b'];
}

async function logToPrometheus(metrics) {
  // Export custom metrics to existing Prometheus setup
  // This would integrate with your existing ollama-metrics-exporter
  console.log('📊 Metrics logged:', metrics);
}

// Execute the function
return await metricsAwareAIRequest();
```

## Quick Implementation Steps

### 1. **Immediate (2 hours)**
- Add metrics-aware model selection to existing workflows
- Create custom Grafana panels for AI dispatcher metrics
- Test with existing Prometheus/Grafana setup

### 2. **This Week (2-3 days)**  
- Implement automated container lifecycle management
- Add AI-specific alerting rules to existing Prometheus
- Enhance N8N workflows with metrics-driven decisions

### 3. **Optimization (1 week)**
- Fine-tune model selection algorithms based on collected metrics
- Add predictive scaling based on N8N workflow patterns
- Create automated optimization reports

## Benefits of Leveraging Existing Infrastructure

### ✅ **No Additional Infrastructure**
- Uses existing Prometheus/Grafana setup
- Leverages current Docker monitoring
- Builds on established N8N metrics

### ✅ **Enhanced Intelligence**
- Real-time resource-aware decisions
- Historical performance optimization
- Automated alerting and scaling

### ✅ **Operational Excellence**
- Unified monitoring dashboard
- Consistent alerting strategy
- Integrated with existing workflows

This approach gives you the full AI Model Dispatcher capabilities while maximizing the value of your existing monitoring infrastructure!