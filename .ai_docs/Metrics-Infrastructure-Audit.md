# Metrics Infrastructure Audit & Verification

**Created**: 2025-06-26  
**Status**: Pre-Implementation Verification  
**Goal**: Ensure all metrics are accessible for AI Model Dispatcher  

## Current Metrics Infrastructure ✅

### 1. **Prometheus Configuration Analysis**
Your Prometheus setup is comprehensive and well-configured:

```yaml
# ✅ EXCELLENT: All key services are being monitored
scrape_configs:
  - job_name: 'prometheus'     # Self-monitoring
  - job_name: 'cadvisor'       # Container resource metrics
  - job_name: 'n8n'           # N8N workflow metrics  
  - job_name: 'redis'         # Cache performance
  - job_name: 'nginx'         # Web server metrics
  - job_name: 'qdrant'        # Vector database
  - job_name: 'node-exporter' # System metrics
  - job_name: 'docker-exporter' # Docker events
  - job_name: 'ollama'        # AI model metrics ⭐
```

### 2. **Ollama Metrics Exporter Analysis** ⭐
Your custom Ollama metrics exporter is **excellent** and provides all the AI-specific metrics we need:

#### Available AI Metrics:
```python
# ✅ PERFECT for AI Model Dispatcher:
ollama_up                           # Service availability
ollama_models_loaded               # Number of active models
ollama_model_memory_usage_bytes    # Memory per model
ollama_model_size_bytes           # Model size
ollama_request_duration_seconds    # Response time by model
ollama_requests_total             # Success/failure rates
ollama_generation_tokens          # Token generation metrics
ollama_generation_speed_tokens_per_second  # Performance speed
ollama_queue_depth                # Current queue status
ollama_info                       # Version info
```

### 3. **Grafana Dashboard Assessment**
You already have Ollama-specific dashboards:
- `ollama-monitoring.json` - Service health monitoring
- `ollama-performance.json` - Performance metrics
- Integration with Prometheus datasource configured

## Metrics Verification Checklist

### Step 1: Verify Data Flow ✅
Let's confirm all metrics are flowing correctly:

```bash
# Test 1: Check if Prometheus is scraping Ollama metrics
curl -s "http://localhost:9090/api/v1/query?query=ollama_up" | jq '.'

# Test 2: Verify model metrics are available
curl -s "http://localhost:9090/api/v1/query?query=ollama_models_loaded" | jq '.'

# Test 3: Check if performance metrics exist
curl -s "http://localhost:9090/api/v1/query?query=ollama_request_duration_seconds" | jq '.'

# Test 4: Verify system metrics for resource awareness
curl -s "http://localhost:9090/api/v1/query?query=node_memory_MemAvailable_bytes" | jq '.'
```

### Step 2: Essential Queries for AI Dispatcher

#### 2.1 Resource Availability Queries
```promql
# Memory availability percentage
(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# CPU usage percentage (5-minute average)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# System load average
node_load1

# Container memory usage for Ollama
container_memory_usage_bytes{name="ollama"} / 1024 / 1024 / 1024
```

#### 2.2 Ollama Performance Queries
```promql
# Current models loaded
ollama_models_loaded

# Average response time by model (5min window)
avg_over_time(ollama_request_duration_seconds[5m]) by (model)

# Request success rate by model
rate(ollama_requests_total{status="success"}[5m]) / rate(ollama_requests_total[5m])

# Generation speed by model
ollama_generation_speed_tokens_per_second

# Memory usage by model
ollama_model_memory_usage_bytes
```

#### 2.3 N8N Workflow Queries
```promql
# N8N workflow executions
rate(n8n_workflow_executions_total[5m])

# Pending executions (queue depth)
n8n_executions_pending

# Execution success rate
rate(n8n_workflow_executions_total{status="success"}[5m]) / rate(n8n_workflow_executions_total[5m])
```

### Step 3: Missing Metrics Identification

#### 3.1 Additional Metrics Needed for AI Dispatcher
```python
# Add to ollama-metrics-exporter.py:

# Model selection decision tracking
ai_model_selections_total = Counter('ai_model_selections_total', 'AI model selections', ['model', 'reason', 'task_type'])

# Resource-based decision metrics  
ai_resource_decisions_total = Counter('ai_resource_decisions_total', 'Resource-based decisions', ['decision_type', 'trigger'])

# Container lifecycle metrics
ai_container_lifecycle_events = Counter('ai_container_lifecycle_events', 'Container lifecycle', ['container', 'event'])

# Performance optimization metrics
ai_optimization_actions_total = Counter('ai_optimization_actions_total', 'Optimization actions', ['action_type'])
```

## Metrics Verification Script

Create this verification script to test all required metrics:

```bash
#!/bin/bash
# File: scripts/verify-metrics.sh

echo "🔍 Verifying Metrics Infrastructure for AI Model Dispatcher"
echo "=================================================="

PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"
OLLAMA_METRICS_URL="http://localhost:9435"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_metric() {
    local query="$1"
    local description="$2"
    
    echo -n "Checking: $description... "
    
    response=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=${query}")
    result_type=$(echo "$response" | jq -r '.data.resultType // "empty"')
    
    if [ "$result_type" = "vector" ] || [ "$result_type" = "scalar" ]; then
        result_count=$(echo "$response" | jq -r '.data.result | length')
        if [ "$result_count" -gt 0 ]; then
            echo -e "${GREEN}✅ Available ($result_count results)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️ No data${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Not available${NC}"
        return 1
    fi
}

echo "📊 System Metrics Verification"
echo "-----------------------------"
check_metric "node_memory_MemAvailable_bytes" "Memory availability"
check_metric "node_cpu_seconds_total" "CPU metrics"
check_metric "node_load1" "System load"
check_metric "node_filesystem_avail_bytes" "Disk usage"

echo ""
echo "🐳 Container Metrics Verification"
echo "--------------------------------"
check_metric "container_memory_usage_bytes" "Container memory"
check_metric "container_cpu_usage_seconds_total" "Container CPU"
check_metric "container_last_seen" "Container health"

echo ""
echo "🤖 Ollama Metrics Verification"
echo "-----------------------------"
check_metric "ollama_up" "Ollama service status"
check_metric "ollama_models_loaded" "Loaded models count"
check_metric "ollama_request_duration_seconds" "Request duration"
check_metric "ollama_requests_total" "Request counters"
check_metric "ollama_generation_speed_tokens_per_second" "Generation speed"
check_metric "ollama_model_memory_usage_bytes" "Model memory usage"

echo ""
echo "🔄 N8N Metrics Verification"
echo "-------------------------"
check_metric "n8n_workflow_executions_total" "Workflow executions"
check_metric "nodejs_heap_size_used_bytes" "N8N memory usage"
check_metric "nodejs_eventloop_lag_seconds" "N8N event loop"

echo ""
echo "🌐 Service Health Check"
echo "---------------------"

# Check Prometheus
echo -n "Prometheus API... "
if curl -s "${PROMETHEUS_URL}/api/v1/status/config" > /dev/null; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${RED}❌ Not accessible${NC}"
fi

# Check Grafana
echo -n "Grafana API... "
if curl -s "${GRAFANA_URL}/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${RED}❌ Not accessible${NC}"
fi

# Check Ollama Metrics Exporter
echo -n "Ollama Metrics Exporter... "
if curl -s "${OLLAMA_METRICS_URL}/metrics" > /dev/null; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${RED}❌ Not accessible${NC}"
fi

echo ""
echo "🎯 AI Dispatcher Readiness Assessment"
echo "====================================="

# Test key queries needed for AI dispatcher
echo "Testing AI dispatcher essential queries:"

# Resource awareness test
available_memory=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=(node_memory_MemAvailable_bytes/node_memory_MemTotal_bytes)*100" | jq -r '.data.result[0].value[1] // "0"')
echo "Available Memory: ${available_memory}%"

# Ollama status test
ollama_status=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=ollama_up" | jq -r '.data.result[0].value[1] // "0"')
if [ "$ollama_status" = "1" ]; then
    echo -e "Ollama Status: ${GREEN}✅ Running${NC}"
else
    echo -e "Ollama Status: ${RED}❌ Down${NC}"
fi

# Models loaded test
models_loaded=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=ollama_models_loaded" | jq -r '.data.result[0].value[1] // "0"')
echo "Models Loaded: $models_loaded"

echo ""
echo "✅ Metrics verification complete!"
echo "Ready to implement AI Model Dispatcher with existing infrastructure."
```

## Grafana Dashboard Enhancement

### Enhanced AI Dispatcher Dashboard
```json
{
  "dashboard": {
    "title": "AI Model Dispatcher - Intelligent Routing",
    "tags": ["ai", "ollama", "dispatcher"],
    "panels": [
      {
        "title": "AI Dispatcher Status",
        "type": "stat",
        "targets": [
          {
            "expr": "ollama_up",
            "legendFormat": "Ollama Service"
          },
          {
            "expr": "ollama_models_loaded", 
            "legendFormat": "Models Loaded"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "title": "Resource-Aware Model Selection",
        "type": "timeseries",
        "targets": [
          {
            "expr": "(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
            "legendFormat": "Available Memory %"
          },
          {
            "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "node_load1",
            "legendFormat": "Load Average"
          }
        ]
      },
      {
        "title": "Model Performance Comparison",
        "type": "table",
        "targets": [
          {
            "expr": "avg_over_time(ollama_request_duration_seconds[1h]) by (model)",
            "legendFormat": "{{model}}"
          }
        ]
      },
      {
        "title": "AI Container Lifecycle",
        "type": "timeseries", 
        "targets": [
          {
            "expr": "container_memory_usage_bytes{name=\"ollama\"} / 1024 / 1024 / 1024",
            "legendFormat": "Ollama Memory (GB)"
          },
          {
            "expr": "rate(container_cpu_usage_seconds_total{name=\"ollama\"}[5m]) * 100",
            "legendFormat": "Ollama CPU %"
          }
        ]
      }
    ]
  }
}
```

## Implementation Readiness ✅

### What We Have (Excellent!):
- ✅ **Comprehensive Prometheus setup** with all required metrics
- ✅ **Custom Ollama metrics exporter** with AI-specific data
- ✅ **Grafana dashboards** already configured for Ollama
- ✅ **System metrics** (CPU, memory, disk) via node-exporter
- ✅ **Container metrics** via cAdvisor
- ✅ **N8N metrics** for workflow monitoring

### What We Need to Add (Minimal):
- 🔧 **AI dispatcher decision metrics** (add to ollama exporter)
- 🔧 **Enhanced Grafana panels** for model selection intelligence
- 🔧 **Prometheus alerting rules** for AI optimization

### Next Steps:
1. **Run metrics verification script** to confirm all data is accessible
2. **Test key Prometheus queries** for AI dispatcher functionality  
3. **Add missing AI dispatcher metrics** to ollama-metrics-exporter.py
4. **Create enhanced Grafana dashboard** for AI model selection
5. **Implement AI dispatcher** using verified metrics

Your infrastructure is **excellent** and ready for the AI Model Dispatcher! 🚀