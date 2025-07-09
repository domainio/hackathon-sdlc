# Low-Footprint Dynamic AI Resource Management

**Created**: 2025-06-26  
**Focus**: On-demand AI container and database management  
**Goal**: Minimize resource consumption while maintaining performance  

## Current System Analysis

### Existing On-Demand Features ✅
```yaml
# From current docker-compose.yml
ollama:
  profiles: ["ai", "always"]  # Already supports selective startup
  restart: "no"               # Doesn't auto-restart (good for manual control)
  deploy:
    resources:
      limits: memory: 4G, cpus: "2.0"
      reservations: memory: 1G, cpus: "1.0"

sqlite-ai:
  profiles: ["ai", "always"]  # Also supports selective startup
  restart: "no"               # Manual control
```

### Resource Consumption When Idle
- **Ollama**: ~1GB RAM when loaded, ~4GB when processing
- **SQLite**: ~32MB RAM (minimal footprint)
- **Redis**: ~64MB RAM + caching overhead
- **Total idle cost**: ~1.1GB RAM when AI services running but not processing

## Enhanced On-Demand Architecture

### 1. **Smart Container Lifecycle Management**

#### 1.1 On-Demand Startup Script
Create `scripts/ai-lifecycle-manager.sh`:

```bash
#!/bin/bash
# AI Resource Lifecycle Manager

AI_SERVICES="ollama sqlite-ai"
STARTUP_TIMEOUT=30
SHUTDOWN_DELAY=300  # 5 minutes idle before shutdown

# Function to start AI services
start_ai_services() {
    echo "🚀 Starting AI services on-demand..."
    
    # Check if services are already running
    for service in $AI_SERVICES; do
        if docker ps | grep -q "$service"; then
            echo "✅ $service already running"
        else
            echo "⏳ Starting $service..."
            docker-compose --profile ai up -d $service
        fi
    done
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to be ready..."
    for i in $(seq 1 $STARTUP_TIMEOUT); do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "✅ AI services ready in ${i}s"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ AI services failed to start within ${STARTUP_TIMEOUT}s"
    return 1
}

# Function to stop AI services after idle period
stop_ai_services() {
    echo "🛑 Stopping AI services to save resources..."
    
    # Graceful shutdown with model unloading
    curl -s -X POST http://localhost:11434/api/push -d '{"name": "*", "stream": false}' || true
    
    # Stop containers
    for service in $AI_SERVICES; do
        echo "⏳ Stopping $service..."
        docker-compose stop $service
    done
    
    echo "✅ AI services stopped"
}

# Function to check if AI services are being used
check_ai_activity() {
    # Check N8N execution logs for recent AI activity
    local recent_activity=$(docker logs n8n --since=5m 2>&1 | grep -c "ollama\|ai-dispatch" || echo "0")
    
    # Check direct Ollama API activity
    local api_activity=$(docker logs ollama --since=5m 2>&1 | grep -c "POST\|generate" || echo "0")
    
    echo $((recent_activity + api_activity))
}

# Function to monitor and auto-shutdown
monitor_and_shutdown() {
    while true; do
        if docker ps | grep -q "ollama"; then
            local activity=$(check_ai_activity)
            
            if [ "$activity" -eq 0 ]; then
                echo "📊 No AI activity detected in last 5 minutes"
                sleep $SHUTDOWN_DELAY
                
                # Double-check after delay
                activity=$(check_ai_activity)
                if [ "$activity" -eq 0 ]; then
                    stop_ai_services
                    break
                else
                    echo "🔄 Activity detected during shutdown delay, continuing..."
                fi
            else
                echo "🔄 AI activity detected ($activity events), staying active..."
            fi
        else
            echo "😴 AI services not running, monitoring stopped"
            break
        fi
        
        sleep 60  # Check every minute
    done
}

# Main command handling
case "$1" in
    start)
        start_ai_services
        ;;
    stop)
        stop_ai_services
        ;;
    restart)
        stop_ai_services
        sleep 5
        start_ai_services
        ;;
    monitor)
        monitor_and_shutdown
        ;;
    status)
        echo "AI Services Status:"
        for service in $AI_SERVICES; do
            if docker ps | grep -q "$service"; then
                echo "✅ $service: RUNNING"
            else
                echo "❌ $service: STOPPED"
            fi
        done
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|monitor|status}"
        exit 1
        ;;
esac
```

#### 1.2 Enhanced N8N AI Request Handler
Create `scripts/on-demand-ai-request.js`:

```javascript
// On-Demand AI Request Handler for N8N
class OnDemandAIManager {
  constructor() {
    this.maxWaitTime = 45000; // 45 seconds max wait for startup
    this.checkInterval = 2000; // Check every 2 seconds
  }

  async ensureAIServicesRunning() {
    // Check if Ollama is already running
    try {
      const response = await $http.request({
        url: 'http://ollama:11434/api/tags',
        method: 'GET',
        timeout: 5000
      });
      return true; // Already running
    } catch (error) {
      console.log('🚀 AI services not running, starting on-demand...');
      return await this.startAIServices();
    }
  }

  async startAIServices() {
    try {
      // Trigger startup via Docker API or script
      await $http.request({
        url: 'http://localhost:2376/containers/ollama/start',
        method: 'POST',
        timeout: 10000
      });

      // Wait for services to be ready
      const startTime = Date.now();
      while (Date.now() - startTime < this.maxWaitTime) {
        try {
          await $http.request({
            url: 'http://ollama:11434/api/tags',
            method: 'GET',
            timeout: 3000
          });
          
          console.log(`✅ AI services ready in ${Date.now() - startTime}ms`);
          return true;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, this.checkInterval));
        }
      }

      throw new Error('AI services failed to start within timeout');
    } catch (error) {
      console.error('❌ Failed to start AI services:', error.message);
      return false;
    }
  }

  async makeAIRequest(prompt, model = 'llama3.2:3b', taskType = 'general') {
    // Ensure AI services are running
    const servicesReady = await this.ensureAIServicesRunning();
    if (!servicesReady) {
      throw new Error('Failed to start AI services');
    }

    // Make the actual AI request
    try {
      const response = await $http.request({
        url: 'http://ollama:11434/api/generate',
        method: 'POST',
        body: {
          model: model,
          prompt: prompt,
          stream: false,
          options: this.getOptimalParameters(taskType)
        },
        timeout: 60000
      });

      // Schedule background shutdown check
      this.scheduleShutdownCheck();

      return {
        response: response.response,
        model_used: model,
        startup_required: !servicesReady
      };

    } catch (error) {
      console.error('❌ AI request failed:', error.message);
      throw error;
    }
  }

  getOptimalParameters(taskType) {
    const params = {
      'analysis': { temperature: 0.3, num_predict: 2048 },
      'summarization': { temperature: 0.2, num_predict: 500 },
      'general': { temperature: 0.7, num_predict: 1000 },
      'quick': { temperature: 0.5, num_predict: 300 }
    };
    
    return params[taskType] || params.general;
  }

  scheduleShutdownCheck() {
    // This would trigger the monitoring script after a delay
    // In N8N, this could be done via a delayed webhook or cron trigger
    setTimeout(() => {
      // Trigger monitoring/shutdown check
      console.log('🔍 Scheduling shutdown check...');
    }, 300000); // 5 minutes
  }
}

// Export for use in N8N workflows
const aiManager = new OnDemandAIManager();

// Main function for N8N Function Node
async function smartOnDemandAIRequest(prompt, model, taskType) {
  return await aiManager.makeAIRequest(prompt, model, taskType);
}

// Usage in N8N workflow
return [{ json: await smartOnDemandAIRequest($json.prompt, 'qwen2.5:7b', 'analysis') }];
```

### 2. **Ultra-Lightweight Database Management**

#### 2.1 On-Demand SQLite with Memory Optimization
```javascript
// Memory-Optimized SQLite Manager
class LightweightDatabaseManager {
  constructor() {
    this.dbPath = './data/jira_ai_memory.db';
    this.connectionPool = null;
    this.idleTimeout = 300000; // 5 minutes
    this.lastActivity = Date.now();
  }

  async getConnection() {
    if (!this.connectionPool) {
      const sqlite3 = require('sqlite3');
      this.connectionPool = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE);
      
      // Optimize for low memory usage
      this.connectionPool.run('PRAGMA cache_size = -2000');     // 2MB cache
      this.connectionPool.run('PRAGMA temp_store = MEMORY');    // Use memory for temp
      this.connectionPool.run('PRAGMA mmap_size = 67108864');   // 64MB memory map
      this.connectionPool.run('PRAGMA journal_mode = WAL');     // Write-ahead logging
      this.connectionPool.run('PRAGMA synchronous = NORMAL');   // Balanced durability
    }
    
    this.lastActivity = Date.now();
    this.scheduleCleanup();
    return this.connectionPool;
  }

  scheduleCleanup() {
    clearTimeout(this.cleanupTimer);
    this.cleanupTimer = setTimeout(() => {
      if (Date.now() - this.lastActivity > this.idleTimeout) {
        this.cleanup();
      }
    }, this.idleTimeout);
  }

  async cleanup() {
    if (this.connectionPool) {
      // Optimize database before closing
      this.connectionPool.run('PRAGMA optimize');
      this.connectionPool.close();
      this.connectionPool = null;
      console.log('📦 Database connection cleaned up to save memory');
    }
  }

  async logPerformance(data) {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO model_performance_tracking 
        (model_name, task_type, prompt_length, response_time_ms, success, quality_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [
        data.model, data.taskType, data.promptLength, 
        data.responseTime, data.success, data.qualityScore
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }
}
```

### 3. **Resource-Aware Workflow Triggers**

#### 3.1 Smart Cron with Resource Checks
```javascript
// Enhanced Cron Trigger with Resource Awareness
async function resourceAwareTrigger() {
  // Check system resources before starting heavy AI tasks
  const systemStats = await getSystemResources();
  
  if (systemStats.availableMemory < 2048) { // Less than 2GB available
    console.log('⚠️ Low memory detected, using lightweight processing');
    return {
      processingMode: 'lightweight',
      maxConcurrency: 1,
      preferredModels: ['phi3:mini', 'llama3.2:1b']
    };
  }
  
  if (systemStats.cpuUsage > 80) {
    console.log('⚠️ High CPU usage, deferring AI processing');
    return {
      processingMode: 'deferred',
      retryAfter: 600000 // 10 minutes
    };
  }
  
  return {
    processingMode: 'normal',
    maxConcurrency: 2,
    preferredModels: ['qwen2.5:7b', 'llama3.2:3b']
  };
}

async function getSystemResources() {
  try {
    // Get Docker stats for current containers
    const stats = await $http.request({
      url: 'http://localhost:2376/containers/json',
      method: 'GET'
    });
    
    // Calculate available resources
    const totalMemory = 8192; // 8GB total (adjust for your system)
    const usedMemory = stats.reduce((sum, container) => {
      return sum + (container.HostConfig?.Memory || 0) / 1024 / 1024;
    }, 0);
    
    return {
      availableMemory: totalMemory - usedMemory,
      cpuUsage: 50, // Simplified - would need actual CPU monitoring
      activeContainers: stats.length
    };
  } catch (error) {
    // Fallback to conservative estimates
    return {
      availableMemory: 2048,
      cpuUsage: 60,
      activeContainers: 5
    };
  }
}
```

### 4. **Docker Compose Optimization for On-Demand**

#### 4.1 Enhanced Profile-Based Management
```yaml
# Enhanced docker-compose.yml sections for on-demand AI

services:
  # Minimal AI service (always available, minimal footprint)
  ai-router:
    image: node:18-alpine
    container_name: ai-router
    working_dir: /app
    command: ["node", "ai-lifecycle-manager.js"]
    volumes:
      - ./scripts:/app
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
      - DOCKER_HOST=unix:///var/run/docker.sock
    deploy:
      resources:
        limits:
          memory: 64M
          cpus: "0.1"
    restart: unless-stopped
    
  # On-demand Ollama (managed by ai-router)
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    profiles: ["ai-heavy", "on-demand"]  # Only start when needed
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
      - OLLAMA_KEEP_ALIVE=5m          # Unload models after 5 min idle
      - OLLAMA_MAX_LOADED_MODELS=1    # Only one model in memory
      - OLLAMA_MAX_QUEUE=3            # Small queue to avoid memory buildup
    volumes:
      - ./data/ollama:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
        reservations:
          memory: 512M    # Minimal reservation
          cpus: "0.5"
    restart: "no"           # Manual control only
    stop_grace_period: 30s  # Allow graceful model unloading

  # Lightweight SQLite (minimal footprint)
  sqlite-ai:
    image: alpine:latest
    container_name: sqlite-ai
    profiles: ["ai-light", "always"]   # Light profile for minimal ops
    volumes:
      - ./data:/data
    command: ["tail", "-f", "/dev/null"]
    deploy:
      resources:
        limits:
          memory: 32M
          cpus: "0.1"
    restart: "no"
```

### 5. **Automated Resource Management Scripts**

#### 5.1 System Resource Monitor
```bash
#!/bin/bash
# File: scripts/resource-monitor.sh

MEMORY_THRESHOLD=85  # Stop AI services if memory usage > 85%
CPU_THRESHOLD=90     # Stop AI services if CPU usage > 90%
CHECK_INTERVAL=60    # Check every minute

monitor_resources() {
    while true; do
        # Get current memory usage percentage
        memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        
        # Get current CPU usage (average over 1 minute)
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
        
        echo "📊 System Resources: Memory ${memory_usage}%, CPU ${cpu_usage}%"
        
        # Check if we need to free resources
        if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ] || [ "${cpu_usage%.*}" -gt "$CPU_THRESHOLD" ]; then
            echo "⚠️ High resource usage detected, stopping AI services"
            ./ai-lifecycle-manager.sh stop
            
            # Wait for resources to free up
            sleep 120
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Run in background
monitor_resources &
echo $! > /tmp/resource-monitor.pid
echo "🚀 Resource monitor started (PID: $(cat /tmp/resource-monitor.pid))"
```

#### 5.2 Smart Workflow Scheduler
```javascript
// N8N Workflow: Smart Resource-Aware Scheduler
async function scheduleAITasks() {
  const pendingTasks = await getPendingAITasks();
  const systemResources = await getSystemResources();
  
  // Group tasks by resource requirements
  const lightTasks = pendingTasks.filter(task => task.complexity === 'low');
  const heavyTasks = pendingTasks.filter(task => task.complexity === 'high');
  
  if (systemResources.availableMemory > 4096) {
    // Enough resources for heavy tasks
    console.log('💪 Sufficient resources, processing heavy tasks');
    await processTasks(heavyTasks.concat(lightTasks));
  } else if (systemResources.availableMemory > 2048) {
    // Moderate resources, light tasks only
    console.log('⚡ Moderate resources, processing light tasks only');
    await processTasks(lightTasks);
    await deferTasks(heavyTasks, 1800000); // Defer heavy tasks 30 minutes
  } else {
    // Low resources, defer all AI tasks
    console.log('🚫 Low resources, deferring all AI tasks');
    await deferTasks(pendingTasks, 3600000); // Defer all tasks 1 hour
  }
}
```

## Resource Footprint Comparison

### Before: Always-On AI Services
```
Ollama (idle):        ~1GB RAM, 0.5 CPU cores
SQLite:               ~32MB RAM
Redis:                ~64MB RAM
Total idle cost:      ~1.1GB RAM, 0.5 CPU cores
```

### After: On-Demand AI Services
```
AI Router:            ~64MB RAM, 0.1 CPU cores
SQLite (optimized):   ~16MB RAM (auto-cleanup)
Redis:                ~64MB RAM
Ollama (when needed): ~1-4GB RAM, 1-2 CPU cores
Total idle cost:      ~144MB RAM, 0.1 CPU cores
Startup time:         15-30 seconds
```

### Resource Savings
- **Idle Memory**: 87% reduction (1.1GB → 144MB)
- **Idle CPU**: 80% reduction (0.5 → 0.1 cores)
- **Startup Overhead**: 15-30 seconds per AI job
- **Total Efficiency**: Pay-per-use AI resources

## Implementation Priority

### Phase 1: Immediate (2-3 hours)
1. Create `ai-lifecycle-manager.sh` script
2. Add `on-demand-ai-request.js` to N8N workflows
3. Test manual start/stop of AI services
4. Verify resource savings

### Phase 2: Automation (1 day)
1. Implement resource monitoring
2. Add auto-shutdown logic
3. Create smart workflow triggers
4. Test full on-demand cycle

### Phase 3: Optimization (2 days)
1. Fine-tune startup/shutdown timing
2. Add predictive pre-loading
3. Optimize for specific workflow patterns
4. Add comprehensive monitoring

## Success Metrics

### Resource Efficiency
- **Idle Memory Usage**: Target <200MB (vs current ~1.1GB)
- **Startup Time**: Target <30 seconds for AI services
- **Job Success Rate**: Maintain 99%+ success with on-demand model
- **Cost Efficiency**: 80%+ reduction in idle resource consumption

### Performance Impact
- **Response Time**: +15-30 seconds for first request (cold start)
- **Subsequent Requests**: Same performance as always-on
- **Reliability**: Auto-retry with fallback models
- **Monitoring**: Full visibility into resource usage patterns

This approach gives you the full power of the AI Model Dispatcher Framework while maintaining an ultra-low footprint when AI services aren't actively needed!