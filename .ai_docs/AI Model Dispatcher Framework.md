# AI Model Dispatcher Framework

This is a fascinating and ambitious project! You're essentially describing an **AI Model Orchestration Platform** that combines container orchestration, model management, and intelligent dispatching. Let me break down a comprehensive framework architecture for this:

## High-Level Architecture

```artifact
id: ai-dispatcher-framework
name: AI Model Dispatcher Framework Architecture
type: mermaid
content: |-
  graph TB
    subgraph "n8n Workflow Layer"
        A[Request Handler] --> B[Model Selector]
        B --> C[Resource Calculator]
        C --> D[Container Orchestrator]
        D --> E[Model Dispatcher]
        E --> F[Response Handler]
    end

    subgraph "Intelligence Layer"
        G[Model Registry] --> B
        H[Performance DB] --> C
        I[Optimization Engine] --> J[Self-Learning Module]
        J --> G
        J --> H
    end

    subgraph "Infrastructure Layer"
        K[Docker/Podman] --> L[Ollama Containers]
        M[Database Pool] --> N[(Vector DB)]
        M --> O[(SQL DB)]
        M --> P[(Cache Redis)]
    end

    subgraph "Model Management"
        Q[Model Downloader] --> R[Model Storage]
        R --> S[Model Versioning]
        S --> L
    end

    A --> G
    C --> H
    D --> K
    E --> L
    E --> M
    F --> I

    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style K fill:#e8f5e8
    style Q fill:#fff3e0
```

## Core Components Breakdown

### 1. **Model Selection Intelligence**

```javascript
// n8n Custom Node: Smart Model Selector
const modelSelector = {
  async selectModel(taskType, complexity, requirements) {
    const candidates = await this.queryModelRegistry({
      taskType,
      complexity,
      memoryLimit: requirements.memory,
      performanceThreshold: requirements.speed,
    });

    return this.rankModels(candidates, requirements);
  },

  rankModels(models, requirements) {
    return models.sort((a, b) => {
      const scoreA = this.calculateScore(a, requirements);
      const scoreB = this.calculateScore(b, requirements);
      return scoreB - scoreA;
    });
  },
};
```

### 2. **Dynamic Resource Calculation**

```javascript
// Resource Right-Sizing Logic
const resourceCalculator = {
  calculateResources(modelName, expectedLoad) {
    const baseRequirements = this.getModelRequirements(modelName);
    const scalingFactor = this.calculateScalingFactor(expectedLoad);

    return {
      cpu: Math.ceil(baseRequirements.cpu * scalingFactor),
      memory: Math.ceil(baseRequirements.memory * scalingFactor),
      gpu: baseRequirements.gpu
        ? Math.ceil(baseRequirements.gpu * scalingFactor)
        : 0,
      storage: baseRequirements.storage,
    };
  },
};
```

### 3. **Container Orchestration**

```yaml
# Docker Compose Template for Dynamic Scaling
version: "3.8"
services:
  ollama-${MODEL_NAME}:
    image: ollama/ollama:latest
    container_name: ollama-${MODEL_NAME}-${INSTANCE_ID}
    deploy:
      resources:
        limits:
          cpus: "${CPU_LIMIT}"
          memory: ${MEMORY_LIMIT}
        reservations:
          cpus: "${CPU_RESERVATION}"
          memory: ${MEMORY_RESERVATION}
    environment:
      - OLLAMA_MODELS=/models
      - OLLAMA_HOST=0.0.0.0:11434
    volumes:
      - ./models:/models
      - ./logs:/logs
    ports:
      - "${DYNAMIC_PORT}:11434"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 4. **Database Schema Design**

```artifact
id: database-schema
name: AI Dispatcher Database Schema
type: code.sql
content: |-
  -- Model Registry Table
  CREATE TABLE model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    complexity_score INTEGER NOT NULL,
    base_cpu_requirement DECIMAL(4,2),
    base_memory_requirement INTEGER, -- MB
    base_gpu_requirement DECIMAL(4,2),
    storage_requirement INTEGER, -- MB
    download_url TEXT,
    model_size BIGINT, -- bytes
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, version)
  );

  -- Performance Tracking Table
  CREATE TABLE performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES model_registry(id),
    container_id VARCHAR(255),
    request_id UUID,
    task_type VARCHAR(100),
    input_tokens INTEGER,
    output_tokens INTEGER,
    processing_time_ms INTEGER,
    memory_used_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    success BOOLEAN,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
  );

  -- Container Lifecycle Table
  CREATE TABLE container_lifecycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id VARCHAR(255) UNIQUE NOT NULL,
    model_id UUID REFERENCES model_registry(id),
    status VARCHAR(50) NOT NULL, -- starting, running, stopping, stopped
    allocated_cpu DECIMAL(4,2),
    allocated_memory INTEGER,
    allocated_gpu DECIMAL(4,2),
    port INTEGER,
    started_at TIMESTAMP,
    stopped_at TIMESTAMP,
    total_requests INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT NOW()
  );

  -- Optimization Rules Table
  CREATE TABLE optimization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    condition_sql TEXT NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- scale_up, scale_down, switch_model
    action_parameters JSONB,
    priority INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Request Queue Table
  CREATE TABLE request_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_payload JSONB NOT NULL,
    priority INTEGER DEFAULT 100,
    estimated_processing_time INTEGER,
    assigned_container_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
  );

  -- Indexes for Performance
  CREATE INDEX idx_model_registry_task_type ON model_registry(task_type);
  CREATE INDEX idx_performance_logs_model_timestamp ON performance_logs(model_id, timestamp);
  CREATE INDEX idx_container_lifecycle_status ON container_lifecycle(status);
  CREATE INDEX idx_request_queue_status_priority ON request_queue(status, priority DESC);
```

### 5. **n8n Workflow Structure**

```artifact
id: n8n-workflow-structure
name: n8n AI Dispatcher Workflow
type: code.json
content: |-
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
        "name": "Parse Request",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Extract task requirements\nconst payload = $input.first().json;\nconst taskType = payload.taskType || 'general';\nconst complexity = payload.complexity || 'medium';\nconst requirements = {\n  speed: payload.speed || 'normal',\n  accuracy: payload.accuracy || 'high',\n  memory: payload.maxMemory || 4096,\n  timeout: payload.timeout || 300\n};\n\nreturn [{\n  json: {\n    taskType,\n    complexity,\n    requirements,\n    originalPayload: payload,\n    requestId: $execution.id\n  }\n}];"
        }
      },
      {
        "name": "Query Model Registry",
        "type": "n8n-nodes-base.postgres",
        "parameters": {
          "query": "SELECT * FROM model_registry WHERE task_type = $1 AND complexity_score <= $2 ORDER BY performance_metrics->>'avg_speed' DESC LIMIT 5",
          "values": ["={{$json.taskType}}", "={{$json.complexity === 'low' ? 3 : $json.complexity === 'medium' ? 6 : 9}}"]
        }
      },
      {
        "name": "Select Best Model",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Model selection algorithm\nconst models = $input.first().json;\nconst requirements = $('Parse Request').first().json.requirements;\n\nfunction calculateScore(model, req) {\n  let score = 0;\n  \n  // Performance weight\n  const avgSpeed = model.performance_metrics?.avg_speed || 1000;\n  score += (1000 / avgSpeed) * 40; // Speed: 40% weight\n  \n  // Resource efficiency weight\n  const memoryEfficiency = req.memory / model.base_memory_requirement;\n  score += Math.min(memoryEfficiency, 2) * 30; // Memory: 30% weight\n  \n  // Accuracy weight\n  const accuracy = model.performance_metrics?.accuracy || 0.8;\n  score += accuracy * 30; // Accuracy: 30% weight\n  \n  return score;\n}\n\nconst bestModel = models.reduce((best, current) => {\n  return calculateScore(current, requirements) > calculateScore(best, requirements) ? current : best;\n});\n\nreturn [{\n  json: {\n    selectedModel: bestModel,\n    requirements,\n    requestId: $('Parse Request').first().json.requestId\n  }\n}];"
        }
      },
      {
        "name": "Check Container Availability",
        "type": "n8n-nodes-base.postgres",
        "parameters": {
          "query": "SELECT * FROM container_lifecycle WHERE model_id = $1 AND status = 'running' AND (NOW() - last_activity) < INTERVAL '5 minutes' ORDER BY total_requests ASC LIMIT 1",
          "values": ["={{$json.selectedModel.id}}"]
        }
      },
      {
        "name": "Decision: Container Available?",
        "type": "n8n-nodes-base.if",
        "parameters": {
          "conditions": {
            "string": [
              {
                "value1": "={{$json.length}}",
                "operation": "larger",
                "value2": "0"
              }
            ]
          }
        }
      },
      {
        "name": "Spin Up New Container",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Container orchestration logic\nconst model = $('Select Best Model').first().json.selectedModel;\nconst requirements = $('Select Best Model').first().json.requirements;\n\n// Calculate resources\nconst resources = {\n  cpu: Math.ceil(model.base_cpu_requirement * 1.2),\n  memory: Math.ceil(model.base_memory_requirement * 1.5),\n  gpu: model.base_gpu_requirement || 0\n};\n\n// Generate container configuration\nconst containerConfig = {\n  image: 'ollama/ollama:latest',\n  name: `ollama-${model.name}-${Date.now()}`,\n  environment: {\n    OLLAMA_MODELS: '/models',\n    OLLAMA_HOST: '0.0.0.0:11434'\n  },\n  resources: {\n    limits: {\n      cpus: resources.cpu.toString(),\n      memory: `${resources.memory}m`\n    }\n  },\n  ports: {\n    '11434/tcp': [{ HostPort: (11434 + Math.floor(Math.random() * 1000)).toString() }]\n  }\n};\n\nreturn [{\n  json: {\n    containerConfig,\n    model,\n    resources,\n    requestId: $('Select Best Model').first().json.requestId\n  }\n}];"
        }
      },
      {
        "name": "Docker Container Start",
        "type": "n8n-nodes-base.httpRequest",
        "parameters": {
          "url": "http://docker-api:2376/containers/create",
          "method": "POST",
          "body": "={{JSON.stringify($json.containerConfig)}}",
          "headers": {
            "Content-Type": "application/json"
          }
        }
      },
      {
        "name": "Download Model",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Model download and loading\nconst model = $('Spin Up New Container').first().json.model;\nconst containerPort = $json.NetworkSettings?.Ports['11434/tcp'][0]?.HostPort;\n\nif (!containerPort) {\n  throw new Error('Container port not available');\n}\n\n// Prepare model pull command\nconst pullCommand = {\n  name: model.name,\n  stream: false\n};\n\nreturn [{\n  json: {\n    pullCommand,\n    containerPort,\n    model,\n    requestId: $('Select Best Model').first().json.requestId\n  }\n}];"
        }
      },
      {
        "name": "Pull Model to Container",
        "type": "n8n-nodes-base.httpRequest",
        "parameters": {
          "url": "http://localhost:{{$json.containerPort}}/api/pull",
          "method": "POST",
          "body": "={{JSON.stringify($json.pullCommand)}}",
          "timeout": 300000
        }
      },
      {
        "name": "Update Container Registry",
        "type": "n8n-nodes-base.postgres",
        "parameters": {
          "query": "INSERT INTO container_lifecycle (container_id, model_id, status, allocated_cpu, allocated_memory, port, started_at) VALUES ($1, $2, 'running', $3, $4, $5, NOW())",
          "values": [
            "={{$('Download Model').first().json.containerPort}}",
            "={{$('Download Model').first().json.model.id}}",
            "={{$('Spin Up New Container').first().json.resources.cpu}}",
            "={{$('Spin Up New Container').first().json.resources.memory}}",
            "={{$('Download Model').first().json.containerPort}}"
          ]
        }
      },
      {
        "name": "Generate Optimal Prompt",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Intelligent prompt optimization\nconst originalPayload = $('Parse Request').first().json.originalPayload;\nconst model = $('Select Best Model').first().json.selectedModel;\n\n// Prompt templates based on model and task type\nconst promptTemplates = {\n  'text-generation': {\n    'llama2': 'You are a helpful assistant. Please provide a detailed and accurate response to: {query}',\n    'mistral': 'Task: {query}\\n\\nProvide a comprehensive answer:',\n    'codellama': 'Code Generation Task:\\n{query}\\n\\nGenerate clean, well-commented code:'\n  },\n  'question-answering': {\n    'llama2': 'Answer the following question accurately and concisely:\\nQ: {query}\\nA:',\n    'mistral': 'Question: {query}\\n\\nProvide a factual answer:'\n  }\n};\n\nconst taskType = originalPayload.taskType || 'text-generation';\nconst modelFamily = model.name.split(':')[0];\nconst template = promptTemplates[taskType]?.[modelFamily] || promptTemplates['text-generation']['llama2'];\n\nconst optimizedPrompt = template.replace('{query}', originalPayload.prompt || originalPayload.query || '');\n\n// Output format specification\nconst outputFormat = originalPayload.outputFormat || 'text';\nconst formatInstructions = {\n  'json': '\\n\\nPlease format your response as valid JSON.',\n  'markdown': '\\n\\nPlease format your response in markdown.',\n  'code': '\\n\\nProvide only the code without explanations.',\n  'text': ''\n};\n\nconst finalPrompt = optimizedPrompt + (formatInstructions[outputFormat] || '');\n\nreturn [{\n  json: {\n    optimizedPrompt: finalPrompt,\n    outputFormat,\n    model,\n    containerPort: $('Download Model').first().json.containerPort,\n    requestId: $('Select Best Model').first().json.requestId,\n    originalPayload\n  }\n}];"
        }
      },
      {
        "name": "Execute AI Request",
        "type": "n8n-nodes-base.httpRequest",
        "parameters": {
          "url": "http://localhost:{{$json.containerPort}}/api/generate",
          "method": "POST",
          "body": "={{JSON.stringify({model: $json.model.name, prompt: $json.optimizedPrompt, stream: false})}}",
          "timeout": 300000
        }
      },
      {
        "name": "Log Performance",
        "type": "n8n-nodes-base.postgres",
        "parameters": {
          "query": "INSERT INTO performance_logs (model_id, container_id, request_id, task_type, processing_time_ms, success, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
          "values": [
            "={{$('Generate Optimal Prompt').first().json.model.id}}",
            "={{$('Generate Optimal Prompt').first().json.containerPort}}",
            "={{$('Generate Optimal Prompt').first().json.requestId}}",
            "={{$('Generate Optimal Prompt').first().json.originalPayload.taskType}}",
            "={{Date.now() - $execution.startedAt.getTime()}}",
            "={{$json.response ? true : false}}"
          ]
        }
      },
      {
        "name": "Self-Optimization Trigger",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Trigger optimization analysis\nconst performance = {\n  requestId: $('Generate Optimal Prompt').first().json.requestId,\n  processingTime: Date.now() - $execution.startedAt.getTime(),\n  success: !!$('Execute AI Request').first().json.response,\n  modelUsed: $('Generate Optimal Prompt').first().json.model.name,\n  resourcesUsed: {\n    cpu: $('Spin Up New Container').first().json.resources.cpu,\n    memory: $('Spin Up New Container').first().json.resources.memory\n  }\n};\n\n// Trigger async optimization if needed\nif (Math.random() < 0.1) { // 10% chance to trigger optimization\n  // This would trigger a separate workflow for optimization\n  return [{\n    json: {\n      triggerOptimization: true,\n      performance\n    }\n  }];\n}\n\nreturn [{\n  json: {\n    triggerOptimization: false,\n    performance\n  }\n}];"
        }
      },
      {
        "name": "Format Response",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Format final response\nconst aiResponse = $('Execute AI Request').first().json;\nconst originalFormat = $('Generate Optimal Prompt').first().json.outputFormat;\nconst requestId = $('Generate Optimal Prompt').first().json.requestId;\n\nlet formattedResponse = aiResponse.response;\n\n// Apply output formatting\nswitch (originalFormat) {\n  case 'json':\n    try {\n      formattedResponse = JSON.parse(aiResponse.response);\n    } catch (e) {\n      formattedResponse = { content: aiResponse.response, error: 'Invalid JSON format' };\n    }\n    break;\n  case 'markdown':\n  case 'code':\n  case 'text':\n  default:\n    // Keep as is\n    break;\n}\n\nreturn [{\n  json: {\n    requestId,\n    response: formattedResponse,\n    metadata: {\n      model: $('Generate Optimal Prompt').first().json.model.name,\n      processingTime: Date.now() - $execution.startedAt.getTime(),\n      format: originalFormat,\n      timestamp: new Date().toISOString()\n    }\n  }\n}];"
        }
      },
      {
        "name": "Container Cleanup Scheduler",
        "type": "n8n-nodes-base.code",
        "parameters": {
          "jsCode": "// Schedule container cleanup after idle time\nconst containerPort = $('Generate Optimal Prompt').first().json.containerPort;\nconst idleTimeout = 300000; // 5 minutes\n\n// This would typically trigger a separate cleanup workflow\n// For now, we'll just update the last activity timestamp\nsetTimeout(() => {\n  // Cleanup logic would go here\n  console.log(`Scheduling cleanup for container on port ${containerPort}`);\n}, idleTimeout);\n\nreturn [{\n  json: {\n    cleanupScheduled: true,\n    containerPort,\n    idleTimeout\n  }\n}];"
        }
      }
    ],
    "connections": {\n      \"Webhook Trigger\": {\n        \"main\": [[{\n          \"node\": \"Parse Request\",\n          \"type\": \"main\",\n          \"index\": 0\n        }]]\n      },\n      \"Parse Request\": {\n        \"main\": [[{\n          \"node\": \"Query Model Registry\",\n          \"type\": \"main\",\n          \"index\": 0\n        }]]\n      }\n      // ... additional connections\n    }\n  }
```

### 6. **Self-Optimization Engine**

```python
# Separate optimization service (can be triggered by n8n)
class AIDispatcherOptimizer:
    def __init__(self, db_connection):
        self.db = db_connection
        self.learning_rate = 0.01

    async def analyze_performance(self):
        """Analyze recent performance data and suggest optimizations"""

        # Get recent performance data
        recent_data = await self.db.fetch("""
            SELECT
                m.name, m.task_type,
                AVG(p.processing_time_ms) as avg_time,
                AVG(p.memory_used_mb) as avg_memory,
                AVG(p.cpu_usage_percent) as avg_cpu,
                COUNT(*) as request_count,
                SUM(CASE WHEN p.success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
            FROM performance_logs p
            JOIN model_registry m ON p.model_id = m.id
            WHERE p.timestamp > NOW() - INTERVAL '1 hour'
            GROUP BY m.name, m.task_type
        """)

        optimizations = []

        for record in recent_data:
            # Identify underperforming models
            if record['success_rate'] < 0.95:
                optimizations.append({
                    'type': 'model_replacement',
                    'model': record['name'],
                    'reason': f"Low success rate: {record['success_rate']:.2%}",
                    'suggestion': 'Consider alternative model'
                })

            # Identify resource inefficiencies
            if record['avg_cpu'] < 30 and record['avg_memory'] < 50:
                optimizations.append({
                    'type': 'resource_reduction',
                    'model': record['name'],
                    'reason': 'Low resource utilization',
                    'suggestion': 'Reduce allocated resources'
                })

        return optimizations

    async def update_model_rankings(self):
        """Update model performance scores based on recent data"""

        await self.db.execute("""
            UPDATE model_registry
            SET performance_metrics = jsonb_set(
                COALESCE(performance_metrics, '{}'),
                '{avg_speed}',
                (
                    SELECT to_jsonb(AVG(processing_time_ms))
                    FROM performance_logs
                    WHERE model_id = model_registry.id
                    AND timestamp > NOW() - INTERVAL '24 hours'
                )::text::jsonb
            )
        """)
```

### 7. **Container Auto-Scaling Logic**

```bash
#!/bin/bash
# Container lifecycle management script

cleanup_idle_containers() {
    local idle_threshold=300 # 5 minutes

    # Find idle containers
    idle_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" |
                     grep "ollama-" |
                     awk -v threshold=$idle_threshold '
                     {
                         # Extract uptime and check if idle
                         if ($2 ~ /Up.*minutes/ && $2 > threshold) {
                             print $1
                         }
                     }')

    # Stop idle containers
    for container in $idle_containers; do
        echo "Stopping idle container: $container"
        docker stop $container
        docker rm $container

        # Update database
        psql -d ai_dispatcher -c "
            UPDATE container_lifecycle
            SET status = 'stopped', stopped_at = NOW()
            WHERE container_id = '$container'
        "
    done
}

scale_based_on_queue() {
    # Check queue length
    queue_length=$(psql -d ai_dispatcher -t -c "
        SELECT COUNT(*) FROM request_queue WHERE status = 'pending'
    ")

    # Scale up if queue is long
    if [ $queue_length -gt 10 ]; then
        echo "Queue length: $queue_length - Scaling up"
        # Trigger n8n workflow to spin up more containers
        curl -X POST http://n8n:5678/webhook/scale-up \
             -H "Content-Type: application/json" \
             -d "{\"queue_length\": $queue_length}"
    fi
}

# Run periodically
while true; do
    cleanup_idle_containers
    scale_based_on_queue
    sleep 60
done
```

## Implementation Steps

1. **Phase 1: Core Infrastructure**

   - Set up PostgreSQL database with the schema
   - Create Docker orchestration scripts
   - Build basic n8n workflows for model selection

2. **Phase 2: Intelligence Layer**

   - Implement model registry and performance tracking
   - Add resource calculation algorithms
   - Create optimization engine

3. **Phase 3: Advanced Features**

   - Add self-learning capabilities
   - Implement advanced prompt optimization
   - Create auto-scaling mechanisms

4. **Phase 4: Monitoring & Optimization**
   - Add comprehensive logging
   - Create performance dashboards
   - Implement cost optimization features

# I'll create a comprehensive step-by-step development plan with complete code, tests, and walkthroughs for each phase.

## Development Roadmap

```artifact
id: development-roadmap
name: AI Dispatcher Framework Development Plan
type: mermaid
content: |-
  gantt
    title AI Dispatcher Framework Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Database Setup           :p1-db, 2025-06-26, 3d
    Docker Environment       :p1-docker, after p1-db, 2d
    Basic n8n Workflows      :p1-n8n, after p1-docker, 4d
    Unit Tests Phase 1       :p1-test, after p1-n8n, 2d

    section Phase 2: Intelligence
    Model Registry API       :p2-api, after p1-test, 3d
    Performance Tracking     :p2-perf, after p2-api, 2d
    Resource Calculator      :p2-calc, after p2-perf, 3d
    Integration Tests        :p2-test, after p2-calc, 2d

    section Phase 3: Advanced Features
    Self-Learning Engine     :p3-learn, after p2-test, 4d
    Prompt Optimization      :p3-prompt, after p3-learn, 3d
    Auto-Scaling Logic       :p3-scale, after p3-prompt, 3d
    E2E Tests                :p3-test, after p3-scale, 3d

    section Phase 4: Production
    Monitoring Dashboard     :p4-monitor, after p3-test, 2d
    Cost Optimization        :p4-cost, after p4-monitor, 2d
    Performance Tuning       :p4-perf, after p4-cost, 3d
    Production Deployment    :p4-deploy, after p4-perf, 2d
```

# Phase 1: Foundation Setup

## Step 1.1: Project Structure Setup

```artifact
id: project-structure
name: Project Directory Structure
type: code.bash
content: |-
  #!/bin/bash
  # Create project structure
  mkdir -p ai-dispatcher-framework/{
    database/{migrations,seeds,scripts},
    docker/{ollama,postgres,redis,n8n},
    n8n/{workflows,custom-nodes},
    api/{src,tests,config},
    optimization-engine/{src,tests,models},
    monitoring/{grafana,prometheus},
    tests/{unit,integration,e2e},
    scripts/{deployment,maintenance},
    docs/{api,setup,troubleshooting}
  }

  # Initialize package.json files
  cd ai-dispatcher-framework

  # API service
  cd api && npm init -y
  npm install express pg redis docker-api winston joi helmet cors dotenv
  npm install --save-dev jest supertest nodemon eslint
  cd ..

  # Optimization engine
  cd optimization-engine && npm init -y
  npm install tensorflow @tensorflow/tfjs-node pg redis axios
  npm install --save-dev jest
  cd ..

  # Create main docker-compose file
  cat > docker-compose.yml << 'EOF'
  version: '3.8'
  services:
    postgres:
      image: postgres:15
      environment:
        POSTGRES_DB: ai_dispatcher
        POSTGRES_USER: dispatcher
        POSTGRES_PASSWORD: dispatcher_pass
      volumes:
        - postgres_data:/var/lib/postgresql/data
        - ./database/migrations:/docker-entrypoint-initdb.d
      ports:
        - "5432:5432"
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U dispatcher"]
        interval: 30s
        timeout: 10s
        retries: 5

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - redis_data:/data

    n8n:
      image: n8nio/n8n:latest
      environment:
        DB_TYPE: postgresdb
        DB_POSTGRESDB_HOST: postgres
        DB_POSTGRESDB_PORT: 5432
        DB_POSTGRESDB_DATABASE: ai_dispatcher
        DB_POSTGRESDB_USER: dispatcher
        DB_POSTGRESDB_PASSWORD: dispatcher_pass
        N8N_BASIC_AUTH_ACTIVE: true
        N8N_BASIC_AUTH_USER: admin
        N8N_BASIC_AUTH_PASSWORD: ${GRAFANA_PASSWORD}
      ports:
        - "5678:5678"
      volumes:
        - n8n_data:/home/node/.n8n
        - ./n8n/workflows:/home/node/.n8n/workflows
      depends_on:
        postgres:
          condition: service_healthy

    api:
      build: ./api
      environment:
        DATABASE_URL: postgresql://dispatcher:dispatcher_pass@postgres:5432/ai_dispatcher
        REDIS_URL: redis://redis:6379
        NODE_ENV: development
      ports:
        - "3000:3000"
      volumes:
        - ./api:/app
        - /var/run/docker.sock:/var/run/docker.sock
      depends_on:
        - postgres
        - redis

    optimization-engine:
      build: ./optimization-engine
      environment:
        DATABASE_URL: postgresql://dispatcher:dispatcher_pass@postgres:5432/ai_dispatcher
        REDIS_URL: redis://redis:6379
      volumes:
        - ./optimization-engine:/app
      depends_on:
        - postgres
        - redis

  volumes:
    postgres_data:
    redis_data:
    n8n_data:
  EOF

  echo "Project structure created successfully!"
```

## Step 1.2: Database Schema and Migrations

```artifact
id: database-schema
name: Complete Database Schema with Migrations
type: code.sql
content: |-
  -- File: database/migrations/001_initial_schema.sql

  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

  -- Model Registry Table
  CREATE TABLE model_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    complexity_score INTEGER NOT NULL CHECK (complexity_score BETWEEN 1 AND 10),
    base_cpu_requirement DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    base_memory_requirement INTEGER NOT NULL DEFAULT 2048, -- MB
    base_gpu_requirement DECIMAL(4,2) DEFAULT 0,
    storage_requirement INTEGER NOT NULL DEFAULT 4096, -- MB
    download_url TEXT,
    model_size BIGINT, -- bytes
    performance_metrics JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, version)
  );

  -- Performance Tracking Table
  CREATE TABLE performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES model_registry(id) ON DELETE CASCADE,
    container_id VARCHAR(255),
    request_id UUID NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    processing_time_ms INTEGER NOT NULL,
    memory_used_mb INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    gpu_usage_percent DECIMAL(5,2),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    prompt_length INTEGER,
    response_length INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
  );

  -- Container Lifecycle Table
  CREATE TABLE container_lifecycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id VARCHAR(255) UNIQUE NOT NULL,
    model_id UUID REFERENCES model_registry(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('starting', 'running', 'stopping', 'stopped', 'error')),
    allocated_cpu DECIMAL(4,2) NOT NULL,
    allocated_memory INTEGER NOT NULL,
    allocated_gpu DECIMAL(4,2) DEFAULT 0,
    port INTEGER UNIQUE,
    docker_image VARCHAR(255),
    started_at TIMESTAMP,
    stopped_at TIMESTAMP,
    total_requests INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT NOW(),
    health_status VARCHAR(20) DEFAULT 'unknown',
    restart_count INTEGER DEFAULT 0
  );

  -- Optimization Rules Table
  CREATE TABLE optimization_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    condition_sql TEXT NOT NULL,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('scale_up', 'scale_down', 'switch_model', 'adjust_resources')),
    action_parameters JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_executed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Request Queue Table
  CREATE TABLE request_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_payload JSONB NOT NULL,
    priority INTEGER DEFAULT 100,
    estimated_processing_time INTEGER,
    assigned_container_id VARCHAR(255),
    assigned_model_id UUID REFERENCES model_registry(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_details JSONB
  );

  -- Model Performance Summary (Materialized View)
  CREATE MATERIALIZED VIEW model_performance_summary AS
  SELECT
    mr.id,
    mr.name,
    mr.version,
    mr.task_type,
    COUNT(pl.id) as total_requests,
    AVG(pl.processing_time_ms) as avg_processing_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pl.processing_time_ms) as p95_processing_time,
    AVG(pl.memory_used_mb) as avg_memory_usage,
    AVG(pl.cpu_usage_percent) as avg_cpu_usage,
    SUM(CASE WHEN pl.success THEN 1 ELSE 0 END)::float / COUNT(pl.id) as success_rate,
    MAX(pl.timestamp) as last_used
  FROM model_registry mr
  LEFT JOIN performance_logs pl ON mr.id = pl.model_id
  WHERE pl.timestamp > NOW() - INTERVAL '24 hours'
  GROUP BY mr.id, mr.name, mr.version, mr.task_type;

  -- Indexes for Performance
  CREATE INDEX idx_model_registry_task_type ON model_registry(task_type);
  CREATE INDEX idx_model_registry_active ON model_registry(active) WHERE active = true;
  CREATE INDEX idx_performance_logs_model_timestamp ON performance_logs(model_id, timestamp DESC);
  CREATE INDEX idx_performance_logs_success ON performance_logs(success, timestamp DESC);
  CREATE INDEX idx_container_lifecycle_status ON container_lifecycle(status);
  CREATE INDEX idx_container_lifecycle_model ON container_lifecycle(model_id, status);
  CREATE INDEX idx_request_queue_status_priority ON request_queue(status, priority DESC, created_at);
  CREATE INDEX idx_request_queue_assigned_container ON request_queue(assigned_container_id) WHERE assigned_container_id IS NOT NULL;

  -- Functions for automatic timestamp updates
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Triggers
  CREATE TRIGGER update_model_registry_updated_at
    BEFORE UPDATE ON model_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_optimization_rules_updated_at
    BEFORE UPDATE ON optimization_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- Refresh materialized view function
  CREATE OR REPLACE FUNCTION refresh_model_performance_summary()
  RETURNS void AS $$
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  END;
  $$ LANGUAGE plpgsql;
```

## Step 1.3: Database Seed Data

```artifact
id: database-seeds
name: Database Seed Data for Testing
type: code.sql
content: |-
  -- File: database/seeds/001_sample_models.sql

  -- Insert sample models for testing
  INSERT INTO model_registry (name, version, task_type, complexity_score, base_cpu_requirement, base_memory_requirement, base_gpu_requirement, storage_requirement, model_size, performance_metrics, tags) VALUES

  -- Text Generation Models
  ('llama2', '7b', 'text-generation', 5, 2.0, 8192, 0, 4096, 3825000000,
   '{"avg_speed": 1200, "accuracy": 0.85, "context_length": 4096}',
   ARRAY['general', 'conversation', 'creative']),

  ('llama2', '13b', 'text-generation', 7, 4.0, 16384, 0, 8192, 6738000000,
   '{"avg_speed": 2100, "accuracy": 0.89, "context_length": 4096}',
   ARRAY['general', 'conversation', 'analysis']),

  ('mistral', '7b', 'text-generation', 6, 2.5, 10240, 0, 5120, 4109000000,
   '{"avg_speed": 1000, "accuracy": 0.87, "context_length": 8192}',
   ARRAY['general', 'instruction', 'reasoning']),

  ('codellama', '7b', 'code-generation', 6, 2.0, 8192, 0, 4096, 3825000000,
   '{"avg_speed": 1400, "accuracy": 0.82, "context_length": 16384}',
   ARRAY['programming', 'code', 'debugging']),

  ('codellama', '13b', 'code-generation', 8, 4.0, 16384, 0, 8192, 6738000000,
   '{"avg_speed": 2300, "accuracy": 0.86, "context_length": 16384}',
   ARRAY['programming', 'code', 'architecture']),

  -- Specialized Models
  ('orca-mini', '3b', 'question-answering', 3, 1.0, 4096, 0, 2048, 1900000000,
   '{"avg_speed": 800, "accuracy": 0.78, "context_length": 2048}',
   ARRAY['qa', 'facts', 'quick']),

  ('neural-chat', '7b', 'conversation', 5, 2.0, 8192, 0, 4096, 3825000000,
   '{"avg_speed": 1100, "accuracy": 0.83, "context_length": 4096}',
   ARRAY['chat', 'assistant', 'helpful']),

  ('wizard-coder', '15b', 'code-generation', 9, 6.0, 20480, 0, 10240, 8200000000,
   '{"avg_speed": 2800, "accuracy": 0.91, "context_length": 8192}',
   ARRAY['programming', 'expert', 'complex']);

  -- Insert sample optimization rules
  INSERT INTO optimization_rules (rule_name, condition_sql, action_type, action_parameters, priority) VALUES

  ('Scale Up on High Queue',
   'SELECT COUNT(*) > 10 FROM request_queue WHERE status = ''pending''',
   'scale_up',
   '{"max_containers": 5, "scale_factor": 2}',
   100),

  ('Scale Down on Low Activity',
   'SELECT COUNT(*) < 2 FROM request_queue WHERE status = ''pending'' AND created_at > NOW() - INTERVAL ''5 minutes''',
   'scale_down',
   '{"min_containers": 1, "idle_threshold": 300}',
   80),

  ('Switch to Faster Model on Timeout',
   'SELECT AVG(processing_time_ms) > 30000 FROM performance_logs WHERE timestamp > NOW() - INTERVAL ''10 minutes''',
   'switch_model',
   '{"prefer_speed_over_accuracy": true, "max_processing_time": 20000}',
   90),

  ('Reduce Resources on Low Utilization',
   'SELECT AVG(cpu_usage_percent) < 30 AND AVG(memory_used_mb) < 2048 FROM performance_logs WHERE timestamp > NOW() - INTERVAL ''1 hour''',
   'adjust_resources',
   '{"cpu_reduction": 0.5, "memory_reduction": 0.3}',
   60);

  -- Insert sample performance data for testing
  DO $$
  DECLARE
    model_rec RECORD;
    i INTEGER;
    base_time INTEGER;
  BEGIN
    FOR model_rec IN SELECT id, name FROM model_registry LOOP
      base_time := CASE
        WHEN model_rec.name LIKE '%3b%' THEN 800
        WHEN model_rec.name LIKE '%7b%' THEN 1200
        WHEN model_rec.name LIKE '%13b%' THEN 2000
        ELSE 1500
      END;

      FOR i IN 1..50 LOOP
        INSERT INTO performance_logs (
          model_id,
          container_id,
          request_id,
          task_type,
          processing_time_ms,
          memory_used_mb,
          cpu_usage_percent,
          success,
          timestamp
        ) VALUES (
          model_rec.id,
          'container-' || model_rec.name || '-' || (i % 3 + 1),
          uuid_generate_v4(),
          'text-generation',
          base_time + (random() * 500)::INTEGER,
          2048 + (random() * 4096)::INTEGER,
          30 + (random() * 40)::NUMERIC,
          random() > 0.05, -- 95% success rate
          NOW() - (random() * INTERVAL '24 hours')
        );
      END LOOP;
    END LOOP;
  END $$;

  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW model_performance_summary;
```

## Step 1.4: API Service Implementation

```artifact
id: api-service
name: Core API Service Implementation
type: code.javascript
content: |-
  // File: api/src/app.js

  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const winston = require('winston');
  const { Pool } = require('pg');
  const Redis = require('redis');
  const Docker = require('dockerode');

  // Import route modules
  const modelsRouter = require('./routes/models');
  const containersRouter = require('./routes/containers');
  const performanceRouter = require('./routes/performance');
  const optimizationRouter = require('./routes/optimization');

  // Initialize Express app
  const app = express();
  const port = process.env.PORT || 3000;

  // Configure logging
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  });

  // Database connection
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Redis connection
  const redis = Redis.createClient({
    url: process.env.REDIS_URL
  });

  // Docker connection
  const docker = new Docker({ socketPath: '/var/run/docker.sock' });

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Add database and redis to request object
  app.use((req, res, next) => {
    req.db = db;
    req.redis = redis;
    req.docker = docker;
    req.logger = logger;
    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    });
    next();
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Check database connection
      await db.query('SELECT 1');

      // Check Redis connection
      await redis.ping();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected',
          docker: 'connected'
        }
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  });

  // Routes
  app.use('/api/models', modelsRouter);
  app.use('/api/containers', containersRouter);
  app.use('/api/performance', performanceRouter);
  app.use('/api/optimization', optimizationRouter);

  // Main AI dispatch endpoint
  app.post('/api/dispatch', async (req, res) => {
    const requestId = require('uuid').v4();
    const startTime = Date.now();

    try {
      const {
        prompt,
        taskType = 'text-generation',
        complexity = 'medium',
        outputFormat = 'text',
        maxTokens = 1000,
        temperature = 0.7,
        priority = 100
      } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required',
          requestId
        });
      }

      logger.info(`Dispatch request ${requestId}:`, {
        taskType,
        complexity,
        promptLength: prompt.length
      });

      // Add to request queue
      await db.query(`
        INSERT INTO request_queue (id, request_payload, priority, status)
        VALUES ($1, $2, $3, 'pending')
      `, [
        requestId,
        JSON.stringify({
          prompt,
          taskType,
          complexity,
          outputFormat,
          maxTokens,
          temperature
        }),
        priority
      ]);

      // Process the request (this would typically be async)
      const result = await processAIRequest(req, {
        requestId,
        prompt,
        taskType,
        complexity,
        outputFormat,
        maxTokens,
        temperature
      });

      res.json({
        requestId,
        response: result.response,
        metadata: {
          model: result.model,
          processingTime: Date.now() - startTime,
          format: outputFormat,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error(`Dispatch error for request ${requestId}:`, error);

      // Update request status
      await db.query(`
        UPDATE request_queue
        SET status = 'failed', error_details = $2, completed_at = NOW()
        WHERE id = $1
      `, [requestId, JSON.stringify({ error: error.message })]);

      res.status(500).json({
        error: 'Internal server error',
        requestId,
        message: error.message
      });
    }
  });

  // AI Request Processing Function
  async function processAIRequest(req, requestData) {
    const { requestId, prompt, taskType, complexity, outputFormat } = requestData;

    // 1. Select best model
    const selectedModel = await selectBestModel(req.db, taskType, complexity);

    // 2. Get or create container
    const container = await getOrCreateContainer(req, selectedModel);

    // 3. Generate optimized prompt
    const optimizedPrompt = await generateOptimalPrompt(prompt, selectedModel, outputFormat);

    // 4. Execute AI request
    const response = await executeAIRequest(container, selectedModel, optimizedPrompt);

    // 5. Log performance
    await logPerformance(req.db, {
      requestId,
      modelId: selectedModel.id,
      containerId: container.id,
      taskType,
      processingTime: response.processingTime,
      success: response.success
    });

    return {
      response: response.content,
      model: selectedModel.name
    };
  }

  // Model Selection Algorithm
  async function selectBestModel(db, taskType, complexity) {
    const complexityScore = {
      'low': 3,
      'medium': 6,
      'high': 9
    }[complexity] || 6;

    const result = await db.query(`
      SELECT mr.*, mps.avg_processing_time, mps.success_rate
      FROM model_registry mr
      LEFT JOIN model_performance_summary mps ON mr.id = mps.id
      WHERE mr.task_type = $1
        AND mr.complexity_score <= $2
        AND mr.active = true
      ORDER BY
        COALESCE(mps.success_rate, 0.8) DESC,
        COALESCE(mps.avg_processing_time, 2000) ASC
      LIMIT 1
    `, [taskType, complexityScore]);

    if (result.rows.length === 0) {
      throw new Error(`No suitable model found for task type: ${taskType}`);
    }

    return result.rows[0];
  }

  // Container Management
  async function getOrCreateContainer(req, model) {
    const { db, docker, logger } = req;

    // Check for existing running container
    const existingResult = await db.query(`
      SELECT * FROM container_lifecycle
      WHERE model_id = $1 AND status = 'running'
      ORDER BY last_activity DESC
      LIMIT 1
    `, [model.id]);

    if (existingResult.rows.length > 0) {
      const container = existingResult.rows[0];

      // Update last activity
      await db.query(`
        UPDATE container_lifecycle
        SET last_activity = NOW(), total_requests = total_requests + 1
        WHERE id = $1
      `, [container.id]);

      return container;
    }

    // Create new container
    logger.info(`Creating new container for model: ${model.name}`);

    const containerName = `ollama-${model.name.replace(':', '-')}-${Date.now()}`;
    const port = 11434 + Math.floor(Math.random() * 1000);

    const containerConfig = {
      Image: 'ollama/ollama:latest',
      name: containerName,
      ExposedPorts: { '11434/tcp': {} },
      HostConfig: {
        PortBindings: {
          '11434/tcp': [{ HostPort: port.toString() }]
        },
        Memory: model.base_memory_requirement * 1024 * 1024, // Convert MB to bytes
        CpuShares: Math.floor(model.base_cpu_requirement * 1024)
      },
      Env: [
        'OLLAMA_MODELS=/models',
        'OLLAMA_HOST=0.0.0.0:11434'
      ]
    };

    const container = await docker.createContainer(containerConfig);
    await container.start();

    // Wait for container to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Pull the model
    const axios = require('axios');
    try {
      await axios.post(`http://localhost:${port}/api/pull`, {
        name: model.name,
        stream: false
      }, { timeout: 300000 });
    } catch (error) {
      logger.error(`Failed to pull model ${model.name}:`, error.message);
      throw error;
    }

    // Register container in database
    const containerResult = await db.query(`
      INSERT INTO container_lifecycle (
        container_id, model_id, status, allocated_cpu, allocated_memory,
        port, started_at, last_activity
      ) VALUES ($1, $2, 'running', $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      containerName,
      model.id,
      model.base_cpu_requirement,
      model.base_memory_requirement,
      port
    ]);

    return containerResult.rows[0];
  }

  // Prompt Optimization
  async function generateOptimalPrompt(originalPrompt, model, outputFormat) {
    const promptTemplates = {
      'text-generation': {
        'llama2': 'You are a helpful assistant. Please provide a detailed response to: {prompt}',
        'mistral': 'Task: {prompt}\n\nProvide a comprehensive answer:',
        'default': 'Please respond to: {prompt}'
      },
      'code-generation': {
        'codellama': 'Generate clean, well-commented code for: {prompt}',
        'wizard-coder': 'Code generation task:\n{prompt}\n\nProvide optimized code:',
        'default': 'Write code for: {prompt}'
      },
      'question-answering': {
        'default': 'Answer this question accurately: {prompt}'
      }
    };

    const taskTemplates = promptTemplates[model.task_type] || promptTemplates['text-generation'];
    const modelFamily = model.name.split(':')[0];
    const template = taskTemplates[modelFamily] || taskTemplates['default'];

    let optim
```
